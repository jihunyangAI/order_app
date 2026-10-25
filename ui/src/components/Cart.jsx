import { formatWon, optionLabel } from '../data/menus'

export default function Cart({ items, message, onOrder }) {
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
              return (
                <li key={item.key} className="cart-row">
                  <span>
                    {name} x{item.qty}
                  </span>
                  <span>{formatWon(item.unitPrice * item.qty)}</span>
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
