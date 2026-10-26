import Cart from './Cart'
import MenuCard from './MenuCard'
import { cartQtyForMenu } from '../data/storage'

export default function OrderPage({
  menus,
  cart,
  message,
  ordering,
  onAdd,
  onChangeQty,
  onRemove,
  onPlaceOrder,
}) {
  return (
    <main className="order-page">
      <section className="menu-grid" aria-label="커피 메뉴">
        {menus.length === 0 ? (
          <p className="menu-empty">판매 중인 메뉴가 없습니다.</p>
        ) : (
          menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              reserved={cartQtyForMenu(cart, menu.id)}
              onAdd={onAdd}
            />
          ))
        )}
      </section>
      <Cart
        items={cart}
        menus={menus}
        message={message}
        ordering={ordering}
        onChangeQty={onChangeQty}
        onRemove={onRemove}
        onOrder={onPlaceOrder}
      />
    </main>
  )
}
