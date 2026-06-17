import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/print'
import { MenuItem } from '../../data/types'
import { Plus, Pencil, Trash2, Minus, FlameKindling, Package, Flame, Upload } from 'lucide-react'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../api/menuApi' 

const blankItem = (defaultCategory: string): Partial<MenuItem> => ({
  name: '', description: '', price: 0, category: defaultCategory,
  image: '', stock: 10, isFlashSale: false, available: true, hasSpiceLevel: false, discount: 0
})

export function AdminMenu() {
  const { state } = useApp() 
  const [menuItems, setMenuItems] = useState<any[]>([]) // Menggunakan any[] agar fleksibel membaca data database lama/baru
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | 'Semua'>('Semua')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<Partial<MenuItem>>(blankItem(state.settings.customCategories[0] || 'Makanan Utama'))
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  async function fetchMenus() {
    try {
      const data = await getMenus()
      setMenuItems(data)
    } catch (error) {
      console.error("Gagal mengambil data menu dari MongoDB:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  const filtered = menuItems.filter(m => filter === 'Semua' || m.category === filter)

  function openAdd() { 
    setEditing(null)
    setForm(blankItem(state.settings.customCategories[0] || 'Makanan Utama'))
    setImageFile(null)
    setImagePreview('')
    setShowModal(true) 
  }
  
  function openEdit(item: any) { 
    setEditing(item)
    // Map data database lama ke struktur form frontend
    setForm({
      name: item.nama || item.name || '',
      description: item.deskripsi || item.description || '',
      price: item.harga !== undefined ? item.harga : (item.price || 0),
      category: item.category || 'Makanan Utama',
      image: item.gambar || item.image || '',
      stock: item.stok !== undefined ? item.stok : (item.stock || 0),
      discount: item.discount || 0,
      available: item.available !== undefined ? item.available : true,
      isFlashSale: item.isFlashSale || false,
      hasSpiceLevel: item.hasSpiceLevel || false,
      salePrice: item.salePrice,
      saleEndTime: item.saleEndTime
    })
    setImageFile(null)
    setImagePreview(item.gambar || item.image || '') 
    setShowModal(true) 
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSave() {
    if (!form.name || form.price === undefined || form.price === null) return
    try {
      let dataToSend: any;

      if (imageFile) {
        // JIKA INPUT GAMBAR FISIK (Menggunakan FormData)
        const formDataObj = new FormData()
        formDataObj.append('nama', form.name.trim())
        formDataObj.append('deskripsi', form.description || '')
        formDataObj.append('harga', String(form.price))
        formDataObj.append('category', form.category || 'Makanan Utama')
        formDataObj.append('stok', String(form.stock ?? 10))
        formDataObj.append('discount', String(form.discount ?? 0))
        formDataObj.append('available', String(form.available ?? true))
        formDataObj.append('isFlashSale', String(form.isFlashSale ?? false))
        formDataObj.append('hasSpiceLevel', String(form.hasSpiceLevel ?? false))
        formDataObj.append('image', imageFile) 

        if (form.isFlashSale && form.salePrice) {
          formDataObj.append('salePrice', String(form.salePrice))
          if (form.saleEndTime) formDataObj.append('saleEndTime', form.saleEndTime)
        }
        dataToSend = formDataObj
      } else {
        // JIKA INPUT LINK URL TEKS (Menggunakan Objek JSON Murni Bahasa Indonesia)
        dataToSend = {
          nama: form.name.trim(),
          deskripsi: form.description || '',
          harga: Number(form.price),
          category: form.category || 'Makanan Utama',
          gambar: form.image || '', 
          stok: Number(form.stock ?? 10),
          discount: Number(form.discount ?? 0),
          available: form.available ?? true,
          isFlashSale: form.isFlashSale ?? false,
          hasSpiceLevel: form.hasSpiceLevel ?? false,
        }

        if (form.isFlashSale && form.salePrice) {
          dataToSend.salePrice = Number(form.salePrice)
          if (form.saleEndTime) dataToSend.saleEndTime = form.saleEndTime
        }
      }

      if (editing) {
        const currentId = editing._id || editing.id
        await updateMenu(currentId!, dataToSend)
      } else {
        await createMenu(dataToSend)
      }
      
      // Ambil ulang data segar dari database agar UI sinkron total
      await fetchMenus()
      
      setImageFile(null)
      setImagePreview('')
      setShowModal(false)
    } catch (error) {
      console.error("Gagal menyimpan data menu:", error)
      alert("Gagal menyimpan data. Periksa apakah semua kolom sudah benar.")
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenu(id)
      setMenuItems(prev => prev.filter(m => m._id !== id && m.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Gagal menghapus menu:", error)
    }
  }

  async function adjustStock(id: string, delta: number) {
    const item = menuItems.find(m => m._id === id || m.id === id)
    if (!item) return

    const currentStock = item.stok !== undefined ? item.stok : (item.stock || 0);
    const newStock = Math.max(0, currentStock + delta)
    try {
      await updateMenu(id, { stok: newStock })
      await fetchMenus() // Sinkronisasi ulang data setelah stok diubah
    } catch (error) {
      console.error("Gagal memperbarui stok menu:", error)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground animate-pulse">Memuat data menu...</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>Manajemen Menu</h1>
          <p className="text-muted-foreground text-sm">{menuItems.length} item menu tersedia</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#D4541A' }}>
          <Plus size={16} /> Tambah Menu
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['Semua', ...state.settings.customCategories] as const).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === cat ? 'text-white' : 'bg-card text-muted-foreground border border-border hover:bg-muted'}`}
            style={filter === cat ? { background: '#D4541A' } : {}}
          >{cat}</button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const currentId = item._id || item.id
          const finalImage = item.gambar || item.image || ''
          const finalName = item.nama || item.name || 'Tanpa Nama'
          const finalPrice = item.harga !== undefined ? item.harga : (item.price || 0)
          const finalDesc = item.deskripsi || item.description || ''
          const finalStock = item.stok !== undefined ? item.stok : (item.stock || 0)

          return (
            <div key={currentId} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="relative h-40 bg-muted">
                {finalImage ? (
                  <img src={finalImage} alt={finalName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package size={32} /></div>
                )}
                {(item.isFlashSale || (item.discount && item.discount > 0)) && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ background: '#D4541A' }}>
                    {item.isFlashSale ? <><FlameKindling size={12} /> Flash Sale</> : <><Flame size={12} /> Diskon {item.discount}%</>}
                  </span>
                )}
                {!item.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Tidak Tersedia</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-sm">{finalName}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{finalDesc}</p>
                <div className="flex items-center justify-between mb-3">
                  {item.isFlashSale && item.salePrice ? (
                    <div>
                      <span className="font-bold" style={{ color: '#D4541A' }}>{formatCurrency(item.salePrice)}</span>
                      <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(finalPrice)}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-foreground">{formatCurrency(finalPrice)}</span>
                  )}
                </div>
                {/* Stock Section */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Stok:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustStock(currentId!, -1)} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-foreground">
                      {finalStock}
                    </span>
                    <button onClick={() => adjustStock(currentId!, 1)} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors">
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(currentId!)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-sm text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
                {editing ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Nama Menu *">
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Nama menu" />
              </Field>
              <Field label="Deskripsi">
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" rows={2} placeholder="Deskripsi singkat" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Harga (Rp) *">
                  <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} className="input-field" placeholder="25000" />
                </Field>
                <Field label="Stok">
                  <input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} className="input-field" placeholder="10" />
                </Field>
              </div>
              <Field label="Kategori">
                <select value={form.category || state.settings.customCategories[0]} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                  {state.settings.customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Gambar Menu">
                <div className="space-y-3">
                  {imagePreview && (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group bg-muted">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="relative flex items-center justify-center w-full border-2 border-dashed border-border rounded-xl p-4 hover:border-orange-500 transition-colors bg-muted/30">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pointer-events-none">
                      <Upload size={16} className="text-orange-600" />
                      <span>{imageFile ? imageFile.name : 'Pilih / Ambil Foto File Gambar'}</span>
                    </div>
                  </div>

                  <input 
                    value={form.image || ''} 
                    onChange={e => {
                      setForm(f => ({ ...f, image: e.target.value }));
                      setImagePreview(e.target.value);
                    }} 
                    className="input-field text-xs" 
                    placeholder="Atau tempel URL eksternal di sini (https://...)" 
                  />
                </div>
              </Field>

              <Field label="Diskon (%)">
                <input type="number" min="0" max="100" value={form.discount || 0} onChange={e => setForm(f => ({ ...f, discount: +e.target.value }))} className="input-field" placeholder="0" />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.available ?? true} onChange={e => setForm(f => ({ ...f, available: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">Tersedia</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFlashSale ?? false} onChange={e => setForm(f => ({ ...f, isFlashSale: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">Flash Sale</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.hasSpiceLevel ?? false} onChange={e => setForm(f => ({ ...f, hasSpiceLevel: e.target.checked }))} className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">Tingkat Pedas</span>
                </label>
              </div>
              {form.isFlashSale && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Harga Sale (Rp)">
                    <input type="number" value={form.salePrice || ''} onChange={e => setForm(f => ({ ...f, salePrice: +e.target.value }))} className="input-field" />
                  </Field>
                  <Field label="Berakhir">
                    <input type="datetime-local" value={form.saleEndTime ? form.saleEndTime.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, saleEndTime: new Date(e.target.value).toISOString() }))} className="input-field" />
                  </Field>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Batal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: '#D4541A' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-foreground mb-2">Hapus Menu?</h3>
            <p className="text-muted-foreground text-sm mb-6">Menu ini akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-muted transition-colors">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#D4183D' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input-field { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--input-background); color: var(--foreground); outline: none; font-size: 14px; transition: border-color 0.2s; } .input-field:focus { border-color: #D4541A; }`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}