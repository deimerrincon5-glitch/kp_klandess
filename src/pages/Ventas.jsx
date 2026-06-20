import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Search, ShoppingCart, TrendingUp, DollarSign, Package, X } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

export default function Ventas() {
  const { ventas, productos, addVentaDirecta } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProducto, setFilterProducto] = useState('')
  const [filterMetodoPago, setFilterMetodoPago] = useState('')

  const [formData, setFormData] = useState({
    nombre_cliente: '',
    items: [],
    aplicar_iva: false,
    metodo_pago: 'Efectivo'
  })

  const filteredVentas = useMemo(() => {
    return ventas.filter(v => {
      if (searchTerm && !v.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterProducto && !v.items.some(item => item.nombre_producto.toLowerCase().includes(filterProducto.toLowerCase()))) return false
      if (filterMetodoPago && v.metodo_pago !== filterMetodoPago) return false
      return true
    })
  }, [ventas, searchTerm, filterProducto, filterMetodoPago])

  const productosActivos = useMemo(() => {
    return productos.filter(p => p.activo)
  }, [productos])

  const resumen = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const ventasMes = ventas.filter(v => {
      const d = new Date(v.fecha_venta)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const totalVendido = ventasMes.reduce((sum, v) => sum + v.total, 0)
    const unidadesVendidas = ventasMes.reduce((sum, v) => sum + v.items.reduce((s, i) => s + i.cantidad, 0), 0)
    const utilidadGenerada = ventasMes.reduce((sum, v) => sum + v.utilidad, 0)
    const margenPromedio = ventasMes.length > 0 ? ventasMes.reduce((sum, v) => sum + v.margen_utilidad_pct, 0) / ventasMes.length : 0

    return { totalVendido, unidadesVendidas, utilidadGenerada, margenPromedio }
  }, [ventas])

  // Chart data - ventas por mes (últimos 6 meses)
  const ventasPorMes = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('es-ES', { month: 'short' })
      const monthVentas = ventas.filter(v => {
        const vd = new Date(v.fecha_venta)
        return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear()
      })
      months.push({
        month: monthName,
        ventas: monthVentas.reduce((sum, v) => sum + v.total, 0)
      })
    }
    return months
  }, [ventas])

  // Chart data - utilidad neta por mes
  const utilidadPorMes = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('es-ES', { month: 'short' })
      const monthVentas = ventas.filter(v => {
        const vd = new Date(v.fecha_venta)
        return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear()
      })
      months.push({
        month: monthName,
        utilidad: monthVentas.reduce((sum, v) => sum + v.utilidad, 0)
      })
    }
    return months
  }, [ventas])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const itemsWithSubtotal = formData.items.map(item => ({
      ...item,
      subtotal: item.cantidad * item.precio_unitario
    }))

    const data = {
      ...formData,
      items: itemsWithSubtotal
    }

    addVentaDirecta(data)
    setShowModal(false)
    resetFormData()
  }

  const resetFormData = () => {
    setFormData({
      nombre_cliente: '',
      items: [],
      aplicar_iva: false,
      metodo_pago: 'Efectivo'
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { producto_id: '', nombre_producto: '', cantidad: 1, precio_unitario: 0 }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          if (field === 'producto_id') {
            const producto = productosActivos.find(p => p.id === value)
            return {
              ...item,
              producto_id: value,
              nombre_producto: producto?.nombre_producto || '',
              precio_unitario: producto?.precio_venta || 0
            }
          }
          return { ...item, [field]: value }
        }
        return item
      })
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0)
    const iva = formData.aplicar_iva ? subtotal * 0.19 : 0
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  const { subtotal, iva, total } = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Ventas</h1>
          <p className="text-neutral-500 mt-1">Gestiona tus ventas y análisis</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          icon={Plus}
        >
          Venta Directa
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-100 p-2 rounded-lg">
              <DollarSign size={20} className="text-primary-600" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Total Vendido (Mes)</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(resumen.totalVendido)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-info-100 p-2 rounded-lg">
              <Package size={20} className="text-info-600" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Unidades Vendidas</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{resumen.unidadesVendidas}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-success-100 p-2 rounded-lg">
              <TrendingUp size={20} className="text-success-600" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Utilidad Generada</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(resumen.utilidadGenerada)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-secondary-100 p-2 rounded-lg">
              <ShoppingCart size={20} className="text-secondary-600" />
            </div>
            <p className="text-sm font-medium text-neutral-500">Margen Promedio</p>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{resumen.margenPromedio.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated" padding="md">
          <h3 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Ventas por Mes (Últimos 6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="ventas" fill="#D97706" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card variant="elevated" padding="md">
          <h3 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Utilidad Neta por Mes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilidadPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="utilidad" stroke="#059669" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            value={filterProducto}
            onChange={(e) => setFilterProducto(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="">Todos los productos</option>
            {productosActivos.map(p => <option key={p.id} value={p.nombre_producto}>{p.nombre_producto}</option>)}
          </select>
          <select
            value={filterMetodoPago}
            onChange={(e) => setFilterMetodoPago(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="">Todos los métodos</option>
            {['Efectivo', 'Transferencia bancaria', 'Nequi', 'Daviplata', 'Otro'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Utilidad</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Margen</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Método Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredVentas.map(venta => (
                <tr key={venta.id} className="hover:bg-neutral-50 transition-base">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">{venta.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(venta.fecha_venta)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{venta.nombre_cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">{formatCurrency(venta.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-heading font-medium">{formatCurrency(venta.utilidad)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{venta.margen_utilidad_pct.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{venta.metodo_pago}</td>
                </tr>
              ))}
              {filteredVentas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Venta Directa */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetFormData() }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Registrar Venta Directa
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del Cliente *</label>
              <Input
                type="text"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                required
              />
            </div>

            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Ítems</h3>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start bg-neutral-50 p-3 rounded-lg">
                    <select
                      value={item.producto_id}
                      onChange={(e) => updateItem(index, 'producto_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                    >
                      <option value="">Seleccionar producto...</option>
                      {productosActivos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre_producto} - {formatCurrency(p.precio_venta)}</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      placeholder="Cant"
                      min="1"
                      className="w-20"
                    />
                    <Input
                      type="number"
                      value={item.precio_unitario}
                      onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      min="0"
                      step="100"
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-error-600 hover:text-error-800 p-1 hover:bg-error-50 rounded transition-base"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  + Agregar ítem
                </button>
              </div>
            </div>

            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal:</span>
                <span className="font-medium text-neutral-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">IVA (19%):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.aplicar_iva}
                    onChange={(e) => setFormData(prev => ({ ...prev, aplicar_iva: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="font-medium text-neutral-900">{formatCurrency(iva)}</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-primary-200 pt-2">
                <span className="text-neutral-900">Total:</span>
                <span className="text-neutral-900">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Método de Pago</label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, metodo_pago: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              >
                {['Efectivo', 'Transferencia bancaria', 'Nequi', 'Daviplata', 'Otro'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowModal(false); resetFormData() }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Venta
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
