import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppProvider, useApp } from './context/AppContext'
import { LoginPage } from './components/LoginPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { AdminMenu } from './components/admin/AdminMenu'
import { AdminOrders } from './components/admin/AdminOrders'
import { AdminPromo } from './components/admin/AdminPromo'
import { AdminSettings } from './components/admin/AdminSettings'
import { CustomerMenu } from './components/customer/CustomerMenu'
import { CustomerCheckout } from './components/customer/CustomerCheckout'
import { OrderStatus } from './components/customer/OrderStatus'

// 🛡️ Guard 1: Melindungi halaman Admin agar tidak bisa diakses tanpa login
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  
  if (!state.isAdminLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// 🛡️ Guard 2: Melindungi halaman Login agar Admin yang sudah masuk tidak terlempar kembali ke form login
function GuestGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  
  if (state.isAdminLoggedIn) {
    return <Navigate to="/admin" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* SINKRONISASI: Bungkus login dengan GuestGuard */}
          <Route path="/login" element={
            <GuestGuard>
              <LoginPage />
            </GuestGuard>
          } />
          
          {/* SINKRONISASI: Proteksi penuh rute admin menggunakan state AppContext terbaru */}
          <Route path="/admin" element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="promo" element={<AdminPromo />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Rute Sisi Pelanggan */}
          <Route path="/" element={<CustomerMenu />} />
          <Route path="/checkout" element={<CustomerCheckout />} />
          <Route path="/order/:id" element={<OrderStatus />} />
          
          {/* Catch-all: Alihkan rute tidak dikenal ke halaman utama */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}