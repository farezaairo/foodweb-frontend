import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../context/AppContext'
import { UtensilsCrossed, Lock, User, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulasi delay autentikasi kecil untuk UX yang lebih natural
    setTimeout(() => {
      const trimmedUsername = username.trim().toLowerCase()
      const adminPasswordDb = state.settings?.adminPassword

      // Keamanan tambahan: cegah kecocokan jika settings belum termuat dari API
      if (!adminPasswordDb) {
        setError('Sistem sedang menyinkronkan data, mohon tunggu beberapa detik lalu coba lagi.')
        setLoading(false)
        return
      }

      if (trimmedUsername === 'admin' && password === adminPasswordDb) {
        // 🌟 1. Kunci status login di local storage agar tahan banting saat di-reload
        localStorage.setItem('isAuthenticatedAdmin', 'true')

        // 2. Trigger global state
        dispatch({ type: 'LOGIN_ADMIN' })
        navigate('/admin')
      } else {
        setError('Username atau password salah. Silakan coba kembali.')
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE4 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-md" style={{ background: '#D4541A' }}>
            <UtensilsCrossed size={40} color="white" />
          </div>
          <h1 className="text-foreground" style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700 }}>
            {state.settings?.restaurantName || 'Restoran'}
          </h1>
          <p className="text-muted-foreground mt-1">{state.settings?.tagline || 'Panel Manajemen Sistem'}</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          <h2 className="text-foreground mb-6" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600 }}>
            Login Admin
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-foreground mb-2 text-sm font-medium">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-input-background text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground mb-2 text-sm font-medium">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPass ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-input-background text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm py-2 px-3 rounded-lg border border-destructive/20 transition-all">
                {error}
              </div>
            )}

            <button
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
              style={{ background: '#D4541A' }}
            >
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Gunakan kredensial admin yang dikonfigurasi pada menu Pengaturan sistem.
          </p>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Pelanggan?{' '}
          <a href="/" className="text-primary hover:underline font-medium" style={{ color: '#D4541A' }}>
            Lihat Menu Utama
          </a>
        </p>
      </div>
    </div>
  )
}