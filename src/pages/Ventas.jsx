import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Search, ShoppingCart, TrendingUp, DollarSign, Package } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts'

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
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Ventas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Venta Directa
        </button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <DollarSign size={20} className="text-amber-600" />
            </div>
            <p className="text-sm text-gray-600">Total Vendido (Mes)</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.totalVendido)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package size={20} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Unidades Vendidas</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{resumen.unidadesVendidas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Utilidad Generada</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.utilidadGenerada)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <ShoppingCart size={20} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Margen Promedio</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{resumen.margenPromedio.toFixed(1)}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
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
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
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
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterProducto}
          onChange={(e) => setFilterProducto(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todos los productos</option>
          {productosActivos.map(p => <option key={p.id} value={p.nombre_producto}>{p.nombre_producto}</option>)}
        </select>
        <select
          value={filterMetodoPago}
          onChange={(e) => setFilterMetodoPago(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todos los métodos</option>
          {['Efectivo', 'Transferencia bancaria', 'Nequi', 'Daviplata', 'Otro'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Utilidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Margen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Método Pago</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVentas.map(venta => (
              <tr key={venta.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venta.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(venta.fecha_venta)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.nombre_cliente}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(venta.total)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(venta.utilidad)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.margen_utilidad_pct.toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.metodo_pago}</td>
              </tr>
            ))}
            {filteredVentas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron ventas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Venta Directa */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetFormData() }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Registrar Venta Directa
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
              <input
                type="text"
                value={formData.nombre_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Ítems</h3>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                    <select
                      value={item.producto_id}
                      onChange={(e) => updateItem(index, 'producto_id', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Seleccionar producto...</option>
                      {productosActivos.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre_producto} - {formatCurrency(p.precio_venta)}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                      placeholder="Cant"
                      min="1"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="number"
                      value={item.precio_unitario}
                      onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      min="0"
                      step="100"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                >
                  + Agregar ítem
                </button>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">IVA (19%):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.aplicar_iva}
                    onChange={(e) => setFormData(prev => ({ ...prev, aplicar_iva: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="font-medium">{formatCurrency(iva)}</span>
                </div>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-amber-200 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
              <select
                value={formData.metodo_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, metodo_pago: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                {['Efectivo', 'Transferencia bancaria', 'Nequi', 'Daviplata', 'Otro'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetFormData() }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Registrar Venta
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
