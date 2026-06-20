import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { Plus, FileText, ShoppingCart, AlertTriangle } from 'lucide-react'
import KPICard from '../components/ui/KPICard'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

const COLORS = ['#F59E0B', '#FEF3C7', '#D97706', '#B45309']

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

  // Sparkline data for KPI cards
  const ventasSparkline = [
    { value: 800000 },
    { value: 950000 },
    { value: 1100000 },
    { value: 900000 },
    { value: 1200000 },
    { value: 1290000 },
  ]

  const pedidosSparkline = [
    { value: 5 },
    { value: 8 },
    { value: 6 },
    { value: 10 },
    { value: 7 },
    { value: dashboardData.pedidosPendientesCount },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-500 mt-1">Vista general de tu negocio</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/pedidos')}
            icon={Plus}
          >
            Nuevo Pedido
          </Button>
          <Button
            onClick={() => navigate('/cotizaciones')}
            variant="secondary"
            icon={FileText}
          >
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Ventas del Mes"
          value={formatCurrency(dashboardData.totalVentasMes)}
          previousValue={1200000}
          trend="+12.5%"
          trendDirection="up"
          icon={ShoppingCart}
          sparklineData={ventasSparkline}
        />
        <KPICard
          title="Pedidos Pendientes"
          value={dashboardData.pedidosPendientesCount}
          previousValue={7}
          trend="+14.3%"
          trendDirection="up"
          icon={FileText}
          sparklineData={pedidosSparkline}
        />
        <KPICard
          title="Cotizaciones Sin Responder"
          value={dashboardData.cotizacionesSinResponderCount}
          previousValue={3}
          trend="-33.3%"
          trendDirection="down"
          icon={FileText}
        />
        <KPICard
          title="Alertas de Stock"
          value={dashboardData.alertasStockCount}
          previousValue={2}
          trend="+50%"
          trendDirection="up"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos vs Egresos */}
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Ingresos vs Egresos (6 meses)</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ingresosEgresosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="ingresos" fill="#F59E0B" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" fill="#EF4444" name="Egresos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Top 3 Productos */}
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Top 3 Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardBody>
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
          </CardBody>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margen de Utilidad por Producto */}
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Margen de Utilidad por Producto</CardTitle>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={margenPorProducto} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis type="number" stroke="#737373" fontSize={12} />
                <YAxis dataKey="name" type="category" width={120} stroke="#737373" fontSize={12} />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="margen" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Últimos Pedidos */}
        <Card variant="elevated" padding="md">
          <CardHeader>
            <CardTitle>Últimos 5 Pedidos</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {ultimosPedidos.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No hay pedidos registrados</p>
              ) : (
                ultimosPedidos.map(pedido => (
                  <div key={pedido.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-base">
                    <div>
                      <p className="font-heading font-medium text-neutral-900">{pedido.id}</p>
                      <p className="text-sm text-neutral-500">{pedido.nombre_cliente}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-medium text-neutral-900">{formatCurrency(pedido.total)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        pedido.estado === 'Entregado' ? 'bg-success-100 text-success-800' :
                        pedido.estado === 'Pendiente' ? 'bg-warning-100 text-warning-800' :
                        'bg-info-100 text-info-800'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
