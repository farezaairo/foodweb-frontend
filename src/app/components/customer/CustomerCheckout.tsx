import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/print'
import { Order } from '../../data/types'
import { generateOrderNumber, calculateMiscTotal } from '../../data/dummy'
import { ArrowLeft, Minus, Plus, Trash2, Tag, User, Phone, CheckCircle, QrCode } from 'lucide-react'
import {
  createOrder
} from "../../api/orderApi"

export function CustomerCheckout() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'cart' | 'info' | 'payment' | 'done'>('cart')
  const [orderId, setOrderId] = useState('')
  const [doneOrderNumber, setDoneOrderNumber] = useState('') // Untuk menyimpan orderNumber saat sukses

  // 🎫 STATE TAMBAHAN UNTUK VOUCHER PROMO
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null)
  const [voucherError, setVoucherError] = useState('')

  const now = new Date()
  const cart = state.cart
  const subtotal = cart.reduce((s, c) => {
    let price = c.menuItem.isFlashSale && c.menuItem.salePrice && new Date(c.menuItem.saleEndTime || '') > now ? c.menuItem.salePrice : c.menuItem.price
    if (c.menuItem.discount) price = price - (price * c.menuItem.discount / 100)
    return s + price * c.quantity
  }, 0)

  // 🧮 LOGIKA PERHITUNGAN DISKON VOUCHER PROMO
  const discountAmount = appliedVoucher
    ? appliedVoucher.discountType === 'percentage'
      ? (subtotal * appliedVoucher.discountValue) / 100
      : appliedVoucher.discountValue
    : 0

  const miscTotal = calculateMiscTotal(subtotal, state.settings.miscCosts)
  
  // Total akhir dikurangi discountAmount (menggunakan Math.max agar tidak minus)
  const total = Math.max(0, subtotal + miscTotal - discountAmount)

  function getItemPrice(c: typeof cart[0]) {
    let price = c.menuItem.isFlashSale && c.menuItem.salePrice && new Date(c.menuItem.saleEndTime || '') > now ? c.menuItem.salePrice : c.menuItem.price
    if (c.menuItem.discount) price = price - (price * c.menuItem.discount / 100)
    return price
  }

  // FUNCTION VALIDASI & PASANG VOUCHER
  function handleApplyVoucher() {
    setVoucherError('')
    
    if (!voucherCode.trim()) {
      setVoucherError('Silakan masukkan kode voucher terlebih dahulu.')
      return
    }

    const foundPromo = state.promos?.find(
      (p: any) => p.code.toUpperCase() === voucherCode.trim().toUpperCase() && p.isActive
    )

    if (!foundPromo) {
      setVoucherError('Kode voucher tidak valid atau sudah kedaluwarsa.')
      setAppliedVoucher(null)
      return
    }

    if (subtotal < (foundPromo.minOrder || 0)) {
      setVoucherError(`Minimal belanja untuk promo ini adalah ${formatCurrency(foundPromo.minOrder)}`);
      setAppliedVoucher(null)
      return
    }

    setAppliedVoucher(foundPromo)
  }

  async function placeOrder() {
    try {
      const orderNumber = generateOrderNumber([])

      const payload = {
        orderNumber,
        customerName: name,
        customerPhone: phone,
        items: cart.map(c => {
          const price = getItemPrice(c)
          return {
            menuId: c.menuItem.id,
            menuName: c.menuItem.name,
            price,
            quantity: c.quantity,
            subtotal: price * c.quantity,
            notes: c.notes,
            spiceLevel: c.spiceLevel
          }
        }),
        subtotal,
        miscTotal,
        discount: discountAmount, // Kirim nominal potongan diskon voucher ke database
        promoCodeUsed: appliedVoucher?.code || undefined, // Mencatat kode voucher yang dipakai
        total,
        status: "pending",
        estimatedMinutes: state.settings.estimatedMinutes
      }

      const result = await createOrder(payload)

      dispatch({
        type: "CLEAR_CART"
      })

      setDoneOrderNumber(orderNumber) // Disimpan ke state lokal agar halaman sukses bisa membacanya
      setOrderId(result._id)
      setStep("done")
    } catch (error) {
      console.error("Gagal memproses pesanan:", error)
    }
  }

  if (cart.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-foreground font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Keranjang Kosong</h2>
          <p className="text-muted-foreground text-sm mb-6">Tambahkan menu terlebih dahulu</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#D4541A' }}>Lihat Menu</button>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: '#4CAF5020' }}>
            <CheckCircle size={42} style={{ color: '#4CAF50' }} />
          </div>
          <h2 className="text-foreground mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>Pesanan Diterima!</h2>
          <div className="text-5xl font-bold my-4" style={{ color: '#D4541A', fontFamily: 'var(--font-display)' }}>{doneOrderNumber}</div>
          <p className="text-muted-foreground text-sm mb-2">Tunjukkan nomor ini saat mengambil pesanan</p>
          <div className="bg-card rounded-2xl border border-border p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimasi waktu</span>
              <span className="font-semibold text-foreground">~{state.settings.estimatedMinutes} menit</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total dibayar</span>
              <span className="font-semibold" style={{ color: '#D4541A' }}>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pembayaran</span>
              <span className="font-semibold text-foreground">QRIS ✓</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors">Pesan Lagi</button>
            <button onClick={() => navigate(`/order/${orderId}`)} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ background: '#D4541A' }}>Lacak Pesanan</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border px-4 py-4 flex items-center gap-3">
        <button onClick={() => step === 'cart' ? navigate('/') : setStep('cart')} className="text-foreground hover:text-muted-foreground transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
          {step === 'cart' ? 'Keranjang' : step === 'info' ? 'Data Diri' : 'Pembayaran'}
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex px-6 py-4 max-w-lg mx-auto gap-2">
        {(['cart', 'info', 'payment'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step === s || (i < ['cart','info','payment'].indexOf(step)) ? 'text-white' : 'bg-muted text-muted-foreground'}`}
              style={step === s || i < ['cart','info','payment'].indexOf(step) ? { background: '#D4541A' } : {}}>
              {i + 1}
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 ${i < ['cart','info','payment'].indexOf(step) ? '' : 'bg-muted'}`} style={i < ['cart','info','payment'].indexOf(step) ? { background: '#D4541A' } : {}} />}
          </div>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* CART STEP */}
        {step === 'cart' && (
          <>
            <div className="space-y-3">
              {cart.map((c, idx) => {
                const price = getItemPrice(c)
                const spiceLevel = c.spiceLevel ? state.settings.spiceLevels.find((s: any) => s.id === c.spiceLevel) : null
                return (
                  <div key={idx} className="bg-card rounded-2xl border border-border p-3">
                    <div className="flex items-center gap-3">
                      <img src={c.menuItem.image} alt={c.menuItem.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground line-clamp-1">{c.menuItem.name}</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: '#D4541A' }}>{formatCurrency(price)}</div>
                        {spiceLevel && (
                          <div className="text-xs text-muted-foreground mt-0.5">{spiceLevel.icon} {spiceLevel.name}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { index: idx, quantity: c.quantity - 1 } })}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                          {c.quantity === 1 ? <Trash2 size={13} className="text-destructive" /> : <Minus size={13} />}
                        </button>
                        <span className="text-sm font-bold text-foreground w-4 text-center">{c.quantity}</span>
                        <button onClick={() => dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { index: idx, quantity: c.quantity + 1 } })}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: '#D4541A' }}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="text-sm font-bold text-foreground flex-shrink-0 w-20 text-right">{formatCurrency(price * c.quantity)}</div>
                    </div>
                    {c.notes && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground">Catatan: {c.notes}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 🏷️ INPUT KLAIM VOUCHER PROMO */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Tag size={14} style={{ color: '#D4541A' }} />
                <span>Punya Voucher Promo?</span>
              </div>
              <div className="flex gap-2">
                <input 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Masukkan kode promo (Contoh: HEMAT50)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm outline-none focus:border-primary bg-background text-foreground"
                  disabled={!!appliedVoucher}
                  style={{ focusBorderColor: '#D4541A' }}
                />
                {appliedVoucher ? (
                  <button 
                    onClick={() => { setAppliedVoucher(null); setVoucherCode(''); }}
                    className="px-4 py-2.5 rounded-xl border border-destructive text-destructive font-semibold text-sm hover:bg-destructive/5 transition-colors"
                  >
                    Hapus
                  </button>
                ) : (
                  <button 
                    onClick={handleApplyVoucher}
                    className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all"
                    style={{ background: '#D4541A' }}
                  >
                    Gunakan
                  </button>
                )}
              </div>
              
              {voucherError && <p className="text-xs text-destructive font-medium pl-1">{voucherError}</p>}
              {appliedVoucher && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 pl-1">
                  ✨ Voucher <b>{appliedVoucher.code}</b> Berhasil dipasang!
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              
              {state.settings.miscCosts.map((mc: any) => (
                <div key={mc.id} className="flex justify-between text-sm text-muted-foreground">
                  <span>{mc.name}{mc.type === 'percentage' ? ` (${mc.value}%)` : ''}</span>
                  <span>{formatCurrency(mc.type === 'percentage' ? subtotal * mc.value / 100 : mc.value)}</span>
                </div>
              ))}

              {/* TAMPILKAN POTONGAN DISKON JIKA ADA VOUCHER AKTIF */}
              {appliedVoucher && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 p-2 rounded-xl border border-dashed border-emerald-500/20">
                  <span>Diskon Voucher ({appliedVoucher.code})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
                <span>Total</span><span style={{ color: '#D4541A' }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </>
        )}

        {/* INFO STEP */}
        {step === 'info' && (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Data Diri Pemesan</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nama Lengkap *</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Masukkan nama Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nomor Telepon Aktif *</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxxx"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground outline-none focus:border-primary text-sm" required />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Nomor digunakan untuk konfirmasi pesanan</p>
            </div>
          </div>
        )}

        {/* PAYMENT STEP */}
        {step === 'payment' && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode size={20} style={{ color: '#D4541A' }} />
                <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Bayar via QRIS</h2>
              </div>
              {/* Dummy QRIS */}
              <div className="w-52 h-52 mx-auto rounded-2xl border-4 border-foreground flex items-center justify-center bg-white mb-4 overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/440px-QR_code_for_mobile_English_Wikipedia.svg.png" alt="QRIS" className="w-44 h-44 object-contain" />
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: '#D4541A', fontFamily: 'var(--font-display)' }}>{formatCurrency(total)}</div>
              <p className="text-xs text-muted-foreground">Scan QR code di atas menggunakan aplikasi e-wallet / m-banking Anda</p>
              <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                <span>GoPay</span><span>·</span><span>OVO</span><span>·</span><span>DANA</span><span>·</span><span>BCA</span><span>·</span><span>Mandiri</span>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium text-foreground">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telepon</span><span className="font-medium text-foreground">{phone}</span></div>
              {appliedVoucher && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><span className="text-muted-foreground">Potongan Voucher</span><span className="font-medium">-{formatCurrency(discountAmount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold" style={{ color: '#D4541A' }}>{formatCurrency(total)}</span></div>
            </div>
            <p className="text-xs text-center text-muted-foreground">Setelah melakukan pembayaran, klik tombol "Konfirmasi Pembayaran" di bawah</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          {step === 'cart' && (
            <button onClick={() => setStep('info')} className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm" style={{ background: '#D4541A' }}>
              Lanjut ke Data Diri
            </button>
          )}
          {step === 'info' && (
            <button onClick={() => { if (!name || !phone) return; setStep('payment') }} disabled={!name || !phone}
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-50" style={{ background: '#D4541A' }}>
              Lanjut ke Pembayaran
            </button>
          )}
          {step === 'payment' && (
            <button onClick={placeOrder} className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm" style={{ background: '#4CAF50' }}>
              ✓ Konfirmasi Pembayaran
            </button>
          )}
        </div>
      </div>
    </div>
  )
}