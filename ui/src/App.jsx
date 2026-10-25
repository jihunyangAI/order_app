import { useState } from 'react'
import AdminPage from './components/AdminPage'
import Header from './components/Header'
import OrderPage from './components/OrderPage'
import { INITIAL_MENUS, nextStatus } from './data/menus'
import './App.css'

export default function App() {
  const [page, setPage] = useState('order')
  const [menus, setMenus] = useState(INITIAL_MENUS)
  const [orders, setOrders] = useState([])
  const [nextOrderId, setNextOrderId] = useState(1)

  function placeOrder(cart) {
    if (cart.length === 0) {
      return { ok: false, message: '메뉴를 담아주세요.' }
    }

    const needed = {}
    for (const item of cart) {
      needed[item.menuId] = (needed[item.menuId] || 0) + item.qty
    }

    const short = menus.find((menu) => (needed[menu.id] || 0) > menu.stock)
    if (short) {
      return { ok: false, message: `${short.name} 재고가 부족합니다.` }
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
        items: cart,
        total,
      },
      ...current,
    ])
    setNextOrderId((value) => value + 1)

    return { ok: true, message: '주문이 접수되었습니다.' }
  }

  function changeStock(menuId, value) {
    const stock = Math.max(0, Math.floor(Number(value) || 0))
    setMenus((current) =>
      current.map((menu) => (menu.id === menuId ? { ...menu, stock } : menu)),
    )
  }

  function advanceStatus(orderId) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: nextStatus(order.status) }
          : order,
      ),
    )
  }

  return (
    <div className="app">
      <Header page={page} onNavigate={setPage} />
      {page === 'order' ? (
        <OrderPage menus={menus} onPlaceOrder={placeOrder} />
      ) : (
        <AdminPage
          menus={menus}
          orders={orders}
          onStockChange={changeStock}
          onAdvanceStatus={advanceStatus}
        />
      )}
    </div>
  )
}
