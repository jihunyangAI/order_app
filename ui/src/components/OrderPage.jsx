import { useState } from 'react'
import Cart from './Cart'
import MenuCard from './MenuCard'
import { lineKey, linePrice } from '../data/menus'

export default function OrderPage({ menus, onPlaceOrder }) {
  const [cart, setCart] = useState([])
  const [message, setMessage] = useState('')

  function addToCart(menu, shot, syrup) {
    if (menu.stock <= 0) return

    const key = lineKey(menu.id, shot, syrup)
    const unitPrice = linePrice(menu.price, shot)

    setCart((current) => {
      const found = current.find((item) => item.key === key)
      if (found) {
        return current.map((item) =>
          item.key === key ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [
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
    })
    setMessage('')
  }

  function placeOrder() {
    const result = onPlaceOrder(cart)
    setMessage(result.message)
    if (result.ok) setCart([])
  }

  return (
    <main className="order-page">
      <section className="menu-grid" aria-label="커피 메뉴">
        {menus.map((menu) => (
          <MenuCard key={menu.id} menu={menu} onAdd={addToCart} />
        ))}
      </section>
      <Cart items={cart} message={message} onOrder={placeOrder} />
    </main>
  )
}
