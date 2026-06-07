import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDate, printOrderReceipt, printKitchenTicket, exportOrdersCSV } from '../../utils/print'
import { Order, OrderStatus } from '../../data/types'
import { StatusBadge } from './AdminDashboard'
import { Search, Filter, Printer, Download, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getOrders, updateOrderStatus } from '../../api/orderApi' // Memuat API Order

type SortKey = 'createdAt' | 'total' | 'itemCount'
type SortDir = 'asc' | 'desc'

const STATUS_OPTIONS: (OrderStatus | 'all')[] = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled']
const STATUS_LABELS: Record<string, string> = {
  all: 'Semua', pending: 'Menunggu', preparing: 'Diproses', ready: 'Siap Diambil', completed: 'Selesai', cancelled: 'Dibatalkan'
}

export function AdminOrders() {
  const { state } = useApp() // dispatch dilepas karena diganti fungsi API
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [menuFilter, setMenuFilter] = useState('')

  // Ambil data dari MongoDB API
  async function fetchOrders() {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Gagal mengambil data pesanan dari MongoDB:", error)
    } finally {
      setLoading(false)
    }
  }

  // Effect untuk inisialisasi awal dan auto-refresh (Polling) setiap 10 detik
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(() => {
      fetchOrders()
    }, 10000) // 10 detik

    return () => clearInterval(interval)
  }, [])

  // Fungsi mengubah status pesanan ke MongoDB
  async function handleUpdateStatus(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status)
      // Perbarui state lokal secara instan tanpa menunggu polling berikutnya
      setOrders(prevOrders => 
        prevOrders.map(o => o._id === id ? { ...o, status } : o)
      )
    } catch (error) {
      console.error("Gagal memperbarui status pesanan:", error)
    }
  }

  const filtered = useMemo(() => {
    let list = orders.filter(o => {
      // Menyesuaikan id MongoDB (_id) atau id dummy penunjang backward-compatibility
      const orderId = o._id || o.id 
      const matchSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.includes(search)
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      const matchMenu = !menuFilter || o.items.some((i: any) => i.menuName.toLowerCase().includes(menuFilter.toLowerCase()))
      return matchSearch && matchStatus && matchMenu
    })

    list = [...list].sort((a, b) => {
      let va: number, vb: number
      if (sortKey === 'createdAt') { va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime() }
      else if (sortKey === 'total') { va = a.total; vb = b.total }
      else { va = a.items.reduce((s: number, i: any) => s + i.quantity, 0); vb = b.items.reduce((s: number, i: any) => s + i.quantity, 0) }
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return list
  }, [orders, search, statusFilter, sortKey, sortDir, menuFilter])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <button onClick={() => toggleSort(k)} className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${active ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`} style={active ? { background: '#D4541A' } : {}}>
        {label}
        {active ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
      </button>
    )
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Memuat data pesanan...</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>Pesanan Masuk</h1>
          <p className="text-muted-foreground text-sm">{filtered.length} pesanan ditampilkan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportOrdersCSV(orders)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nomor, nama, telepon..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary" />
          </div>
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={menuFilter} onChange={e => setMenuFilter(e.target.value)} placeholder="Filter menu (contoh: Nasi Goreng)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${statusFilter === s ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}
              style={statusFilter === s ? { background: '#D4541A' } : {}}
            >{STATUS_LABELS[s]}</button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Urutkan:</span>
          <SortBtn k="createdAt" label="Waktu" />
          <SortBtn k="total" label="Total" />
          <SortBtn k="itemCount" label="Jumlah Item" />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">Tidak ada pesanan ditemukan</div>
        )}
        {filtered.map(order => {
          const currentId = order._id || order.id
          return (
            <div key={currentId} className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(expanded === currentId ? null : currentId)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                    {order.promoCode && <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full font-medium">{order.promoCode}</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {order.customerName} · {order.customerPhone} · {formatDate(order.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {order.items.map((i: any) => `${i.menuName}(${i.quantity})`).join(', ')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-foreground">{formatCurrency(order.total)}</div>
                  {expanded === currentId ? <ChevronUp size={16} className="text-muted-foreground ml-auto mt-1" /> : <ChevronDown size={16} className="text-muted-foreground ml-auto mt-1" />}
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded === currentId && (
                <div className="border-t border-border p-4 space-y-4 bg-muted/20">
                  {/* Items */}
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Detail Pesanan</div>
                    {order.items.map((i: any, idx: number) => {
                      const spiceLevel = i.spiceLevel ? state.settings.spiceLevels.find((s: any) => s.id === i.spiceLevel) : null
                      return (
                        <div key={`${i.menuId}-${idx}`} className="py-1.5 border-b border-border last:border-0">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground">{i.menuName} <span className="text-muted-foreground">x{i.quantity}</span></span>
                            <span className="font-medium text-foreground">{formatCurrency(i.subtotal)}</span>
                          </div>
                          {spiceLevel && (
                            <div className="text-xs text-muted-foreground mt-0.5">{spiceLevel.icon} {spiceLevel.name}</div>
                          )}
                          {i.notes && (
                            <div className="text-xs text-muted-foreground mt-0.5 italic">Catatan: {i.notes}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Costs */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.miscCosts?.map((mc: any) => (
                      <div key={mc.id} className="flex justify-between text-sm text-muted-foreground">
                        <span>{mc.name}{mc.type === 'percentage' ? ` (${mc.value}%)` : ''}</span>
                        <span>{formatCurrency(mc.type === 'percentage' ? order.subtotal * mc.value / 100 : mc.value)}</span>
                      </div>
                    ))}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm" style={{ color: '#4CAF50' }}>
                        <span>Diskon ({order.promoCode})</span><span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                      <span>TOTAL</span><span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Est time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>Estimasi selesai: {order.estimatedMinutes} menit</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'pending' && (
                      <button onClick={() => handleUpdateStatus(currentId, 'preparing')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#D4541A' }}>
                        <Clock size={14} /> Proses Sekarang
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button onClick={() => handleUpdateStatus(currentId, 'ready')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#4CAF50' }}>
                        <CheckCircle size={14} /> Tandai Siap
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button onClick={() => handleUpdateStatus(currentId, 'completed')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: '#2196F3' }}>
                        <CheckCircle size={14} /> Selesai Diambil
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <button onClick={() => handleUpdateStatus(currentId, 'cancelled')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                        <XCircle size={14} /> Batalkan
                      </button>
                    )}
                    <button onClick={() => printOrderReceipt(order, state.settings)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      <Printer size={14} /> Struk
                    </button>
                    <button onClick={() => printKitchenTicket(order)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      <Printer size={14} /> Tiket Dapur
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}