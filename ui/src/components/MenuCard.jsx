import { useState } from 'react'
import { formatWon, linePrice } from '../data/menus'

export default function MenuCard({ menu, reserved, onAdd }) {
  const options = menu.options || []
  const [selected, setSelected] = useState([])
  const soldOut = menu.stock <= 0
  const available = Math.max(0, menu.stock - reserved)
  const price = linePrice(menu.price, options, selected)

  function toggleOption(optionId) {
    setSelected((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    )
  }

  function handleAdd() {
    if (soldOut || available <= 0) return
    const added = onAdd(menu, selected)
    if (added !== false) {
      setSelected([])
    }
  }

  return (
    <article className="menu-card">
      <div className="menu-photo">
        <img src={menu.image} alt={menu.name} />
      </div>
      <h2 className="menu-name">{menu.name}</h2>
      <p className="menu-price">{formatWon(price)}</p>
      <p className="menu-stock">
        재고 {menu.stock}잔
        {reserved > 0 ? ` · 담은 ${reserved}잔` : ''}
      </p>
      <p className="menu-desc">{menu.description}</p>
      {options.map((option) => (
        <label key={option.id} className="option">
          <input
            type="checkbox"
            checked={selected.includes(option.id)}
            disabled={soldOut}
            onChange={() => toggleOption(option.id)}
          />
          {option.name} (+{formatWon(option.price)})
        </label>
      ))}
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
