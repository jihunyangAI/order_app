import { useState } from 'react'
import { formatWon, linePrice } from '../data/menus'

export default function MenuCard({ menu, onAdd }) {
  const [shot, setShot] = useState(false)
  const [syrup, setSyrup] = useState(false)
  const soldOut = menu.stock <= 0

  function handleAdd() {
    if (soldOut) return
    onAdd(menu, shot, syrup)
    setShot(false)
    setSyrup(false)
  }

  return (
    <article className="menu-card">
      <div className="menu-photo">
        <img src={menu.image} alt={menu.name} />
      </div>
      <h2 className="menu-name">{menu.name}</h2>
      <p className="menu-price">{formatWon(linePrice(menu.price, shot))}</p>
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
        disabled={soldOut}
        onClick={handleAdd}
      >
        {soldOut ? '품절' : '담기'}
      </button>
    </article>
  )
}
