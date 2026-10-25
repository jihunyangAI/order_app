import { INITIAL_MENUS } from './menus'

export const STORAGE_KEY = 'cozydy-state'

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null
    return data
  } catch {
    return null
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function menusFromSaved(saved) {
  const stocks = saved?.stocks ?? {}
  return INITIAL_MENUS.map((menu) =>
    Number.isInteger(stocks[menu.id])
      ? { ...menu, stock: Math.max(0, stocks[menu.id]) }
      : menu,
  )
}

export function cartQtyForMenu(cart, menuId) {
  return cart
    .filter((item) => item.menuId === menuId)
    .reduce((sum, item) => sum + item.qty, 0)
}

export function clampCart(cart, menus) {
  const used = {}
  const next = []

  for (const item of cart) {
    const menu = menus.find((entry) => entry.id === item.menuId)
    const stock = menu ? menu.stock : 0
    const usedSoFar = used[item.menuId] || 0
    const qty = Math.min(item.qty, Math.max(0, stock - usedSoFar))
    if (qty > 0) {
      next.push({ ...item, qty })
      used[item.menuId] = usedSoFar + qty
    }
  }

  return next
}
