export type Category = string

export interface SpiceLevel {
  id: string
  name: string
  icon: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: Category
  image: string
  stock: number
  isFlashSale: boolean
  salePrice?: number
  saleEndTime?: string
  discount?: number
  available: boolean
  hasSpiceLevel?: boolean
  orderCount?: number
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  notes?: string
  spiceLevel?: string
}

export interface MiscCost {
  id: string
  name: string
  type: 'fixed' | 'percentage'
  value: number
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderItem {
  menuId: string
  menuName: string
  price: number
  quantity: number
  subtotal: number
  notes?: string
  spiceLevel?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  miscCosts: MiscCost[]
  subtotal: number
  miscTotal: number
  discount: number
  promoCode?: string
  total: number
  status: OrderStatus
  createdAt: string
  estimatedMinutes: number
  paymentStatus: 'paid'
  paymentMethod: 'qris'
  notes?: string
}

export interface Promo {
  id: string
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minOrder: number
  validUntil: string
  active: boolean
  usageCount: number
}

export interface AppSettings {
  restaurantName: string
  tagline: string
  location: string
  address: string
  mapsUrl: string
  phone: string
  estimatedMinutes: number
  miscCosts: MiscCost[]
  adminPassword: string
  spiceLevels: SpiceLevel[]
  customCategories: string[]
  isOperational: boolean
  operationalHours: string
}
