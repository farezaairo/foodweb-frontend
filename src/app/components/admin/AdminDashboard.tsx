import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDate, printFinancialReport, exportOrdersCSV } from '../../utils/print'
import { TrendingUp, ShoppingBag, Package, Printer, Download, AlertCircle, ChefHat } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getOrders } from '../../api/orderApi' // Import API Order dari MongoDB
import { getMenus } from '../../api/menuApi'   // Import API Menu dari MongoDB
import { Order, MenuItem } from '../data/types'

export function AdminDashboard() {
  const { state } = useApp()
  const { settings } = state

  // State lokal untuk menyimpan data dari MongoDB
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Ambil data dashboard dari MongoDB saat halaman dimuat
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [ordersData, menusData] = await Promise.all([
          getOrders(),
          getMenus()
        ])
        setOrders(ordersData)
        setMenuItems(menusData)
      } catch (error) {
        console.error("Gagal memuat data dashboard admin:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'ready')
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString())
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total, 0)
  const totalFoodCost = completedOrders.reduce((s, o) => s + o.subtotal, 0)
  const estimatedProfit = totalRevenue - totalFoodCost * 0.4
  const lowStockItems = menuItems.filter(m => m.stock < 10)

  // Sales by category
  const categoryMap: Record<string, number> = {}
  orders.forEach(o => o.items.forEach(i => {
    // Validasi ID yang fleksibel untuk MongoDB (_id atau id)
    const item = menuItems.find(m => m._id === i.menuId || m.id === i.menuId)
    if (item) categoryMap[item.category] = (categoryMap[item.category] || 0) + i.subtotal
  }))
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#D4541A', '#F5A623', '#4CAF50', '#2196F3', '#9C27B0']

  // Top menu items
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  orders.forEach(o => o.items.forEach(i => {
    if (!itemMap[i.menuId]) itemMap[i.menuId] = { name: i.menuName, qty: 0, revenue: 0 }
    itemMap[i.menuId].qty += i.quantity
    itemMap[i.menuId].revenue += i.subtotal
  }))
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5)

  // Daily revenue (last 7 days)
  const dailyRevenue: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    dailyRevenue[key] = 0
  }
  completedOrders.forEach(o => {
    const d = new Date(o.createdAt)
    const key = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
    if (key in dailyRevenue) dailyRevenue[key] += o.total
  })
  const revenueData = Object.entries(dailyRevenue).map(([name, value]) => ({ name, value }))

  const stats = [
    { label: 'Total Pendapatan', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#D4541A', sub: `${completedOrders.length} pesanan selesai` },
    { label: 'Estimasi Keuntungan', value: formatCurrency(estimatedProfit), icon: TrendingUp, color: '#4CAF50', sub: 'HPP efisien 40%' },
    { label: 'Pesanan Hari Ini', value: todayOrders.length.toString(), icon: ShoppingBag, color: '#F5A623', sub: `${orders.filter(o => o.status === 'pending').length} menunggu` },
    { label: 'Total Item Menu', value: menuItems.filter(m => m.available).length.toString(), icon: Package, color: '#2196F3', sub: `${lowStockItems.length} stok menipis` },
  ]

  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center text-muted-foreground">
        <ChefHat size={40} className="animate-spin mb-2 text-primary" style={{ color: '#D4541A' }} />
        <p className="text-sm font-medium animate-pulse">Memuat data performa toko...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>Dashboard</h1>
          <p className="text-muted-foreground text-sm">Selamat datang, Admin · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportOrdersCSV(orders)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors">
            <Download size={15} /> Excel
          </button>
          <button onClick={() => printFinancialReport(orders, settings)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors" style={{ background: '#D4541A' }}>
            <Printer size={15} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '20' }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-accent/20 border border-accent/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-accent-foreground mt-0.5 flex-shrink-0" style={{ color: '#D4541A' }} />
          <div>
            <div className="font-semibold text-foreground text-sm">Stok Menipis!</div>
            <div className="text-sm text-muted-foreground mt-1">
              {lowStockItems.map(m => `${m.name} (${m.stock} sisa)`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4">Pendapatan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="value" fill="#D4541A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4">Penjualan per Kategori</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Belum ada data</div>}
        </div>
      </div>

      {/* Top Menu + Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4">Menu Terlaris</h3>
          <div className="space-y-3">
            {topItems.length > 0 ? topItems.map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: i === 0 ? '#D4541A' : i === 1 ? '#F5A623' : '#EDE0D6', color: i < 2 ? 'white' : '#7A5C4A' }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-foreground">{item.name}</span>
                <span className="text-sm font-semibold text-muted-foreground">{item.qty}x</span>
                <span className="text-sm font-semibold" style={{ color: '#D4541A' }}>{formatCurrency(item.revenue)}</span>
              </div>
            )) : <p className="text-muted-foreground text-sm">Belum ada data</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-foreground font-semibold mb-4">Pesanan Terbaru</h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map(o => {
              const currentOrderId = o._id || o.id
              return (
                <div key={currentOrderId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.orderNumber} · {formatDate(o.createdAt)}</div>
                  </div>
                  <div className="text-sm font-semibold" style={{ color: '#D4541A' }}>{formatCurrency(o.total)}</div>
                  <StatusBadge status={o.status} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stock Overview */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-foreground font-semibold mb-4">Stok Menu</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {menuItems.map(m => {
            const currentMenuId = m._id || m.id
            return (
              <div key={currentMenuId} className="p-3 rounded-xl bg-muted/50 border border-border">
                <div className="text-xs text-muted-foreground truncate mb-1">{m.name}</div>
                <div className={`text-lg font-bold ${m.stock < 5 ? 'text-destructive' : m.stock < 10 ? 'text-accent-foreground' : 'text-foreground'}`} style={{ color: m.stock < 5 ? '#D4183D' : m.stock < 10 ? '#D4541A' : undefined }}>
                  {m.stock}
                </div>
                <div className="text-xs text-muted-foreground">tersisa</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Menunggu', color: '#7A5C4A', bg: '#F5EDE4' },
    preparing: { label: 'Diproses', color: '#D4541A', bg: '#FFF3E0' },
    ready: { label: 'Siap', color: '#4CAF50', bg: '#E8F5E9' },
    completed: { label: 'Selesai', color: '#7A5C4A', bg: '#EDE0D6' },
    cancelled: { label: 'Batal', color: '#D4183D', bg: '#FFEBEE' },
  }
  const s = map[status] ?? map.pending
  return (
    <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  )
}