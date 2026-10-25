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

export function formatWon(value) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function optionLabel(shot, syrup) {
  const parts = []
  if (shot) parts.push('샷추가')
  if (syrup) parts.push('시럽추가')
  return parts.join(', ')
}

export function itemLabel(item) {
  const extra = optionLabel(item.shot, item.syrup)
  return extra ? `${item.name}(${extra})` : item.name
}

export function lineKey(menuId, shot, syrup) {
  return `${menuId}|${shot ? 1 : 0}|${syrup ? 1 : 0}`
}

export function linePrice(basePrice, shot) {
  return basePrice + (shot ? SHOT_PRICE : 0)
}

export function nextStatus(status) {
  const index = ORDER_STATUSES.indexOf(status)
  if (index === -1 || index === ORDER_STATUSES.length - 1) return status
  return ORDER_STATUSES[index + 1]
}
