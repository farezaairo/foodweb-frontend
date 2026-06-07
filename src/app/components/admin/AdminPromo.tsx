import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { formatCurrency, formatDate } from '../../utils/print'
import { Promo } from '../../data/types'
import { Plus, Pencil, Trash2, Tag, Clock, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo
} from '../../api/promoApi'

const blankPromo = (): Partial<Promo> => ({
  name: '', 
  code: '', 
  type: 'percentage', 
  value: 0, 
  minOrder: 0,
  validUntil: new Date(Date.now() + 7 * 86400000).toISOString(), 
  active: true, 
  usageCount: 0
})

export function AdminPromo() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [form, setForm] = useState<Partial<Promo>>(blankPromo())
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // 1. Load Data dari API saat komponen pertama kali dirender
  useEffect(() => {
    loadPromos()
  }, [])

  async function loadPromos() {
    try {
      const data = await getPromos()
      const mapped = data.map((p: any) => ({
        ...p,
        id: p._id || p.id // Mengantisipasi jika backend menggunakan _id
      }))
      setPromos(mapped)
    } catch (error) {
      console.error("Gagal memuat promo:", error)
    }
  }

  function openAdd() { 
    setEditing(null)
    setForm(blankPromo())
    setShowModal(true) 
  }

  function openEdit(p: Promo) { 
    setEditing(p)
    setForm({ ...p })
    setShowModal(true) 
  }

  // 2. Aksi Simpan (Create / Update) menggunakan API
  async function handleSave() {
    if (!form.name || !form.code) return

    try {
      if (editing) {
        await updatePromo(editing.id, form)
      } else {
        await createPromo(form)
      }
      await loadPromos() // Refresh data terbaru
      setShowModal(false)
    } catch (error) {
      console.error("Gagal menyimpan promo:", error)
    }
  }

  // 3. Aksi Toggle Status Aktif menggunakan API
  async function toggleActive(promo: Promo) {
    try {
      await updatePromo(promo.id, {
        ...promo,
        active: !promo.active
      })
      await loadPromos() // Refresh data terbaru
    } catch (error) {
      console.error("Gagal mengubah status promo:", error)
    }
  }

  // 4. Aksi Hapus menggunakan API
  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await deletePromo(deleteConfirm)
      await loadPromos() // Refresh data terbaru
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Gagal menghapus promo:", error)
    }
  }

  const now = new Date()
  const active = promos.filter(p => p.active && new Date(p.validUntil) > now)
  const inactive = promos.filter(p => !p.active || new Date(p.validUntil) <= now)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>Promo & Flash Sale</h1>
          <p className="text-muted-foreground text-sm">{active.length} promo aktif</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#D4541A' }}>
          <Plus size={16} /> Buat Promo
        </button>
      </div>

      {/* Active Promos */}
      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Promo Aktif</h2>
          <div className="space-y-3">
            {active.map(promo => (
              <PromoCard 
                key={promo.id} 
                promo={promo} 
                onEdit={openEdit} 
                onDelete={() => setDeleteConfirm(promo.id)} 
                onToggle={toggleActive} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive/Expired */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Tidak Aktif / Kadaluarsa</h2>
          <div className="space-y-3">
            {inactive.map(promo => (
              <PromoCard 
                key={promo.id} 
                promo={promo} 
                onEdit={openEdit} 
                onDelete={() => setDeleteConfirm(promo.id)} 
                onToggle={toggleActive} 
              />
            ))}
          </div>
        </div>
      )}

      {promos.length === 0 && (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-muted-foreground">
          Belum ada promo. Klik "Buat Promo" untuk mulai.
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
                {editing ? 'Edit Promo' : 'Buat Promo Baru'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Nama Promo *">
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="Flash Sale Weekend" />
              </Field>
              <Field label="Kode Promo *">
                <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="input-field" placeholder="FLASH50" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipe Diskon">
                  <select value={form.type || 'percentage'} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))} className="input-field">
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </Field>
                <Field label={form.type === 'percentage' ? 'Diskon (%)' : 'Diskon (Rp)'}>
                  <input type="number" value={form.value || ''} onChange={e => setForm(f => ({ ...f, value: +e.target.value }))} className="input-field" placeholder="10" />
                </Field>
              </div>
              <Field label="Minimum Order (Rp)">
                <input type="number" value={form.minOrder || ''} onChange={e => setForm(f => ({ ...f, minOrder: +e.target.value }))} className="input-field" placeholder="0" />
              </Field>
              <Field label="Berlaku Hingga">
                <input type="datetime-local" value={form.validUntil ? form.validUntil.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, validUntil: new Date(e.target.value).toISOString() }))} className="input-field" />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active ?? true} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Aktifkan Promo</span>
              </label>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">Batal</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#D4541A' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-foreground mb-2">Hapus Promo?</h3>
            <p className="text-muted-foreground text-sm mb-6">Promo ini akan dihapus permanen.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-muted transition-colors">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: '#D4183D' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.input-field { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--input-background); color: var(--foreground); outline: none; font-size: 14px; }`}</style>
    </div>
  )
}

// Sub-komponen PromoCard
function PromoCard({ promo, onEdit, onDelete, onToggle }: { promo: Promo; onEdit: (p: Promo) => void; onDelete: () => void; onToggle: (p: Promo) => void }) {
  const expired = new Date(promo.validUntil) < new Date()
  return (
    <div className={`bg-card rounded-2xl border p-5 ${expired ? 'border-border opacity-60' : promo.active ? 'border-primary/30' : 'border-border'}`}
      style={promo.active && !expired ? { borderColor: '#D4541A44' } : {}}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={15} style={{ color: '#D4541A' }} />
            <span className="font-bold text-foreground">{promo.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono font-bold text-foreground">{promo.code}</code>
            <span className="text-sm font-semibold" style={{ color: '#D4541A' }}>
              {promo.type === 'percentage' ? `${promo.value}% off` : `Rp ${promo.value.toLocaleString('id-ID')} off`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            {promo.minOrder > 0 && <div>Min. order: {formatCurrency(promo.minOrder)}</div>}
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{expired ? 'Kadaluarsa' : 'Berlaku hingga'}: {formatDate(promo.validUntil)}</span>
            </div>
            <div>Digunakan: {promo.usageCount}x</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={() => onToggle(promo)} className="text-muted-foreground hover:text-foreground transition-colors" title={promo.active ? 'Nonaktifkan' : 'Aktifkan'}>
            {promo.active ? <ToggleRight size={28} style={{ color: '#D4541A' }} /> : <ToggleLeft size={28} />}
          </button>
          <div className="flex gap-1">
            <button onClick={() => onEdit(promo)} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Pencil size={13} />
            </button>
            <button onClick={onDelete} className="w-8 h-8 rounded-lg border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 transition-colors text-destructive">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sub-komponen Field
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}