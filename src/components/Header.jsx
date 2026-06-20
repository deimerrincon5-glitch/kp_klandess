import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Search, User, ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'

export default function Header({ companyName, alertsCount }) {
  const location = useLocation()
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Dashboard', path: '/' }]
    
    if (pathSegments.length > 0 && pathSegments[0] !== '') {
      const pathMap = {
        'materia-prima': 'Materia Prima',
        'productos': 'Catálogo + Recetas',
        'inventario-terminado': 'Producto Terminado',
        'clientes': 'Clientes',
        'cotizaciones': 'Cotizaciones',
        'pedidos': 'Pedidos',
        'ventas': 'Ventas',
        'finanzas': 'Finanzas',
      }
      
      let currentPath = ''
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`
        if (pathMap[segment]) {
          breadcrumbs.push({
            label: pathMap[segment],
            path: currentPath,
          })
        }
      })
    }
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight size={16} className="text-neutral-400 mx-2" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-heading font-semibold text-neutral-900">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-neutral-500 hover:text-neutral-900 transition-base">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-64 pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          />
        </div>

        {/* Notifications */}
        {alertsCount > 0 && (
          <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-base" aria-label="Notifications">
            <Bell className="text-neutral-600" size={20} />
            <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {alertsCount}
            </span>
          </button>
        )}

        {/* User Profile */}
        <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg transition-base">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="text-primary-600" size={18} />
          </div>
          <span className="text-sm font-medium text-neutral-700 hidden md:block">Admin</span>
        </button>
      </div>
    </header>
  )
}
