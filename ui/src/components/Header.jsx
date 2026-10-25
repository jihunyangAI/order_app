export default function Header({ page, onNavigate }) {
  return (
    <header className="header">
      <button type="button" className="logo" onClick={() => onNavigate('order')}>
        COZY - 커피주문 앱
      </button>
      <nav className="nav" aria-label="화면 이동">
        <button
          type="button"
          className={page === 'order' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('order')}
        >
          주문하기
        </button>
        <button
          type="button"
          className={page === 'admin' ? 'nav-link is-active' : 'nav-link'}
          onClick={() => onNavigate('admin')}
        >
          관리자
        </button>
      </nav>
    </header>
  )
}
