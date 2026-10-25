import { formatWon, optionLabel } from '../data/menus'
import { cartQtyForMenu } from '../data/storage'

export default function Cart({
  items,
  menus,
  message,
  onChangeQty,
  onRemove,
  onOrder,
}) {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const empty = items.length === 0

  return (
    <section className="cart" aria-labelledby="cart-title">
      <div className="cart-main">
        <h2 id="cart-title" className="cart-title">
          장바구니
        </h2>
        {empty ? (
          <p className="cart-empty">담긴 메뉴가 없습니다.</p>
        ) : (
          <ul className="cart-list">
            {items.map((item) => {
              const extra = optionLabel(item.shot, item.syrup)
              const name = extra ? `${item.name}(${extra})` : item.name
              const menu = menus.find((entry) => entry.id === item.menuId)
              const canIncrease =
                menu && cartQtyForMenu(items, item.menuId) < menu.stock

              return (
                <li key={item.key} className="cart-row">
                  <span className="cart-item-name">{name}</span>
                  <span className="cart-qty">
                    <button
                      type="button"
                      className="btn stock-btn"
                      aria-label={`${name} 수량 줄이기`}
                      onClick={() => onChangeQty(item.key, -1)}
                    >
                      -
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      className="btn stock-btn"
                      aria-label={`${name} 수량 늘리기`}
                      disabled={!canIncrease}
                      onClick={() => onChangeQty(item.key, 1)}
                    >
                      +
                    </button>
                  </span>
                  <span>{formatWon(item.unitPrice * item.qty)}</span>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => onRemove(item.key)}
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="cart-side">
        <p className="cart-total">총액 {formatWon(total)}</p>
        <button
          type="button"
          className="btn"
          disabled={empty}
          onClick={onOrder}
        >
          주문하기
        </button>
        {message ? <p className="cart-message">{message}</p> : null}
      </div>
    </section>
  )
}
