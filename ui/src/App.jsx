import { useEffect, useRef, useState } from 'react'
import AdminPage from './components/AdminPage'
import Header from './components/Header'
import OrderPage from './components/OrderPage'
import { lineKey, linePrice } from './data/menus'
import {
  cartQtyForMenu,
  clampCart,
  loadSavedState,
  menusFromSaved,
  saveState,
} from './data/storage'
import './App.css'

const saved = loadSavedState()

export default function App() {
  const [page, setPage] = useState('order')
  const [menus, setMenus] = useState(() => menusFromSaved(saved))
  const [orders, setOrders] = useState(() =>
    Array.isArray(saved?.orders) ? saved.orders : [],
  )
  const [nextOrderId, setNextOrderId] = useState(() =>
    Number.isInteger(saved?.nextOrderId) ? saved.nextOrderId : 1,
  )
  const [cart, setCart] = useState(() =>
    Array.isArray(saved?.cart) ? saved.cart : [],
  )
  const [message, setMessage] = useState('')
  const cartRef = useRef(cart)
  const menusRef = useRef(menus)
  cartRef.current = cart
  menusRef.current = menus

  useEffect(() => {
    saveState({
      stocks: Object.fromEntries(menus.map((menu) => [menu.id, menu.stock])),
      orders,
      nextOrderId,
      cart,
    })
  }, [menus, orders, nextOrderId, cart])

  function addToCart(menu, shot, syrup) {
    const current = cartRef.current
    if (cartQtyForMenu(current, menu.id) >= menu.stock) {
      setMessage(`${menu.name} 재고가 부족합니다.`)
      return false
    }

    const key = lineKey(menu.id, shot, syrup)
    const unitPrice = linePrice(menu.price, shot)
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
            shot,
            syrup,
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

  function placeOrder() {
    if (cart.length === 0) {
      setMessage('메뉴를 담아주세요.')
      return
    }

    const needed = {}
    for (const item of cart) {
      needed[item.menuId] = (needed[item.menuId] || 0) + item.qty
    }

    const short = menus.find((menu) => (needed[menu.id] || 0) > menu.stock)
    if (short) {
      setMessage(`${short.name} 재고가 부족합니다.`)
      return
    }

    const total = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)

    setMenus((current) =>
      current.map((menu) =>
        needed[menu.id]
          ? { ...menu, stock: menu.stock - needed[menu.id] }
          : menu,
      ),
    )
    setOrders((current) => [
      {
        id: nextOrderId,
        status: '주문접수',
        createdAt: new Date().toISOString(),
        items: cart,
        total,
      },
      ...current,
    ])
    setNextOrderId((value) => value + 1)
    cartRef.current = []
    setCart([])
    setMessage('주문이 접수되었습니다.')
  }

  function adjustStock(menuId, delta) {
    const nextMenus = menusRef.current.map((menu) =>
      menu.id === menuId
        ? { ...menu, stock: Math.max(0, menu.stock + delta) }
        : menu,
    )
    const nextCart = clampCart(cartRef.current, nextMenus)
    menusRef.current = nextMenus
    cartRef.current = nextCart
    setMenus(nextMenus)
    setCart(nextCart)
  }

  function startMaking(orderId) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId && order.status === '주문접수'
          ? { ...order, status: '제조중' }
          : order,
      ),
    )
  }

  function completeOrder(orderId) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId && order.status === '제조중'
          ? { ...order, status: '제조완료' }
          : order,
      ),
    )
  }

  return (
    <div className="app">
      <Header page={page} onNavigate={setPage} />
      {page === 'order' ? (
        <OrderPage
          menus={menus}
          cart={cart}
          message={message}
          onAdd={addToCart}
          onChangeQty={changeCartQty}
          onRemove={removeCartItem}
          onPlaceOrder={placeOrder}
        />
      ) : (
        <AdminPage
          menus={menus}
          orders={orders}
          onStockAdjust={adjustStock}
          onStartMaking={startMaking}
          onCompleteOrder={completeOrder}
        />
      )}
    </div>
  )
}
