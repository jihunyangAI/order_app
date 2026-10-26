export const STORAGE_KEY = 'cozydy-state'

export function loadSavedCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data?.cart) ? data.cart : []
  } catch {
    return []
  }
}

export function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart }))
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
