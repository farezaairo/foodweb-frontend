import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDate } from '../../utils/print'
import { MapPin, Phone, Clock, CheckCircle, ChefHat, Package, Home, ExternalLink } from 'lucide-react'
import {
  getOrder
} from "../../api/orderApi"

const STATUS_STEPS = [
  { key: 'pending', label: 'Pesanan Diterima', desc: 'Pesanan kamu sudah kami terima', icon: CheckCircle },
  { key: 'preparing', label: 'Sedang Dimasak', desc: 'Tim dapur sedang menyiapkan pesananmu', icon: ChefHat },
  { key: 'ready', label: 'Siap Diambil', desc: 'Pesananmu sudah siap! Segera ambil', icon: Package },
  { key: 'completed', label: 'Selesai', desc: 'Selamat menikmati makananmu!', icon: CheckCircle },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0, preparing: 1, ready: 2, completed: 3, cancelled: -1
}

export function OrderStatus() {
  const { id } = useParams<{ id: string }>()
  const { state } = useApp()
  const navigate = useNavigate()
  
  // Menggunakan state lokal untuk menampung data dari API
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadOrder()
    }
  }, [id])

  async function loadOrder() {
    try {
      const data = await getOrder(id!)
      setOrder(data)
    } catch (error) {
      console.error("Gagal memuat data pesanan:", error)
    }
  }

  // Guard clause jika data order belum selesai dimuat oleh API
  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center font-medium text-muted-foreground animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  const statusIndex = STATUS_INDEX[order.status]
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-foreground">
          <Home size={20} />
        </button>
        <h1 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>Status Pesanan</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Order Number */}
        <div className="bg-card rounded-2xl border border-border p-6 text-center" style={order.status === 'ready' ? { borderColor: '#4CAF50', borderWidth: '2px' } : {}}>
          {order.status === 'ready' && (
            <div className="text-green-600 text-sm font-semibold mb-2 flex items-center justify-center gap-1">
              <CheckCircle size={16} /> Pesanan siap diambil!
            </div>
          )}
          <div className="text-muted-foreground text-sm mb-1">Nomor Pesanan</div>
          <div className="text-4xl font-bold" style={{ color: '#D4541A', fontFamily: 'var(--font-display)' }}>{order.orderNumber}</div>
          <div className="text-sm text-muted-foreground mt-1">{formatDate(order.createdAt)}</div>
          {!isCancelled && order.status !== 'completed' && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>Estimasi: ~{order.estimatedMinutes} menit</span>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        {!isCancelled ? (
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>Status Pesanan</h3>
            <div className="space-y-0">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= statusIndex
                const active = i === statusIndex
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${active ? 'ring-4 ring-offset-2' : ''}`}
                        style={{
                          background: done ? '#D4541A' : '#EDE0D6',
                          borderColor: done ? '#D4541A' : undefined
                        }}>
                        <Icon size={18} color={done ? 'white' : '#7A5C4A'} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="w-0.5 h-8 mt-1" style={{ background: i < statusIndex ? '#D4541A' : '#EDE0D6' }} />
                      )}
                    </div>
                    <div className="pb-6 pt-1.5">
                      <div className={`text-sm font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</div>
                      {(done || active) && <div className="text-xs text-muted-foreground mt-0.5">{step.desc}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">❌</div>
            <h3 className="font-semibold text-destructive">Pesanan Dibatalkan</h3>
            <p className="text-muted-foreground text-sm mt-1">Hubungi kami jika ada pertanyaan</p>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>Detail Pesanan</h3>
          {order.items?.map((item: any, idx: number) => {
            const spiceLevel = item.spiceLevel ? state.settings.spiceLevels.find((s: any) => s.id === item.spiceLevel) : null
            return (
              <div key={`${item.menuId}-${idx}`} className="py-2 border-b border-border last:border-0">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{item.menuName} <span className="text-muted-foreground">x{item.quantity}</span></span>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
                {spiceLevel && (
                  <div className="text-xs text-muted-foreground mt-0.5">{spiceLevel.icon} {spiceLevel.name}</div>
                )}
                {item.notes && (
                  <div className="text-xs text-muted-foreground mt-0.5 italic">Catatan: {item.notes}</div>
                )}
              </div>
            )
          })}
          <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
            <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
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
              <span>Total</span><span style={{ color: '#D4541A' }}>{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground pt-1">
              <span>Pembayaran</span><span className="text-green-600 font-medium">QRIS ✓ Lunas</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <MapPin size={16} style={{ color: '#D4541A' }} /> Lokasi Pengambilan
          </h3>
          <p className="text-sm text-foreground font-medium">{state.settings.restaurantName}</p>
          <p className="text-sm text-muted-foreground mt-1">{state.settings.address}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Phone size={13} />
            <span>{state.settings.phone}</span>
          </div>
          <a href={state.settings.mapsUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium w-fit" style={{ background: '#D4541A' }}>
            <ExternalLink size={14} /> Buka di Google Maps
          </a>
        </div>

        <button onClick={() => navigate('/')} className="w-full py-3 rounded-2xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
          Pesan Lagi
        </button>
      </div>
    </div>
  )
}