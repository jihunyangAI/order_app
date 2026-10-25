import { useState } from 'react'
import { formatWon, linePrice } from '../data/menus'

export default function MenuCard({ menu, reserved, onAdd }) {
  const [shot, setShot] = useState(false)
  const [syrup, setSyrup] = useState(false)
  const soldOut = menu.stock <= 0
  const available = Math.max(0, menu.stock - reserved)

  function handleAdd() {
    if (soldOut || available <= 0) return
    const added = onAdd(menu, shot, syrup)
    if (added !== false) {
      setShot(false)
      setSyrup(false)
    }
  }

  return (
    <article className="menu-card">
      <div className="menu-photo">
        <img src={menu.image} alt={menu.name} />
      </div>
      <h2 className="menu-name">{menu.name}</h2>
      <p className="menu-price">{formatWon(linePrice(menu.price, shot))}</p>
      <p className="menu-stock">
        재고 {menu.stock}잔
        {reserved > 0 ? ` · 담은 ${reserved}잔` : ''}
      </p>
      <p className="menu-desc">{menu.description}</p>
      <label className="option">
        <input
          type="checkbox"
          checked={shot}
          disabled={soldOut}
          onChange={(event) => setShot(event.target.checked)}
        />
        샷추가 (+500원)
      </label>
      <label className="option">
        <input
          type="checkbox"
          checked={syrup}
          disabled={soldOut}
          onChange={(event) => setSyrup(event.target.checked)}
        />
        시럽추가 (+0원)
      </label>
      <button
        type="button"
        className="btn"
        disabled={soldOut || available <= 0}
        onClick={handleAdd}
      >
        {soldOut ? '품절' : available <= 0 ? '재고 없음' : '담기'}
      </button>
    </article>
  )
}
