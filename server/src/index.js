import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  connectWithRetry,
  getOrder,
  listMenus,
  listOrders,
  mapMenu,
  mapOrder,
  optionsForMenus,
  pool,
  setupDatabase,
} from './db.js'

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/menus', async (_req, res) => {
  try {
    res.json(await listMenus())
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '메뉴를 불러오지 못했습니다.' })
  }
})

app.patch('/api/menus/:id/stock', async (req, res) => {
  const delta = Number(req.body?.delta)
  if (!Number.isInteger(delta) || delta === 0) {
    res.status(400).json({ error: '재고를 저장하지 못했습니다.' })
    return
  }

  try {
    const { rows } = await pool.query(
      `UPDATE menus
       SET stock = GREATEST(0, stock + $1)
       WHERE id = $2
       RETURNING id, name, price, description, image, stock`,
      [delta, req.params.id],
    )

    if (rows.length === 0) {
      res.status(404).json({ error: '재고를 저장하지 못했습니다.' })
      return
    }

    res.json(mapMenu(rows[0]))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '재고를 저장하지 못했습니다.' })
  }
})

app.get('/api/orders', async (_req, res) => {
  try {
    res.json(await listOrders())
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '주문을 불러오지 못했습니다.' })
  }
})

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await getOrder(req.params.id)
    if (!order) {
      res.status(404).json({ error: '주문을 찾을 수 없습니다.' })
      return
    }
    res.json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '주문을 불러오지 못했습니다.' })
  }
})

app.post('/api/orders', async (req, res) => {
  const items = req.body?.items
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: '메뉴를 담아주세요.' })
    return
  }

  const needed = {}
  const normalized = []

  for (const item of items) {
    const menuId = item?.menuId
    const qty = Number(item?.qty)
    if (!menuId || !Number.isInteger(qty) || qty <= 0) {
      res.status(400).json({ error: '주문 항목이 올바르지 않습니다.' })
      return
    }
    needed[menuId] = (needed[menuId] || 0) + qty
    normalized.push({
      menuId,
      qty,
      optionIds: Array.isArray(item.optionIds) ? item.optionIds : null,
      shot: Boolean(item.shot),
      syrup: Boolean(item.syrup),
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const menuIds = Object.keys(needed).sort()
    const { rows: menus } = await client.query(
      `SELECT id, name, price, description, image, stock
       FROM menus
       WHERE id = ANY($1)
       FOR UPDATE`,
      [menuIds],
    )
    const optionsByMenu = await optionsForMenus(client, menuIds)

    const menuMap = new Map(menus.map((menu) => [menu.id, menu]))
    for (const menuId of menuIds) {
      const menu = menuMap.get(menuId)
      if (!menu) {
        await client.query('ROLLBACK')
        res.status(400).json({ error: '주문 항목이 올바르지 않습니다.' })
        return
      }
      if (needed[menuId] > menu.stock) {
        await client.query('ROLLBACK')
        res.status(400).json({ error: `${menu.name} 재고가 부족합니다.` })
        return
      }
    }

    let total = 0
    const priced = []
    for (const item of normalized) {
      const menu = menuMap.get(item.menuId)
      const catalog = optionsByMenu.get(item.menuId) || []
      const selected = new Map()

      if (item.optionIds) {
        for (const raw of item.optionIds) {
          const optionId = Number(raw)
          const option = catalog.find((entry) => entry.id === optionId)
          if (!option) {
            await client.query('ROLLBACK')
            res.status(400).json({ error: '주문 항목이 올바르지 않습니다.' })
            return
          }
          selected.set(option.id, option)
        }
      }

      if (item.shot) {
        const option = catalog.find((entry) => entry.name === '샷추가')
        if (option) selected.set(option.id, option)
      }
      if (item.syrup) {
        const option = catalog.find((entry) => entry.name === '시럽추가')
        if (option) selected.set(option.id, option)
      }

      const chosen = [...selected.values()]
      const unitPrice =
        menu.price + chosen.reduce((sum, option) => sum + option.price, 0)
      total += unitPrice * item.qty
      priced.push({
        menuId: item.menuId,
        qty: item.qty,
        name: menu.name,
        unitPrice,
        shot: chosen.some((option) => option.name === '샷추가'),
        syrup: chosen.some((option) => option.name === '시럽추가'),
        options: chosen.map((option) => ({
          id: option.id,
          name: option.name,
          price: option.price,
        })),
      })
    }

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (status, total)
       VALUES ('주문접수', $1)
       RETURNING id, status, total, created_at`,
      [total],
    )

    const order = orderRows[0]
    for (const item of priced) {
      await client.query(
        `INSERT INTO order_items
         (order_id, menu_id, name, shot, syrup, unit_price, qty)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.id,
          item.menuId,
          item.name,
          item.shot,
          item.syrup,
          item.unitPrice,
          item.qty,
        ],
      )
    }

    for (const menuId of menuIds) {
      await client.query('UPDATE menus SET stock = stock - $1 WHERE id = $2', [
        needed[menuId],
        menuId,
      ])
    }

    await client.query('COMMIT')
    res.status(201).json(
      mapOrder(
        order,
        priced.map((item) => ({
          key: `${item.menuId}|${item.shot ? 1 : 0}|${item.syrup ? 1 : 0}`,
          menuId: item.menuId,
          name: item.name,
          shot: item.shot,
          syrup: item.syrup,
          options: item.options,
          unitPrice: item.unitPrice,
          qty: item.qty,
        })),
      ),
    )
  } catch (error) {
    await client.query('ROLLBACK')
    console.error(error)
    res.status(500).json({ error: '주문을 접수하지 못했습니다.' })
  } finally {
    client.release()
  }
})

app.patch('/api/orders/:id/status', async (req, res) => {
  const next = req.body?.status
  const allowed = {
    주문접수: '제조중',
    제조중: '제조완료',
  }

  if (next !== '제조중' && next !== '제조완료') {
    res.status(400).json({ error: '주문 상태를 변경하지 못했습니다.' })
    return
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1',
      [req.params.id],
    )
    const order = rows[0]
    if (!order || allowed[order.status] !== next) {
      res.status(400).json({ error: '주문 상태를 변경하지 못했습니다.' })
      return
    }

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [
      next,
      order.id,
    ])

    const orders = await listOrders()
    res.json(orders.find((entry) => entry.id === order.id))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '주문 상태를 변경하지 못했습니다.' })
  }
})

async function start() {
  await connectWithRetry()
  await setupDatabase()
  app.listen(port, () => {
    console.log(`API http://127.0.0.1:${port}`)
  })
}

start().catch((error) => {
  console.error('서버를 시작하지 못했습니다.', error)
  process.exit(1)
})
