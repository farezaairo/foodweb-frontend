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

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { state } = useApp()
  if (!state.isAdminLoggedIn) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="promo" element={<AdminPromo />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/" element={<CustomerMenu />} />
          <Route path="/checkout" element={<CustomerCheckout />} />
          <Route path="/order/:id" element={<OrderStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
