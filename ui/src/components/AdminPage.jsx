import {
  formatDateTime,
  formatWon,
  itemLabel,
  stockLabel,
} from '../data/menus'

const DASHBOARD_ITEMS = [
  { key: '총주문', label: '총 주문' },
  { key: '주문접수', label: '주문접수' },
  { key: '제조중', label: '제조중' },
  { key: '제조완료', label: '제조완료' },
]

export default function AdminPage({
  menus,
  orders,
  onStockAdjust,
  onStartMaking,
  onCompleteOrder,
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
        <div className="dashboard-grid">
          {DASHBOARD_ITEMS.map((item) => (
            <article key={item.key} className="dashboard-card">
              <p className="dashboard-label">{item.label}</p>
              <p className="dashboard-count">{counts[item.key]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-block" aria-labelledby="stock-title">
        <h2 id="stock-title" className="admin-title">
          재고 현황
        </h2>
        <div className="stock-grid">
          {menus.map((menu) => {
            const status = stockLabel(menu.stock)
            return (
              <article key={menu.id} className="stock-card">
                <h3 className="stock-name">{menu.name}</h3>
                <p className="stock-meta">
                  <span className="stock-count">{menu.stock}잔</span>
                  <span className={`stock-status is-${status}`}>{status}</span>
                </p>
                <div className="stock-actions">
                  <button
                    type="button"
                    className="btn stock-btn"
                    disabled={menu.stock <= 0}
                    aria-label={`${menu.name} 재고 줄이기`}
                    onClick={() => onStockAdjust(menu.id, -1)}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    className="btn stock-btn"
                    aria-label={`${menu.name} 재고 늘리기`}
                    onClick={() => onStockAdjust(menu.id, 1)}
                  >
                    +
                  </button>
                </div>
              </article>
            )
          })}
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
            {orders.map((order) => (
              <li key={order.id} className="order-row">
                <div className="order-meta">
                  <p className="order-id">{order.id}번</p>
                  <p className="order-time">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <p key={item.key}>
                      {itemLabel(item)} x{item.qty} {formatWon(item.unitPrice * item.qty)}
                    </p>
                  ))}
                </div>
                <p className="order-total">{formatWon(order.total)}</p>
                <p className="order-status">{order.status}</p>
                {order.status === '주문접수' ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onStartMaking(order.id)}
                  >
                    제조시작
                  </button>
                ) : null}
                {order.status === '제조중' ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onCompleteOrder(order.id)}
                  >
                    제조완료
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
