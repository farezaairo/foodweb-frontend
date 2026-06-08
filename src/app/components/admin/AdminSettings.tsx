import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { MiscCost, SpiceLevel } from '../../data/types'
import { Plus, Trash2, Save, MapPin, Phone, Clock, Lock, Tag } from 'lucide-react'
import {
  getSettings,
  updateSettings
} from "../../api/pengaturan"

export function AdminSettings() {
  const { state, dispatch } = useApp()

  // State Utama
  const [settings, setSettings] = useState<any>(null)
  const [miscCosts, setMiscCosts] = useState<MiscCost[]>([])
  const [spiceLevels, setSpiceLevels] = useState<SpiceLevel[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // State UI
  const [isLoading, setIsLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setIsLoading(true)
      const data = await getSettings()
      if (data) {
        setSettings(data)
        setMiscCosts(data.miscCosts || [])
        setSpiceLevels(data.spiceLevels || [])
        setCategories(data.customCategories || [])
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Menggabungkan seluruh state lokal menjadi satu objek utuh yang valid
  const getMergedData = (currentOperational?: boolean, currentHours?: string) => {
    return {
      ...settings,
      isOperational: currentOperational !== undefined ? currentOperational : settings.isOperational,
      operationalHours: currentHours !== undefined ? currentHours : settings.operationalHours,
      miscCosts,
      spiceLevels,
      customCategories: categories
    }
  }

  async function handleSave() {
    try {
      const settingsId = settings._id; 
      const updatedData = getMergedData()

      // 1. Kirim ke database MongoDB Cloud via backend Railway
      await updateSettings(settingsId, updatedData) 
      
      // 2. Update state lokal komponen
      setSettings(updatedData) 

      // 3. Update state global AppContext agar tersinkronisasi ke LocalStorage secara instan
      dispatch({ type: 'UPDATE_SETTINGS', payload: updatedData })

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error("Gagal menyimpan pengaturan:", error)
    }
  }

  // --- Handler untuk Biaya Tambahan ---
  function addMiscCost() {
    setMiscCosts(c => [...c, { id: `mc${Date.now()}`, name: '', type: 'percentage', value: 0 }])
  }

  function updateMiscCost(id: string, field: keyof MiscCost, value: string | number) {
    setMiscCosts(c => c.map(mc => mc.id === id ? { ...mc, [field]: value } : mc))
  }

  function removeMiscCost(id: string) {
    setMiscCosts(c => c.filter(mc => mc.id !== id))
  }

  // --- Handler untuk Tingkat Kepedasan ---
  function addSpiceLevel() {
    setSpiceLevels(s => [...s, { id: `sl${Date.now()}`, name: '', icon: '🌶️' }])
  }

  function updateSpiceLevel(id: string, field: keyof SpiceLevel, value: string) {
    setSpiceLevels(s => s.map(sl => sl.id === id ? { ...sl, [field]: value } : sl))
  }

  function removeSpiceLevel(id: string) {
    setSpiceLevels(s => s.filter(sl => sl.id !== id))
  }

  // --- Handler untuk Kategori Menu ---
  function addCategory() {
    setCategories(c => [...c, 'Kategori Baru'])
  }

  function updateCategory(index: number, value: string) {
    setCategories(c => c.map((cat, i) => i === index ? value : cat))
  }

  function removeCategory(index: number) {
    setCategories(c => c.filter((_, i) => i !== index))
  }

  if (isLoading || !settings) {
    return (
      <div className="p-12 text-center text-muted-foreground animate-pulse text-sm">
        Memuat data pengaturan...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>Pengaturan</h1>
          <p className="text-muted-foreground text-sm">Konfigurasi restoran</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all" style={{ background: saved ? '#4CAF50' : '#D4541A' }}>
          <Save size={15} /> {saved ? 'Tersimpan!' : 'Simpan'}
        </button>
      </div>

      {/* Status Operasional Restoran */}
      <div className="bg-card rounded-2xl border border-border p-6 overflow-hidden relative">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.isOperational ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`} />
              <h2 className="font-semibold text-foreground text-[17px]" style={{ fontFamily: 'var(--font-display)' }}>
                Status Operasional Restoran
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {settings.isOperational 
                ? "Restoran aktif menerima pesanan dari customer." 
                : "Restoran tutup. Customer tidak bisa masuk ke checkout."}
            </p>
          </div>

          <button
            onClick={() => {
              const nextOperationalStatus = !settings.isOperational;
              setSettings((s: any) => ({ ...s, isOperational: nextOperationalStatus }));
              
              // Menyinkronkan data mutakhir (termasuk list kategori, pedas, dll) ke Global Sidebar
              dispatch({ 
                type: 'UPDATE_SETTINGS', 
                payload: getMergedData(nextOperationalStatus, undefined)
              });
            }}
            className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center p-1 cursor-pointer ${
              settings.isOperational ? 'bg-[#D4541A]' : 'bg-muted border border-border'
            }`}
          >
            <div 
              className={`w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 transform ${
                settings.isOperational ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 gap-2">
          <Field label="Jam Operasional Toko (Bisa Diedit)">
            <input 
              value={settings.operationalHours || ''} 
              onChange={e => {
                const nextHours = e.target.value;
                setSettings((s: any) => ({ ...s, operationalHours: nextHours }));
                
                dispatch({ 
                  type: 'UPDATE_SETTINGS', 
                  payload: getMergedData(undefined, nextHours)
                });
              }} 
              placeholder="Contoh: Setiap Hari, 09:00 - 21:00"
              className="input-field" 
            />
          </Field>
        </div>
      </div>

      <Section title="Informasi Restoran">
        <Field label="Nama Restoran">
          <input value={settings.restaurantName || ''} onChange={e => setSettings((s: any) => ({ ...s, restaurantName: e.target.value }))} className="input-field" />
        </Field>
        <Field label="Tagline">
          <input value={settings.tagline || ''} onChange={e => setSettings((s: any) => ({ ...s, tagline: e.target.value }))} className="input-field" />
        </Field>
        <Field label="Alamat Lengkap">
          <textarea value={settings.address || ''} onChange={e => setSettings((s: any) => ({ ...s, address: e.target.value }))} className="input-field resize-none" rows={2} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kota / Wilayah">
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={settings.location || ''} onChange={e => setSettings((s: any) => ({ ...s, location: e.target.value }))} className="input-field pl-9" />
            </div>
          </Field>
          <Field label="Nomor Telepon">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={settings.phone || ''} onChange={e => setSettings((s: any) => ({ ...s, phone: e.target.value }))} className="input-field pl-9" />
            </div>
          </Field>
        </div>
        <Field label="Link Google Maps">
          <input value={settings.mapsUrl || ''} onChange={e => setSettings((s: any) => ({ ...s, mapsUrl: e.target.value }))} className="input-field" placeholder="https://maps.google.com/..." />
        </Field>
      </Section>

      {/* Pengaturan Pesanan */}
      <Section title="Pengaturan Pesanan">
        <Field label="Estimasi Waktu Penyiapan (menit)">
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="number" value={settings.estimatedMinutes || 0} onChange={e => setSettings((s: any) => ({ ...s, estimatedMinutes: +e.target.value }))} className="input-field pl-9" />
          </div>
        </Field>
      </Section>

      {/* Kategori Menu */}
      <Section title="Kategori Menu">
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Kelola kategori menu yang dapat dipilih saat menambah menu baru.</p>
        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={cat} onChange={e => updateCategory(idx, e.target.value)} placeholder="Nama kategori" className="input-field pl-9" />
              </div>
              {categories.length > 1 && (
                <button onClick={() => removeCategory(idx)} className="w-9 h-9 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addCategory} className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full">
            <Plus size={14} /> Tambah Kategori
          </button>
        </div>
      </Section>

      {/* Tingkat Kepedasan */}
      <Section title="Tingkat Kepedasan">
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Atur pilihan tingkat kepedasan untuk menu yang memerlukan opsi pedas.</p>
        <div className="space-y-3">
          {spiceLevels.map(sl => (
            <div key={sl.id} className="flex items-center gap-2">
              <input value={sl.icon} onChange={e => updateSpiceLevel(sl.id, 'icon', e.target.value)} placeholder="🌶️" className="input-field w-16 flex-shrink-0 text-center" maxLength={2} />
              <input value={sl.name} onChange={e => updateSpiceLevel(sl.id, 'name', e.target.value)} placeholder="Nama tingkat pedas" className="input-field flex-1" />
              <button onClick={() => removeSpiceLevel(sl.id)} className="w-9 h-9 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addSpiceLevel} className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full">
            <Plus size={14} /> Tambah Tingkat Pedas
          </button>
        </div>
      </Section>

      {/* Biaya Tambahan */}
      <Section title="Biaya Tambahan">
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Biaya ini akan ditambahkan ke setiap pesanan secara otomatis.</p>
        <div className="space-y-3">
          {miscCosts.map(mc => (
            <div key={mc.id} className="flex items-center gap-2">
              <input value={mc.name} onChange={e => updateMiscCost(mc.id, 'name', e.target.value)} placeholder="Nama biaya" className="input-field flex-1" />
              <select value={mc.type} onChange={e => updateMiscCost(mc.id, 'type', e.target.value as any)} className="input-field w-28 flex-shrink-0">
                <option value="percentage">%</option>
                <option value="fixed">Rp</option>
              </select>
              <input type="number" value={mc.value} onChange={e => updateMiscCost(mc.id, 'value', +e.target.value)} className="input-field w-20 flex-shrink-0" />
              <button onClick={() => removeMiscCost(mc.id)} className="w-9 h-9 rounded-xl border border-destructive/30 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button onClick={addMiscCost} className="flex items-center gap-2 text-sm font-medium py-2 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full">
            <Plus size={14} /> Tambah Biaya
          </button>
        </div>
      </Section>

      {/* Keamanan */}
      <Section title="Keamanan">
        <Field label="Password Admin">
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="password" value={settings.adminPassword || ''} onChange={e => setSettings((s: any) => ({ ...s, adminPassword: e.target.value }))} className="input-field pl-9" placeholder="••••••••" />
          </div>
        </Field>
        <p className="text-xs text-muted-foreground">Ubah password untuk keamanan akun admin Anda.</p>
      </Section>

      {/* QR Code Preview */}
      <Section title="QR Code Pelanggan">
        <p className="text-sm text-muted-foreground mb-3">QR code ini mengarahkan pelanggan ke halaman pemesanan. Cetak dan pasang di meja.</p>
        <div className="flex gap-4 items-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.origin + '/')}`}
            alt="QR Code Menu" className="w-40 h-40 rounded-xl border border-border"
          />
          <div>
            <div className="text-sm font-medium text-foreground mb-1">URL Pemesanan:</div>
            <code className="text-xs bg-muted px-2 py-1 rounded break-all">{window.location.origin}/</code>
            <button
              onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/')}`, '_blank')}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors"
            >
              Unduh QR Code
            </button>
          </div>
        </div>
      </Section>

      <style>{`.input-field { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border); background: var(--input-background); color: var(--foreground); outline: none; font-size: 14px; transition: border-color 0.2s; } .input-field:focus { border-color: #D4541A; }`}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <h2 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '17px' }}>{title}</h2>
      {children}
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