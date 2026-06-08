import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
import { useApp } from '../../context/AppContext'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Tag, Settings, LogOut, Menu, X, ChefHat } from 'lucide-react'
import { getOrders } from '../../api/orderApi'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ClipboardList, label: 'Pesanan' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/admin/promo', icon: Tag, label: 'Promo' },
  { to: '/admin/settings', icon: Settings, label: 'Pengaturan' },
]

export function AdminLayout() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    async function updatePendingCount() {
      try {
        const ordersData = await getOrders()
        const count = ordersData.filter((o: any) => o.status === 'pending').length
        setPendingCount(count)
      } catch (error) {
        console.error("Gagal memperbarui notifikasi pesanan pending:", error)
      }
    }

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 10000)
    return () => clearInterval(interval)
  }, [])

  function handleLogout() {
    dispatch({ type: 'LOGOUT_ADMIN' })
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#D4541A' }}>
            <ChefHat size={22} color="white" />
          </div>
          <div>
            {/* Menggunakan optional chaining untuk mencegah crash saat sync awal */}
            <div className="font-semibold text-foreground text-sm truncate max-w-[140px]">
              {state.settings?.restaurantName || 'Memuat Resto...'}
            </div>
            <div className="text-xs text-muted-foreground">Panel Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${
                isActive ? 'text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
            style={({ isActive }) => isActive ? { background: '#D4541A' } : {}}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Pesanan' && pendingCount > 0 && (
              <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Widget Status Operasional Toko */}
      <div className="px-4">
        <div className={`p-3.5 rounded-xl border transition-all duration-300 ${
          state.settings?.isOperational 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-destructive/10 border-destructive/20 text-destructive'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${
              state.settings?.isOperational ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'
            }`} />
            
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider">
                {state.settings?.isOperational ? 'Resto Beroperasi' : 'Resto Tutup'}
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
                {state.settings?.operationalHours || '09:00 - 21:00'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border mt-4">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-card flex flex-col shadow-2xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={22} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground relative">
            <Menu size={22} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full animate-ping" />
            )}
          </button>
          <span className="font-semibold text-foreground text-sm truncate max-w-[200px]" style={{ fontFamily: 'var(--font-display)' }}>
            {state.settings?.restaurantName || 'Memuat Resto...'}
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}