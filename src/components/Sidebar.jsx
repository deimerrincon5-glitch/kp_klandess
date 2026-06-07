import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  ClipboardList, 
  DollarSign, 
  Wallet,
  ChevronLeft,
  ChevronRight,
  CandlestickChart,
  Warehouse
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

export default function Sidebar({ collapsed, setCollapsed, alertsCount }) {
  const location = useLocation()

  return (
    <aside 
      className={cn(
        'fixed left-0 top-0 h-screen bg-amber-800 text-white transition-all duration-300 z-50',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Collapse Button */}
        <div className="flex items-center justify-between p-4 border-b border-amber-700">
          {!collapsed && (
            <h1 className="font-playfair font-bold text-xl truncate">Velas Artesanales</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-amber-700 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive 
                    ? 'bg-amber-600 text-white' 
                    : 'hover:bg-amber-700 text-amber-100'
                )}
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Alerts Badge */}
        {alertsCount > 0 && !collapsed && (
          <div className="p-4 border-t border-amber-700">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {alertsCount} Alerta{alertsCount > 1 ? 's' : ''} activa{alertsCount > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
