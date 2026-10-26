import cafeLatte from '../assets/cafe-latte.jpg'
import hotAmericano from '../assets/hot-americano.jpg'
import iceAmericano from '../assets/ice-americano.jpg'

export const SHOT_PRICE = 500
export const ORDER_STATUSES = ['주문접수', '제조중', '제조완료']

export const INITIAL_MENUS = [
  {
    id: 'ice-americano',
    name: '아메리카노(ICE)',
    price: 4000,
    description: '차갑게 내린 에스프레소',
    stock: 10,
    image: iceAmericano,
  },
  {
    id: 'hot-americano',
    name: '아메리카노(HOT)',
    price: 4000,
    description: '따뜻하고 진한 에스프레소',
    stock: 10,
    image: hotAmericano,
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    description: '우유와 에스프레소를 섞은 라떼',
    stock: 10,
    image: cafeLatte,
  },
]

export function menusWithImages(menus) {
  return menus.map((menu) => {
    const local = INITIAL_MENUS.find((entry) => entry.id === menu.id)
    return {
      ...menu,
      image: menu.image || local?.image || '',
      description: menu.description || local?.description || '',
      options: Array.isArray(menu.options) ? menu.options : [],
    }
  })
}

export function formatWon(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function optionNames(item) {
  if (Array.isArray(item.options) && item.options.length > 0) {
    return item.options.map((option) => option.name || option)
  }
  const parts = []
  if (item.shot) parts.push('샷추가')
  if (item.syrup) parts.push('시럽추가')
  return parts
}

export function optionLabel(shot, syrup) {
  return optionNames({ shot, syrup }).join(', ')
}

export function itemLabel(item) {
  const extra = optionNames(item).join(', ')
  return extra ? `${item.name}(${extra})` : item.name
}

export function lineKey(menuId, optionIds = []) {
  return `${menuId}|${[...optionIds].sort((a, b) => a - b).join('-')}`
}

export function linePrice(basePrice, options = [], optionIds = []) {
  const extra = options
    .filter((option) => optionIds.includes(option.id))
    .reduce((sum, option) => sum + option.price, 0)
  return basePrice + extra
}

export function nextStatus(status) {
  const index = ORDER_STATUSES.indexOf(status)
  if (index === -1 || index === ORDER_STATUSES.length - 1) return status
  return ORDER_STATUSES[index + 1]
}

export function stockLabel(stock) {
  if (stock <= 0) return '품절'
  if (stock < 5) return '주의'
  return '정상'
}

export function formatDateTime(value) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
