import pg from 'pg'

const INITIAL_MENUS = [
  {
    id: 'ice-americano',
    name: '아메리카노(ICE)',
    price: 4000,
    description: '차갑게 내린 에스프레소',
    stock: 10,
    sortOrder: 1,
    image: '/menus/ice-americano.jpg',
  },
  {
    id: 'hot-americano',
    name: '아메리카노(HOT)',
    price: 4000,
    description: '따뜻하고 진한 에스프레소',
    stock: 10,
    sortOrder: 2,
    image: '/menus/hot-americano.jpg',
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    description: '우유와 에스프레소를 섞은 라떼',
    stock: 10,
    sortOrder: 3,
    image: '/menus/cafe-latte.jpg',
  },
]

const INITIAL_OPTIONS = [
  { name: '샷추가', price: 500 },
  { name: '시럽추가', price: 0 },
]

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function connectWithRetry(retries = 20) {
  let lastError
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw lastError
}

export async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS menus (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      sort_order INTEGER NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT ''
    )
  `)

  await pool.query(`
    ALTER TABLE menus
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
  `)
  await pool.query(`
    ALTER TABLE menus
    ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT ''
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price INTEGER NOT NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS menu_options (
      menu_id TEXT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
      PRIMARY KEY (menu_id, option_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('주문접수', '제조중', '제조완료')),
      total INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id TEXT NOT NULL REFERENCES menus(id),
      name TEXT NOT NULL,
      shot BOOLEAN NOT NULL DEFAULT FALSE,
      syrup BOOLEAN NOT NULL DEFAULT FALSE,
      unit_price INTEGER NOT NULL,
      qty INTEGER NOT NULL CHECK (qty > 0)
    )
  `)

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM menus')
  if (rows[0].count === 0) {
    for (const menu of INITIAL_MENUS) {
      await pool.query(
        `INSERT INTO menus (id, name, price, description, stock, sort_order, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          menu.id,
          menu.name,
          menu.price,
          menu.description,
          menu.stock,
          menu.sortOrder,
          menu.image,
        ],
      )
    }
  } else {
    for (const menu of INITIAL_MENUS) {
      await pool.query(
        `UPDATE menus
         SET sort_order = $1, image = $2
         WHERE id = $3`,
        [menu.sortOrder, menu.image, menu.id],
      )
    }
  }

  const { rows: optionCount } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM options',
  )
  if (optionCount[0].count === 0) {
    for (const option of INITIAL_OPTIONS) {
      await pool.query('INSERT INTO options (name, price) VALUES ($1, $2)', [
        option.name,
        option.price,
      ])
    }
  }

  const { rows: optionRows } = await pool.query(
    'SELECT id, name FROM options ORDER BY id',
  )
  const { rows: menus } = await pool.query('SELECT id FROM menus')
  for (const menu of menus) {
    for (const option of optionRows) {
      await pool.query(
        `INSERT INTO menu_options (menu_id, option_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [menu.id, option.id],
      )
    }
  }
}

export function mapMenu(row, options = []) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    image: row.image || '',
    stock: row.stock,
    options,
  }
}

export function mapItem(row) {
  const shot = Boolean(row.shot)
  const syrup = Boolean(row.syrup)
  const options = []
  if (shot) options.push({ name: '샷추가' })
  if (syrup) options.push({ name: '시럽추가' })
  return {
    key: `${row.menu_id}|${shot ? 1 : 0}|${syrup ? 1 : 0}`,
    menuId: row.menu_id,
    name: row.name,
    shot,
    syrup,
    options,
    unitPrice: row.unit_price,
    qty: row.qty,
  }
}

export function mapOrder(row, items) {
  return {
    id: row.id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    items,
    total: row.total,
  }
}

export async function listMenus() {
  const { rows } = await pool.query(
    `SELECT id, name, price, description, image, stock
     FROM menus
     ORDER BY sort_order, id`,
  )
  const { rows: optionRows } = await pool.query(
    `SELECT mo.menu_id, o.id, o.name, o.price
     FROM menu_options mo
     JOIN options o ON o.id = mo.option_id
     ORDER BY o.id`,
  )

  const grouped = new Map(rows.map((row) => [row.id, []]))
  for (const option of optionRows) {
    grouped.get(option.menu_id)?.push({
      id: option.id,
      name: option.name,
      price: option.price,
    })
  }

  return rows.map((row) => mapMenu(row, grouped.get(row.id) || []))
}

async function itemsByOrderIds(ids) {
  const grouped = new Map(ids.map((id) => [id, []]))
  if (ids.length === 0) return grouped

  const { rows: items } = await pool.query(
    `SELECT order_id, menu_id, name, shot, syrup, unit_price, qty
     FROM order_items
     WHERE order_id = ANY($1)
     ORDER BY id`,
    [ids],
  )

  for (const item of items) {
    grouped.get(item.order_id).push(mapItem(item))
  }
  return grouped
}

export async function listOrders() {
  const { rows: orders } = await pool.query(
    `SELECT id, status, total, created_at
     FROM orders
     ORDER BY id DESC`,
  )
  const grouped = await itemsByOrderIds(orders.map((order) => order.id))
  return orders.map((order) => mapOrder(order, grouped.get(order.id)))
}

export async function getOrder(id) {
  const orderId = Number(id)
  if (!Number.isInteger(orderId)) return null

  const { rows } = await pool.query(
    `SELECT id, status, total, created_at
     FROM orders
     WHERE id = $1`,
    [orderId],
  )
  if (rows.length === 0) return null

  const grouped = await itemsByOrderIds([orderId])
  return mapOrder(rows[0], grouped.get(orderId))
}

export async function optionsForMenus(client, menuIds) {
  if (menuIds.length === 0) return new Map()

  const { rows } = await client.query(
    `SELECT mo.menu_id, o.id, o.name, o.price
     FROM menu_options mo
     JOIN options o ON o.id = mo.option_id
     WHERE mo.menu_id = ANY($1)`,
    [menuIds],
  )

  const grouped = new Map(menuIds.map((id) => [id, []]))
  for (const row of rows) {
    grouped.get(row.menu_id).push({
      id: row.id,
      name: row.name,
      price: row.price,
    })
  }
  return grouped
}
