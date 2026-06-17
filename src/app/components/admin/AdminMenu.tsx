import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency } from '../../utils/print'
import { MenuItem } from '../../data/types'
import { Plus, Pencil, Trash2, Minus, FlameKindling, Package, Flame, Upload } from 'lucide-react'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../api/menuApi' // Import fungsi API Menu

const blankItem = (defaultCategory: string): Partial<MenuItem> => ({
  name: '', description: '', price: 0, category: defaultCategory,
  image: '', stock: 10, isFlashSale: false, available: true, hasSpiceLevel: false, discount: 0
})

export function AdminMenu() {
  const { state } = useApp() // Mengambil state global hanya untuk membaca data settings kategori
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]) // State lokal untuk menyimpan data dari MongoDB
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | 'Semua'>('Semua')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<Partial<MenuItem>>(blankItem(state.settings.customCategories[0] || 'Makanan Utama'))
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // State tambahan untuk mengelola file gambar fisik dan pratinjau (preview)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Ambil data menu dari MongoDB saat komponen pertama kali dimuat
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
  
  function openEdit(item: MenuItem) { 
    setEditing(item)
    setForm({ ...item })
    setImageFile(null)
    setImagePreview(item.image || '') // Tampilkan gambar lama sebagai preview awal saat edit
    setShowModal(true) 
  }

  // Handler ketika admin memilih file gambar baru lewat komputer/HP
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file)) // Membuat link blob sementara untuk preview UI
    }
  }

  // Menyimpan data (Tambah baru atau Update) ke MongoDB
  async function handleSave() {
    if (!form.name || !form.price) return
    try {
      let dataToSend: any;

      // JIKA ada file gambar fisik yang diunggah, bungkus data ke dalam FormData
      if (imageFile) {
        const formDataObj = new FormData()
        formDataObj.append('name', form.name)
        formDataObj.append('description', form.description || '')
        formDataObj.append('price', String(form.price))
        formDataObj.append('category', form.category || '')
        formDataObj.append('stock', String(form.stock ?? 10))
        formDataObj.append('discount', String(form.discount ?? 0))
        formDataObj.append('available', String(form.available ?? true))
        formDataObj.append('isFlashSale', String(form.isFlashSale ?? false))
        formDataObj.append('hasSpiceLevel', String(form.hasSpiceLevel ?? false))
        
        // Memasukkan file gambar asli ke field 'image'
        formDataObj.append('image', imageFile)

        if (form.isFlashSale) {
          if (form.salePrice) formDataObj.append('salePrice', String(form.salePrice))
          if (form.saleEndTime) formDataObj.append('saleEndTime', form.saleEndTime)
        }
        
        dataToSend = formDataObj
      } else {
        // JIKA tidak ada file baru (menggunakan URL teks default atau tidak mengganti gambar saat edit)
        dataToSend = form
      }

      if (editing) {
        const currentId = editing._id || editing.id
        const updatedData = await updateMenu(currentId!, dataToSend)
        setMenuItems(prev => prev.map(m => (m._id === currentId || m.id === currentId) ? updatedData : m))
      } else {
        const newData = await createMenu(dataToSend)
        setMenuItems(prev => [...prev, newData])
      }
      
      // Reset state form upload gambar setelah sukses disimpan
      setImageFile(null)
      setImagePreview('')
      setShowModal(false)
    } catch (error) {
      console.error("Gagal menyimpan data menu:", error)
    }
  }

  // Menghapus data dari MongoDB
  async function handleDelete(id: string) {
    try {
      await deleteMenu(id)
      setMenuItems(prev => prev.filter(m => m._id !== id && m.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Gagal menghapus menu:", error)
    }
  }

  // Menyesuaikan jumlah stok langsung ke MongoDB
  async function adjustStock(id: string, delta: number) {
    const item = menuItems.find(m => m._id === id || m.id === id)
    if (!item) return

    const newStock = Math.max(0, item.stock + delta)
    try {
      const updatedData = await updateMenu(id, { stock: newStock })
      setMenuItems(prev => prev.map(m => (m._id === id || m.id === id) ? updatedData : m))
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
          return (
            <div key={currentId} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="relative h-40 bg-muted">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
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
                  <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">{item.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between mb-3">
                  {item.isFlashSale && item.salePrice ? (
                    <div>
                      <span className="font-bold" style={{ color: '#D4541A' }}>{formatCurrency(item.salePrice)}</span>
                      <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(item.price)}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-foreground">{formatCurrency(item.price)}</span>
                  )}
                </div>
                {/* Stock */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Stok:</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => adjustStock(currentId!, -1)} className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground">
                      <Minus size={12} />
                    </button>
                    <span className={`text-sm font-bold w-6 text-center`} style={{ color: item.stock < 5 ? '#D4183D' : item.stock < 10 ? '#D4541A' : 'inherit' }}>
                      {item.stock}
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

              {/* FIELD UNTUK UPLOAD GAMBAR BARU */}
              <Field label="Gambar Menu">
                <div className="space-y-3">
                  {/* Pratinjau kotak gambar jika ada data link atau file baru terisi */}
                  {imagePreview && (
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border group bg-muted">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {/* Desain area upload file interaktif */}
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

                  {/* Alternatif input teks URL tetap dipertahankan di bawahnya untuk cadangan data manual */}
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