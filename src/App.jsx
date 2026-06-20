import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import SplashScreen from './components/SplashScreen'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { ToastContainer } from './components/Toast'

// Pages
import Dashboard from './pages/Dashboard'
import MateriaPrima from './pages/MateriaPrima'
import Productos from './pages/Productos'
import InventarioTerminado from './pages/InventarioTerminado'
import Clientes from './pages/Clientes'
import Cotizaciones from './pages/Cotizaciones'
import Pedidos from './pages/Pedidos'
import Ventas from './pages/Ventas'
import Finanzas from './pages/Finanzas'

function AppContent() {
  const [splashVisible, setSplashVisible] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
        alertsCount={dashboardData.pedidosEntregaProximaCount}
      />
      
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header 
          companyName={companyName} 
          alertsCount={dashboardData.pedidosEntregaProximaCount}
        />
        
        <div className="p-6">
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
