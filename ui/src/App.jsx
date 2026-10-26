import { useEffect, useRef, useState } from 'react'
import AdminPage from './components/AdminPage'
import Header from './components/Header'
import OrderPage from './components/OrderPage'
import {
  createOrder,
  fetchMenus,
  fetchOrders,
  updateOrderStatus,
  updateStock,
} from './data/api'
import { lineKey, linePrice, menusWithImages } from './data/menus'
import {
  cartQtyForMenu,
  clampCart,
  loadSavedCart,
  saveCart,
} from './data/storage'
import './App.css'

export default function App() {
  const [page, setPage] = useState('order')
  const [menus, setMenus] = useState([])
  const [orders, setOrders] = useState([])
  const [cart, setCart] = useState(loadSavedCart)
  const [message, setMessage] = useState('')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const cartRef = useRef(cart)
  const menusRef = useRef(menus)
  cartRef.current = cart
  menusRef.current = menus

  useEffect(() => {
    saveCart(cart)
  }, [cart])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [menuRows, orderRows] = await Promise.all([
          fetchMenus(),
          fetchOrders(),
        ])
        if (cancelled) return
        const nextMenus = menusWithImages(menuRows)
        menusRef.current = nextMenus
        setMenus(nextMenus)
        setOrders(orderRows)
        setCart((current) => clampCart(current, nextMenus))
        setReady(true)
      } catch {
        if (!cancelled) {
          setMessage('서버에 연결하지 못했습니다.')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  function addToCart(menu, optionIds = []) {
    const current = cartRef.current
    if (cartQtyForMenu(current, menu.id) >= menu.stock) {
      setMessage(`${menu.name} 재고가 부족합니다.`)
      return false
    }

    const selected = [...optionIds].sort((a, b) => a - b)
    const key = lineKey(menu.id, selected)
    const unitPrice = linePrice(menu.price, menu.options, selected)
    const options = (menu.options || []).filter((option) =>
      selected.includes(option.id),
    )
    const found = current.find((item) => item.key === key)
    const next = found
      ? current.map((item) =>
          item.key === key ? { ...item, qty: item.qty + 1 } : item,
        )
      : [
          ...current,
          {
            key,
            menuId: menu.id,
            name: menu.name,
            optionIds: selected,
            options,
            shot: options.some((option) => option.name === '샷추가'),
            syrup: options.some((option) => option.name === '시럽추가'),
            unitPrice,
            qty: 1,
          },
        ]

    cartRef.current = next
    setCart(next)
    setMessage('')
    return true
  }

  function changeCartQty(itemKey, delta) {
    const current = cartRef.current
    const target = current.find((item) => item.key === itemKey)
    if (!target) return

    const menu = menusRef.current.find((entry) => entry.id === target.menuId)
    if (
      delta > 0 &&
      menu &&
      cartQtyForMenu(current, target.menuId) >= menu.stock
    ) {
      setMessage(`${target.name} 재고가 부족합니다.`)
      return
    }

    const next = current
      .map((item) =>
        item.key === itemKey ? { ...item, qty: item.qty + delta } : item,
      )
      .filter((item) => item.qty > 0)

    cartRef.current = next
    setCart(next)
    setMessage('')
  }

  function removeCartItem(itemKey) {
    const next = cartRef.current.filter((item) => item.key !== itemKey)
    cartRef.current = next
    setCart(next)
    setMessage('')
  }

  async function placeOrder() {
    if (busy) return
    if (cart.length === 0) {
      setMessage('메뉴를 담아주세요.')
      return
    }

    setBusy(true)
    try {
      const order = await createOrder(cart)
      const nextMenus = menusWithImages(await fetchMenus())
      menusRef.current = nextMenus
      cartRef.current = []
      setMenus(nextMenus)
      setOrders((current) => [order, ...current])
      setCart([])
      setMessage('주문이 접수되었습니다.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  async function adjustStock(menuId, delta) {
    if (busy) return
    setBusy(true)
    try {
      const updated = await updateStock(menuId, delta)
      const nextMenus = menusRef.current.map((menu) =>
        menu.id === updated.id ? { ...menu, stock: updated.stock } : menu,
      )
      const nextCart = clampCart(cartRef.current, nextMenus)
      menusRef.current = nextMenus
      cartRef.current = nextCart
      setMenus(nextMenus)
      setCart(nextCart)
      setMessage('')
    } catch {
      setMessage('재고를 저장하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function startMaking(orderId) {
    if (busy) return
    setBusy(true)
    try {
      const updated = await updateOrderStatus(orderId, '제조중')
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      )
      setMessage('')
    } catch {
      setMessage('주문 상태를 변경하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function completeOrder(orderId) {
    if (busy) return
    setBusy(true)
    try {
      const updated = await updateOrderStatus(orderId, '제조완료')
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      )
      setMessage('')
    } catch {
      setMessage('주문 상태를 변경하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <Header
        page={page}
        onNavigate={(next) => {
          setPage(next)
          setMessage('')
        }}
      />
      {!ready ? (
        <p className="app-message">{message || '불러오는 중...'}</p>
      ) : page === 'order' ? (
        <OrderPage
          menus={menus}
          cart={cart}
          message={message}
          ordering={busy}
          onAdd={addToCart}
          onChangeQty={changeCartQty}
          onRemove={removeCartItem}
          onPlaceOrder={placeOrder}
        />
      ) : (
        <AdminPage
          menus={menus}
          orders={orders}
          message={message}
          onStockAdjust={adjustStock}
          onStartMaking={startMaking}
          onCompleteOrder={completeOrder}
        />
      )}
    </div>
  )
}
