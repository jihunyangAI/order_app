import { formatWon, itemLabel, ORDER_STATUSES } from '../data/menus'

export default function AdminPage({
  menus,
  orders,
  onStockChange,
  onAdvanceStatus,
}) {
  const counts = {
    총주문: orders.length,
    주문접수: orders.filter((order) => order.status === '주문접수').length,
    제조중: orders.filter((order) => order.status === '제조중').length,
    제조완료: orders.filter((order) => order.status === '제조완료').length,
  }

  return (
    <main className="admin-page">
      <section className="admin-block" aria-labelledby="dashboard-title">
        <h2 id="dashboard-title" className="admin-title">
          관리자 대시보드
        </h2>
        <p className="dashboard-line">
          총 주문 {counts.총주문} / 주문접수 {counts.주문접수} / 제조중 {counts.제조중} /
          제조완료 {counts.제조완료}
        </p>
      </section>

      <section className="admin-block" aria-labelledby="stock-title">
        <h2 id="stock-title" className="admin-title">
          재고 현황
        </h2>
        <div className="stock-grid">
          {menus.map((menu) => (
            <label key={menu.id} className="stock-card">
              <span className="stock-name">{menu.name}</span>
              <span className="stock-input-row">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={menu.stock}
                  aria-label={`${menu.name} 재고`}
                  onChange={(event) => onStockChange(menu.id, event.target.value)}
                />
                잔
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="admin-block" aria-labelledby="orders-title">
        <h2 id="orders-title" className="admin-title">
          주문 현황
        </h2>
        {orders.length === 0 ? (
          <p className="admin-empty">들어온 주문이 없습니다.</p>
        ) : (
          <ul className="order-list">
            {orders.map((order) => {
              const done = order.status === ORDER_STATUSES[2]
              return (
                <li key={order.id} className="order-row">
                  <span className="order-id">{order.id}번</span>
                  <span className="order-total">{formatWon(order.total)}</span>
                  <span className="order-items">
                    {order.items.map((item) => (
                      <span key={item.key}>
                        {itemLabel(item)} x{item.qty} {formatWon(item.unitPrice)}
                      </span>
                    ))}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    disabled={done}
                    onClick={() => onAdvanceStatus(order.id)}
                  >
                    {order.status}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
