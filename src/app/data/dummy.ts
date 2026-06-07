import { MenuItem, Order, Promo, AppSettings, MiscCost, SpiceLevel } from './types'

export const dummyMenuItems: MenuItem[] = [
  {
    id: 'm1', name: 'Nasi Goreng Spesial', category: 'Makanan Utama',
    description: 'Nasi goreng dengan telur, ayam, udang, dan sayuran segar pilihan',
    price: 28000, image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&auto=format',
    stock: 25, isFlashSale: true, salePrice: 20000, saleEndTime: new Date(Date.now() + 6 * 3600000).toISOString(), available: true, hasSpiceLevel: true, orderCount: 45
  },
  {
    id: 'm2', name: 'Mie Goreng Jawa', category: 'Makanan Utama',
    description: 'Mie goreng khas Jawa dengan bumbu rempah tradisional dan telur ceplok',
    price: 25000, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=300&fit=crop&auto=format',
    stock: 20, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 38
  },
  {
    id: 'm3', name: 'Ayam Bakar Madu', category: 'Makanan Utama',
    description: 'Ayam kampung bakar dengan olesan madu dan kecap, disajikan dengan lalapan',
    price: 38000, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop&auto=format',
    stock: 15, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 52, discount: 10
  },
  {
    id: 'm4', name: 'Soto Ayam Lamongan', category: 'Makanan Utama',
    description: 'Soto ayam bening khas Lamongan dengan lontong, telur, dan kerupuk',
    price: 22000, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop&auto=format',
    stock: 30, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 67
  },
  {
    id: 'm5', name: 'Rendang Sapi', category: 'Makanan Utama',
    description: 'Rendang daging sapi empuk dengan rempah Minang yang kaya aroma',
    price: 42000, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop&auto=format',
    stock: 12, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 41
  },
  {
    id: 'm6', name: 'Nasi Uduk Komplit', category: 'Makanan Utama',
    description: 'Nasi uduk gurih dengan ayam goreng, tempe, orek tempe, dan sambal',
    price: 32000, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop&auto=format',
    stock: 18, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 29
  },
  {
    id: 'm7', name: 'Ayam Goreng Kremes', category: 'Lauk',
    description: 'Potongan ayam goreng dengan kremes renyah dan sambal terasi',
    price: 18000, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop&auto=format',
    stock: 40, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 33
  },
  {
    id: 'm8', name: 'Ikan Bakar Bumbu Bali', category: 'Lauk',
    description: 'Ikan nila segar dengan bumbu bali pedas-manis yang harum',
    price: 25000, image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop&auto=format',
    stock: 10, isFlashSale: false, available: true, hasSpiceLevel: true, orderCount: 22
  },
  {
    id: 'm9', name: 'Tempe Goreng', category: 'Lauk',
    description: 'Tempe segar digoreng garing dengan tepung berbumbu rempah',
    price: 8000, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop&auto=format',
    stock: 50, isFlashSale: false, available: true, orderCount: 18
  },
  {
    id: 'm10', name: 'Gado-Gado', category: 'Sayuran',
    description: 'Sayuran segar rebus dengan lontong dan saus kacang gurih',
    price: 20000, image: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400&h=300&fit=crop&auto=format',
    stock: 15, isFlashSale: false, available: true, orderCount: 14
  },
  {
    id: 'm11', name: 'Es Teh Manis', category: 'Minuman',
    description: 'Teh manis dingin segar dengan es batu pilihan',
    price: 5000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&auto=format',
    stock: 100, isFlashSale: false, available: true, orderCount: 89
  },
  {
    id: 'm12', name: 'Es Jeruk Peras', category: 'Minuman',
    description: 'Jeruk segar diperas langsung dengan gula aren dan es batu',
    price: 8000, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop&auto=format',
    stock: 80, isFlashSale: false, available: true, orderCount: 61
  },
  {
    id: 'm13', name: 'Jus Alpukat', category: 'Minuman',
    description: 'Alpukat segar diblender dengan susu kental manis dan cokelat',
    price: 15000, image: 'https://images.unsplash.com/photo-1638176066671-2e97e7b4b9ec?w=400&h=300&fit=crop&auto=format',
    stock: 30, isFlashSale: false, available: true, orderCount: 31
  },
  {
    id: 'm14', name: 'Pisang Goreng Crispy', category: 'Dessert',
    description: 'Pisang kepok goreng dengan tepung crispy, cokelat, dan keju',
    price: 12000, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&auto=format',
    stock: 35, isFlashSale: false, available: true, orderCount: 27
  },
  {
    id: 'm15', name: 'Es Campur', category: 'Dessert',
    description: 'Es serut dengan kolang-kaling, cincau, mutiara, dan sirup merah',
    price: 13000, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&auto=format',
    stock: 25, isFlashSale: false, available: true, orderCount: 19
  },
]

const defaultMiscCosts: MiscCost[] = [
  { id: 'mc1', name: 'Biaya Layanan', type: 'percentage', value: 5 },
  { id: 'mc2', name: 'PPN 11%', type: 'percentage', value: 11 },
]

export const dummyOrders: Order[] = [
  {
    id: 'o1', orderNumber: 'ORD-001', customerName: 'Budi Santoso', customerPhone: '08123456789',
    items: [
      { menuId: 'm1', menuName: 'Nasi Goreng Spesial', price: 20000, quantity: 2, subtotal: 40000 },
      { menuId: 'm11', menuName: 'Es Teh Manis', price: 5000, quantity: 2, subtotal: 10000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 50000, miscTotal: 8000, discount: 0, total: 58000,
    status: 'completed', createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    estimatedMinutes: 15, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o2', orderNumber: 'ORD-002', customerName: 'Siti Rahayu', customerPhone: '08234567890',
    items: [
      { menuId: 'm3', menuName: 'Ayam Bakar Madu', price: 38000, quantity: 1, subtotal: 38000 },
      { menuId: 'm10', menuName: 'Gado-Gado', price: 20000, quantity: 1, subtotal: 20000 },
      { menuId: 'm12', menuName: 'Es Jeruk Peras', price: 8000, quantity: 2, subtotal: 16000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 74000, miscTotal: 11840, discount: 0, total: 85840,
    status: 'completed', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    estimatedMinutes: 20, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o3', orderNumber: 'ORD-003', customerName: 'Ahmad Wijaya', customerPhone: '08345678901',
    items: [
      { menuId: 'm5', menuName: 'Rendang Sapi', price: 42000, quantity: 1, subtotal: 42000 },
      { menuId: 'm9', menuName: 'Tempe Goreng', price: 8000, quantity: 2, subtotal: 16000 },
      { menuId: 'm11', menuName: 'Es Teh Manis', price: 5000, quantity: 1, subtotal: 5000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 63000, miscTotal: 10080, discount: 5000, promoCode: 'HEMAT10',
    total: 68080, status: 'ready', createdAt: new Date(Date.now() - 1800000).toISOString(),
    estimatedMinutes: 15, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o4', orderNumber: 'ORD-004', customerName: 'Dewi Lestari', customerPhone: '08456789012',
    items: [
      { menuId: 'm2', menuName: 'Mie Goreng Jawa', price: 25000, quantity: 2, subtotal: 50000 },
      { menuId: 'm13', menuName: 'Jus Alpukat', price: 15000, quantity: 2, subtotal: 30000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 80000, miscTotal: 12800, discount: 0, total: 92800,
    status: 'preparing', createdAt: new Date(Date.now() - 900000).toISOString(),
    estimatedMinutes: 15, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o5', orderNumber: 'ORD-005', customerName: 'Rudi Hartono', customerPhone: '08567890123',
    items: [
      { menuId: 'm4', menuName: 'Soto Ayam Lamongan', price: 22000, quantity: 3, subtotal: 66000 },
      { menuId: 'm14', menuName: 'Pisang Goreng Crispy', price: 12000, quantity: 2, subtotal: 24000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 90000, miscTotal: 14400, discount: 0, total: 104400,
    status: 'pending', createdAt: new Date(Date.now() - 300000).toISOString(),
    estimatedMinutes: 15, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o6', orderNumber: 'ORD-006', customerName: 'Maya Putri', customerPhone: '08678901234',
    items: [
      { menuId: 'm6', menuName: 'Nasi Uduk Komplit', price: 32000, quantity: 1, subtotal: 32000 },
      { menuId: 'm7', menuName: 'Ayam Goreng Kremes', price: 18000, quantity: 2, subtotal: 36000 },
      { menuId: 'm15', menuName: 'Es Campur', price: 13000, quantity: 1, subtotal: 13000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 81000, miscTotal: 12960, discount: 0, total: 93960,
    status: 'completed', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    estimatedMinutes: 20, paymentStatus: 'paid', paymentMethod: 'qris'
  },
  {
    id: 'o7', orderNumber: 'ORD-007', customerName: 'Hendra Gunawan', customerPhone: '08789012345',
    items: [
      { menuId: 'm1', menuName: 'Nasi Goreng Spesial', price: 20000, quantity: 1, subtotal: 20000 },
      { menuId: 'm8', menuName: 'Ikan Bakar Bumbu Bali', price: 25000, quantity: 1, subtotal: 25000 },
      { menuId: 'm11', menuName: 'Es Teh Manis', price: 5000, quantity: 2, subtotal: 10000 },
    ],
    miscCosts: defaultMiscCosts, subtotal: 55000, miscTotal: 8800, discount: 0, total: 63800,
    status: 'pending', createdAt: new Date(Date.now() - 120000).toISOString(),
    estimatedMinutes: 15, paymentStatus: 'paid', paymentMethod: 'qris'
  },
]

export const dummyPromos: Promo[] = [
  {
    id: 'p1', name: 'Flash Sale Akhir Bulan', code: 'FLASH50',
    type: 'percentage', value: 50, minOrder: 30000,
    validUntil: new Date(Date.now() + 6 * 3600000).toISOString(),
    active: true, usageCount: 12
  },
  {
    id: 'p2', name: 'Promo Hemat 10rb', code: 'HEMAT10',
    type: 'fixed', value: 10000, minOrder: 50000,
    validUntil: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    active: true, usageCount: 8
  },
  {
    id: 'p3', name: 'Diskon Member Baru', code: 'NEWMEMBER',
    type: 'percentage', value: 15, minOrder: 0,
    validUntil: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
    active: false, usageCount: 45
  },
]

export const defaultSettings: AppSettings = {
  restaurantName: 'Warung Makan Bu Sari',
  tagline: 'Masakan Rumah, Cita Rasa Nusantara',
  location: 'Jakarta Timur',
  address: 'Jl. Raya Bogor No. 123, Kramat Jati, Jakarta Timur 13510',
  mapsUrl: 'https://maps.google.com/?q=-6.2615,106.8613',
  phone: '021-8765-4321',
  estimatedMinutes: 15,
  miscCosts: defaultMiscCosts,
  adminPassword: 'admin123',
  spiceLevels: [
    { id: 'sl1', name: 'Tidak Pedas', icon: '😌' },
    { id: 'sl2', name: 'Pedas Sedang', icon: '🌶️' },
    { id: 'sl3', name: 'Pedas', icon: '🌶️🌶️' },
    { id: 'sl4', name: 'Ekstra Pedas', icon: '🔥' },
  ],
  customCategories: ['Makanan Utama', 'Lauk', 'Sayuran', 'Minuman', 'Dessert'],
}

export function generateOrderNumber(existingOrders: Order[]): string {
  const count = existingOrders.length + 1
  return `ORD-${String(count).padStart(3, '0')}`
}

export function calculateMiscTotal(subtotal: number, miscCosts: MiscCost[]): number {
  return miscCosts.reduce((acc, cost) => {
    if (cost.type === 'percentage') return acc + (subtotal * cost.value / 100)
    return acc + cost.value
  }, 0)
}
