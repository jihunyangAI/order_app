const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || '요청에 실패했습니다.')
  }
  return data
}

export function fetchMenus() {
  return request('/api/menus')
}

export function fetchOrders() {
  return request('/api/orders')
}

export function fetchOrder(orderId) {
  return request(`/api/orders/${orderId}`)
}

export function createOrder(items) {
  return request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((item) => ({
        menuId: item.menuId,
        optionIds: item.optionIds || [],
        shot: item.shot,
        syrup: item.syrup,
        qty: item.qty,
      })),
    }),
  })
}

export function updateStock(menuId, delta) {
  return request(`/api/menus/${menuId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta }),
  })
}

export function updateOrderStatus(orderId, status) {
  return request(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
