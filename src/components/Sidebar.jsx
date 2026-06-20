import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  ClipboardList, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  CandlestickChart,
  Warehouse,
  Bell,
  User,
  Settings,
  X
} from 'lucide-react'
import { cn } from '../utils/cn'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/materia-prima', icon: Package, label: 'Materia Prima' },
  { path: '/productos', icon: CandlestickChart, label: 'Catálogo + Recetas' },
  { path: '/inventario-terminado', icon: Warehouse, label: 'Producto Terminado' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
  { path: '/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { path: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { path: '/finanzas', icon: Wallet, label: 'Finanzas' },
]

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, alertsCount }) {
  const location = useLocation()

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          'fixed left-0 top-0 h-screen bg-neutral-900 text-neutral-400 transition-all duration-300 z-50 flex flex-col',
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo/Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2">
              <CandlestickChart size={24} className="text-primary-500" />
              <h1 className="font-display font-bold text-lg text-neutral-100">Velas Artesanales</h1>
            </div>
          )}
          <div className="flex items-center gap-1">
            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 hover:bg-neutral-800 rounded-lg transition-base text-neutral-400 hover:text-neutral-100"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
            {/* Desktop Collapse Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block p-2 hover:bg-neutral-800 rounded-lg transition-base text-neutral-400 hover:text-neutral-100"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-base group',
                  isActive 
                    ? 'bg-primary-600 text-white' 
                    : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100'
                )}
              >
                <Icon size={20} className={cn('flex-shrink-0', isActive ? 'text-white' : 'group-hover:text-neutral-100')} />
                {(!collapsed || mobileOpen) && (
                  <span className={cn('font-medium text-sm', isActive ? 'text-white' : 'group-hover:text-neutral-100')}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Alerts Badge */}
        {alertsCount > 0 && (!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-neutral-800">
            <div className="bg-error-500/10 border border-error-500/20 text-error-400 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Bell size={16} />
              <span>{alertsCount} alerta{alertsCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        {(!collapsed || mobileOpen) && (
          <div className="p-3 border-t border-neutral-800 space-y-1">
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-base hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 w-full">
              <Settings size={20} />
              <span className="font-medium text-sm">Configuración</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-base hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 w-full">
              <User size={20} />
              <span className="font-medium text-sm">Perfil</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
