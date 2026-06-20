import React, { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import SplashScreen from './components/SplashScreen'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { ToastContainer } from './components/Toast'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MateriaPrima = lazy(() => import('./pages/MateriaPrima'))
const Productos = lazy(() => import('./pages/Productos'))
const InventarioTerminado = lazy(() => import('./pages/InventarioTerminado'))
const Clientes = lazy(() => import('./pages/Clientes'))
const Cotizaciones = lazy(() => import('./pages/Cotizaciones'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const Ventas = lazy(() => import('./pages/Ventas'))
const Finanzas = lazy(() => import('./pages/Finanzas'))

// Loading component for lazy loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="text-neutral-500 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function AppContent() {
  const [splashVisible, setSplashVisible] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { initializeApp, toasts, companyName, dashboardData } = useApp()

  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  const handleSplashComplete = () => {
    setSplashVisible(false)
  }

  const removeToast = (id) => {
    // Toast removal is handled in context with setTimeout
  }

  if (splashVisible) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setSidebarCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        alertsCount={dashboardData.pedidosEntregaProximaCount}
      />
      
      <main id="main-content" className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`} tabIndex={-1}>
        <Header 
          companyName={companyName} 
          alertsCount={dashboardData.pedidosEntregaProximaCount}
          onMobileMenuClick={() => setMobileSidebarOpen(true)}
        />
        
        <div className="p-4 md:p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/materia-prima" element={<MateriaPrima />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/inventario-terminado" element={<InventarioTerminado />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="/pedidos" element={<Pedidos />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/finanzas" element={<Finanzas />} />
            </Routes>
          </Suspense>
        </div>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}

export default App
