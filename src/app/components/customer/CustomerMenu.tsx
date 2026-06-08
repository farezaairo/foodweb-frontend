import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/print'
import { MenuItem } from '../../data/types'
import { ShoppingCart, Search, FlameKindling, Plus, Minus, MapPin, ChefHat, Clock, Star, Flame, AlertCircle, Tag } from 'lucide-react'
import { getMenus } from '../../api/menuApi' 
import { getSettings } from '../../api/pengaturan' // Sinkronisasi API Pengaturan Terpusat

export function CustomerMenu() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]) 
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | 'Semua'>('Semua')
  const [flashSaleOnly, setFlashSaleOnly] = useState(false)
  const [addingItem, setAddingItem] = useState<MenuItem | null>(null)
  const [addQty, setAddQty] = useState(1)
  const [addNotes, setAddNotes] = useState('')
  const [addSpiceLevel, setAddSpiceLevel] = useState('')

  // Sinkronisasi data Menu & Pengaturan Restoran dari MongoDB Cloud secara bersamaan
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // Eksekusi paralel agar loading data lebih responsif
        const [menuData, settingsData] = await Promise.all([
          getMenus(),
          getSettings()
        ])

        setMenuItems(menuData || [])

        // Update state global AppContext agar tersinkronisasi di perangkat pelanggan
        if (settingsData) {
          dispatch({
            type: 'UPDATE_SETTINGS',
            payload: settingsData
          })
        }
      } catch (error) {
        console.error("Gagal sinkronisasi data operasional server:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dispatch])

  // Validasi status operasional restoran dari pengaturan
  const isRestoOpen = state.settings?.isOperational !== false

  const cartCount = state.cart.reduce((s, c) => s + c.quantity, 0)
  const cartTotal = state.cart.reduce((s, c) => {
    const price = c.menuItem.isFlashSale && c.menuItem.salePrice ? c.menuItem.salePrice : c.menuItem.price
    return s + price * c.quantity
  }, 0)

  const now = new Date()
  
  // Filter menuItems berdasarkan pencarian dan kategori dari database cloud
  const allMenuItems = menuItems.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'Semua' || m.category === category
    const matchFlash = !flashSaleOnly || (m.isFlashSale && m.salePrice && new Date(m.saleEndTime || '') > now)
    return matchSearch && matchCat && matchFlash
  })

  const flashSaleItems = menuItems.filter(m => m.isFlashSale && m.salePrice && m.available && m.stock > 0 && new Date(m.saleEndTime || '') > now)
  
  const favoriteItems = [...menuItems]
    .filter(m => m.available && m.stock > 0)
    .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
    .slice(0, 6)

  function openAdd(item: MenuItem) {
    if (!isRestoOpen) return // Blokir aksi modal tambah jika restoran tutup
    setAddingItem(item)
    setAddQty(1)
    setAddNotes('')
    setAddSpiceLevel(item.hasSpiceLevel ? state.settings?.spiceLevels?.[0]?.id || '' : '')
  }

  function confirmAdd() {
    if (!addingItem) return
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        item: addingItem,
        quantity: addQty,
        notes: addNotes.trim() || undefined,
        spiceLevel: addSpiceLevel || undefined
      }
    })
    setAddingItem(null)
  }

  function getEffectivePrice(item: MenuItem) {
    const basePrice = item.isFlashSale && item.salePrice && new Date(item.saleEndTime || '') > now ? item.salePrice : item.price
    if (item.discount) return basePrice - (basePrice * item.discount / 100)
    return basePrice
  }

  function hasDiscount(item: MenuItem) {
    return !!(item.discount && item.discount > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground p-6">
        <ChefHat size={40} className="animate-bounce mb-2" style={{ color: '#D4541A' }} />
        <p className="text-sm font-medium animate-pulse">Menyiapkan hidangan lezat untukmu...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      
      {/* Banner info ketika status operasional diatur TUTUP */}
      {!isRestoOpen && (
        <div className="bg-destructive text-white text-center py-2.5 px-4 text-xs font-bold sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md">
          <AlertCircle size={14} className="animate-pulse" />
          <span>Restoran Tutup Sementara. Menu hanya dapat dilihat & tidak dapat dipesan.</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #D4541A 0%, #B83A00 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative px-4 pt-10 pb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ChefHat size={22} color="white" />
            </div>
            <div>
              <h1 className="text-white" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700 }}>
                {state.settings?.restaurantName || 'Digital Menu'}
              </h1>
              <p className="text-white/80 text-xs">{state.settings?.tagline || 'Selamat Datang!'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/70 text-xs mt-1">
            <MapPin size={11} />
            <span>{state.settings?.location || 'Lokasi Restoran'}</span>
            <span className="mx-2">·</span>
            <Clock size={11} />
            {/* Menampilkan text jam operasional dinamis dari menu AdminSettings */}
            <span>{state.settings?.operationalHours || 'Setiap Hari, 09:00 - 21:00'}</span>
          </div>

          {/* Search */}
          <div className="relative mt-5">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari menu favorit kamu..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-foreground text-sm outline-none shadow-lg placeholder-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-32">
        {/* Flash Sale Banner */}
        {flashSaleItems.length > 0 && (
          <div className="mt-5 rounded-2xl overflow-hidden border border-amber-200" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE0B2 100%)' }}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FlameKindling size={18} style={{ color: '#D4541A' }} />
                <span className="font-bold" style={{ color: '#D4541A', fontFamily: 'var(--font-display)' }}>Flash Sale!</span>
                <span className="text-xs text-muted-foreground">Terbatas, segera pesan!</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {flashSaleItems.map(item => {
                  const currentId = item._id || item.id
                  return (
                    <div key={currentId} onClick={() => openAdd(item)} className={`flex-shrink-0 w-36 bg-white rounded-xl overflow-hidden shadow-sm transition-shadow ${isRestoOpen ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-75'}`}>
                      <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                      <div className="p-2">
                        <div className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</div>
                        <div className="font-bold text-xs mt-0.5" style={{ color: '#D4541A' }}>{formatCurrency(item.salePrice!)}</div>
                        <div className="text-xs text-muted-foreground line-through">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Favorite Items */}
        {favoriteItems.length > 0 && category === 'Semua' && !search && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} style={{ color: '#D4541A' }} fill="#D4541A" />
              <span className="font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Menu Favorit</span>
              <span className="text-xs text-muted-foreground">Paling banyak dipesan</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {favoriteItems.map(item => {
                const currentId = item._id || item.id
                const effectivePrice = getEffectivePrice(item)
                const isFlashActive = item.isFlashSale && item.salePrice && new Date(item.saleEndTime || '') > now
                const discounted = hasDiscount(item)
                return (
                  <div key={currentId} onClick={() => openAdd(item)} className={`flex-shrink-0 w-36 bg-card rounded-xl overflow-hidden border border-border shadow-sm transition-shadow ${isRestoOpen ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-75'}`}>
                    <div className="relative">
                      <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                      {(isFlashActive || discounted) && (
                        <span className="absolute top-1.5 left-1.5 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold" style={{ background: '#D4541A' }}>
                          {isFlashActive ? <><FlameKindling size={10} /> SALE</> : <><Flame size={10} /> -{item.discount}%</>}
                        </span>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</div>
                      <div className="font-bold text-xs mt-0.5" style={{ color: '#D4541A' }}>{formatCurrency(effectivePrice)}</div>
                      {(isFlashActive || discounted) && (
                        <div className="text-xs text-muted-foreground line-through">{formatCurrency(item.price)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Promo Voucher */}
        {state.promos && state.promos.filter((p: any) => p.isActive).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={18} style={{ color: '#D4541A' }} />
              <span className="font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Promo Spesial Untukmu</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {state.promos.filter((p: any) => p.isActive).map((promo: any) => (
                <div key={promo._id || promo.id} className="flex-shrink-0 w-64 bg-card border border-dashed border-orange-300 dark:border-orange-900 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden shadow-sm">
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-r border-orange-300 rounded-full" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-l border-orange-300 rounded-full" />
                  <div className="pl-2 flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">Voucher Diskon</div>
                    <div className="font-bold text-sm text-foreground truncate mt-0.5">
                      {promo.discountType === 'percentage' ? `Diskon ${promo.discountValue}%` : `Potongan ${formatCurrency(promo.discountValue)}`}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      Min. Belanja: {formatCurrency(promo.minOrder || 0)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 pr-2">
                    <span className="bg-orange-500/10 text-[#D4541A] font-mono font-bold text-xs px-2 py-1 rounded-lg border border-orange-500/20">
                      {promo.code}
                    </span>
                    <div className="text-[9px] text-muted-foreground">Di Checkout</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['Semua', ...(state.settings?.customCategories || [])] as const).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === cat ? 'text-white' : 'bg-card text-muted-foreground border border-border'}`}
              style={category === cat ? { background: '#D4541A' } : {}}
            >{cat}</button>
          ))}
        </div>

        {/* Menu List */}
        <div className="mt-5 space-y-3">
          {allMenuItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
              <p>Menu tidak ditemukan</p>
            </div>
          )}
          {allMenuItems.map(item => {
            const currentId = item._id || item.id
            const effectivePrice = getEffectivePrice(item)
            const isFlashActive = item.isFlashSale && item.salePrice && new Date(item.saleEndTime || '') > now
            const discounted = hasDiscount(item)
            const outOfStock = item.stock === 0 || !item.available
            
            return (
              <div key={currentId} className={`bg-card rounded-2xl border border-border flex overflow-hidden ${outOfStock || !isRestoOpen ? 'opacity-60' : ''}`}>
                <div className="relative w-32 flex-shrink-0">
                  <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${outOfStock ? 'grayscale' : ''}`} />
                  {outOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">HABIS</span>
                    </div>
                  )}
                  {!outOfStock && (isFlashActive || discounted) && (
                    <span className="absolute top-1.5 left-1.5 text-white text-xs px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 font-bold" style={{ background: '#D4541A' }}>
                      {isFlashActive ? <><FlameKindling size={10} /> SALE</> : <><Flame size={10} /> -{item.discount}%</>}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="font-semibold text-foreground text-sm">{item.name}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="font-bold" style={{ color: '#D4541A', fontSize: '15px' }}>{formatCurrency(effectivePrice)}</span>
                      {!outOfStock && (isFlashActive || discounted) && (
                        <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(item.price)}</span>
                      )}
                    </div>
                    
                    {/* Logika Tombol Pembatasan Operasional */}
                    {outOfStock ? (
                      <span className="text-xs text-muted-foreground font-medium">Tidak Tersedia</span>
                    ) : !isRestoOpen ? (
                      <span className="text-xs text-destructive font-semibold bg-destructive/10 px-2.5 py-1 rounded-lg">Tutup</span>
                    ) : (
                      <button onClick={() => openAdd(item)}
                        className="flex items-center gap-1 px-4 py-2 rounded-xl text-white text-sm font-medium transition-transform active:scale-95" style={{ background: '#D4541A' }}>
                        <Plus size={14} /> Tambah
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Cart Button (Hanya tampil jika restoran sedang BUKA) */}
      {cartCount > 0 && isRestoOpen && (
        <div className="fixed bottom-6 left-4 right-4 max-w-2xl mx-auto z-40">
          <button onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-white shadow-2xl transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, #D4541A, #B83A00)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full text-xs font-bold flex items-center justify-center" style={{ color: '#D4541A' }}>{cartCount}</span>
              </div>
              <span className="font-semibold">{cartCount} item · Lihat Keranjang</span>
            </div>
            <span className="font-bold">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* Add Quantity Modal */}
      {addingItem && isRestoOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-card rounded-t-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex gap-4 mb-5">
              <img src={addingItem.image} alt={addingItem.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              <div>
                <h3 className="font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{addingItem.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{addingItem.description}</p>
                <div className="font-bold mt-2" style={{ color: '#D4541A' }}>{formatCurrency(getEffectivePrice(addingItem))}</div>
              </div>
            </div>

            {/* Spice Level Section */}
            {addingItem.hasSpiceLevel && state.settings?.spiceLevels && state.settings.spiceLevels.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">Tingkat Kepedasan</label>
                <div className="grid grid-cols-2 gap-2">
                  {state.settings.spiceLevels.map(level => (
                    <button key={level.id} onClick={() => setAddSpiceLevel(level.id)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${addSpiceLevel === level.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
                      style={addSpiceLevel === level.id ? { borderColor: '#D4541A', background: '#D4541A20' } : {}}>
                      <div className="text-lg mb-1">{level.icon}</div>
                      <div className="text-xs text-foreground">{level.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Catatan (Opsional)</label>
              <textarea value={addNotes} onChange={e => setAddNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input-background text-foreground text-sm outline-none focus:border-primary resize-none"
                rows={2} placeholder="Contoh: Tanpa bawang goreng, bumbu tidak terlalu pedas"
              />
            </div>

            {/* Quantity Section */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Jumlah</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setAddQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors">
                  <Minus size={18} />
                </button>
                <span className="text-2xl font-bold text-foreground w-8 text-center">{addQty}</span>
                <button onClick={() => setAddQty(q => Math.min(addingItem.stock, q + 1))} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: '#D4541A' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setAddingItem(null)} className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors">Batal</button>
              <button onClick={confirmAdd} className="flex-1 py-3 rounded-xl text-white font-semibold" style={{ background: '#D4541A' }}>
                Tambah · {formatCurrency(getEffectivePrice(addingItem) * addQty)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}