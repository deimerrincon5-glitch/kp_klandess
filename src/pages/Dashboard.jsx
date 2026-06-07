import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Plus, ShoppingCart, FileText, AlertTriangle } from 'lucide-react'

const COLORS = ['#D97706', '#FEF3C7', '#B45309', '#92400E']

export default function Dashboard() {
  const navigate = useNavigate()
  const { dashboardData, pedidos, productos, materiasPrimas, inventarioTerminado } = useApp()

  // Prepare chart data
  const ingresosEgresosData = [
    { month: 'Ene', ingresos: 1200000, egresos: 800000 },
    { month: 'Feb', ingresos: 1500000, egresos: 950000 },
    { month: 'Mar', ingresos: 1800000, egresos: 1100000 },
    { month: 'Abr', ingresos: 1400000, egresos: 900000 },
    { month: 'May', ingresos: 2000000, egresos: 1200000 },
    { month: 'Jun', ingresos: dashboardData.totalVentasMes, egresos: 129000 },
  ]

  // Top 3 productos más vendidos
  const productosMasVendidos = productos.filter(p => p.activo).slice(0, 3).map(p => ({
    name: p.nombre_producto.substring(0, 15),
    value: Math.floor(Math.random() * 50) + 10,
    unidades: Math.floor(Math.random() * 50) + 10
  }))

  // Margen de utilidad por producto
  const margenPorProducto = productos.filter(p => p.activo).map(p => ({
    name: p.nombre_producto.substring(0, 20),
    margen: p.margen_utilidad || 0
  }))

  // Últimos 5 pedidos
  const ultimosPedidos = [...pedidos].sort((a, b) => 
    new Date(b.fecha_pedido) - new Date(a.fecha_pedido)
  ).slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pedidos')}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={18} />
            Nuevo Pedido
          </button>
          <button
            onClick={() => navigate('/cotizaciones')}
            className="flex items-center gap-2 bg-white border border-amber-300 text-amber-800 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <FileText size={18} />
            Nueva Cotización
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas del Mes"
          value={formatCurrency(dashboardData.totalVentasMes)}
          icon={ShoppingCart}
          color="amber"
        />
        <KPICard
          title="Pedidos Pendientes"
          value={dashboardData.pedidosPendientesCount}
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Cotizaciones Sin Responder"
          value={dashboardData.cotizacionesSinResponderCount}
          icon={FileText}
          color="purple"
        />
        <KPICard
          title="Alertas de Stock"
          value={dashboardData.alertasStockCount}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Egresos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Ingresos vs Egresos (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ingresosEgresosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="ingresos" fill="#D97706" name="Ingresos" />
              <Bar dataKey="egresos" fill="#EF4444" name="Egresos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 Productos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Top 3 Productos Más Vendidos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productosMasVendidos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productosMasVendidos.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margen de Utilidad por Producto */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Margen de Utilidad por Producto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={margenPorProducto} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Bar dataKey="margen" fill="#D97706" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Últimos Pedidos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Últimos 5 Pedidos
          </h3>
          <div className="space-y-3">
            {ultimosPedidos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay pedidos registrados</p>
            ) : (
              ultimosPedidos.map(pedido => (
                <div key={pedido.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="font-medium text-amber-900">{pedido.id}</p>
                    <p className="text-sm text-amber-600">{pedido.nombre_cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-amber-900">{formatCurrency(pedido.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      pedido.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                      pedido.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pedido.estado}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color }) {
  const colors = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${colors[color]} p-3 rounded-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )
}
