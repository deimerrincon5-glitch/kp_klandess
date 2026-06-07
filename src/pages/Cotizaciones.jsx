import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, addDaysToDate, getCurrentDateISO } from '../utils/format'
import { Plus, Edit, Trash2, Search, FileText, Check, X, Printer, Send, ShoppingCart } from 'lucide-react'

const ESTADOS = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Vencida']

export default function Cotizaciones() {
  const navigate = useNavigate()
  const { cotizaciones, clientes, productos, addCotizacion, updateCotizacion, deleteCotizacion, aprobarCotizacion, actualizarCotizacionesVencidas } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [printItem, setPrintItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const [formData, setFormData] = useState({
    cliente_id: '',
    nombre_cliente_temporal: '',
    telefono_cliente_temporal: '',
    items: [],
    aplicar_iva: false,
    notas: '',
    condiciones_pago: ''
  })

  useEffect(() => {
    actualizarCotizacionesVencidas()
  }, [actualizarCotizacionesVencidas])

  const filteredCotizaciones = useMemo(() => {
    return cotizaciones.filter(c => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const clienteNombre = c.cliente_id 
          ? (clientes.find(cl => cl.id === c.cliente_id)?.nombre_completo || '').toLowerCase()
          : c.nombre_cliente_temporal.toLowerCase()
        return (
          c.id.toLowerCase().includes(term) ||
          clienteNombre.includes(term)
        )
      }
      if (filterEstado && c.estado !== filterEstado) return false
      return true
    })
  }, [cotizaciones, searchTerm, filterEstado, clientes])

  const productosActivos = useMemo(() => {
    return productos.filter(p => p.activo)
  }, [productos])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Calculate items
    const itemsWithSubtotal = formData.items.map(item => ({
      ...item,
      subtotal: item.cantidad * item.precio_unitario * (1 - item.descuento_pct / 100)
    }))

    const data = {
      ...formData,
      items: itemsWithSubtotal
    }

    if (editingItem) {
      updateCotizacion(editingItem.id, data)
    } else {
      addCotizacion(data)
    }
    setShowModal(false)
    setEditingItem(null)
    resetFormData()
  }

  const handleDelete = (item) => {
    if (window.confirm(`¿Está seguro de eliminar la cotización ${item.id}?`)) {
      deleteCotizacion(item.id)
    }
  }

  const handleAprobar = (cotizacion) => {
    if (window.confirm(`¿Está seguro de aprobar la cotización ${cotizacion.id}? Esto creará automáticamente un pedido.`)) {
      const pedidoId = aprobarCotizacion(cotizacion.id)
      navigate(`/pedidos`)
    }
  }

  const resetFormData = () => {
    setFormData({
      cliente_id: '',
      nombre_cliente_temporal: '',
      telefono_cliente_temporal: '',
      items: [],
      aplicar_iva: false,
      notas: '',
      condiciones_pago: ''
    })
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        cliente_id: item.cliente_id || '',
        nombre_cliente_temporal: item.nombre_cliente_temporal || '',
        telefono_cliente_temporal: item.telefono_cliente_temporal || '',
        items: item.items || [],
        aplicar_iva: item.aplicar_iva,
        notas: item.notas || '',
        condiciones_pago: item.condiciones_pago || ''
      })
    } else {
      setEditingItem(null)
      resetFormData()
    }
    setShowModal(true)
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { producto_id: '', nombre_producto: '', cantidad: 1, precio_unitario: 0, descuento_pct: 0 }]
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
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.cantidad * item.precio_unitario * (1 - item.descuento_pct / 100))
    }, 0)
    const iva = formData.aplicar_iva ? subtotal * 0.19 : 0
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  const { subtotal, iva, total } = calculateTotals()

  const getEstadoBadge = (estado) => {
    const colors = {
      'Borrador': 'bg-gray-100 text-gray-800',
      'Enviada': 'bg-blue-100 text-blue-800',
      'Aprobada': 'bg-green-100 text-green-800',
      'Rechazada': 'bg-red-100 text-red-800',
      'Vencida': 'bg-orange-100 text-orange-800'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[estado]}`}>{estado}</span>
  }

  const getEstadoActions = (cotizacion) => {
    switch (cotizacion.estado) {
      case 'Borrador':
        return (
          <>
            <button
              onClick={() => updateCotizacion(cotizacion.id, { estado: 'Enviada' })}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
              title="Enviar"
            >
              <Send size={16} /> Enviar
            </button>
            <button
              onClick={() => handleDelete(cotizacion)}
              className="text-red-600 hover:text-red-800"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </>
        )
      case 'Enviada':
        return (
          <>
            <button
              onClick={() => handleAprobar(cotizacion)}
              className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
              title="Aprobar"
            >
              <Check size={16} /> Aprobar
            </button>
            <button
              onClick={() => updateCotizacion(cotizacion.id, { estado: 'Rechazada' })}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
              title="Rechazar"
            >
              <X size={16} /> Rechazar
            </button>
          </>
        )
      case 'Aprobada':
        return (
          <button
            onClick={() => navigate(`/pedidos`)}
            className="text-amber-600 hover:text-amber-800 flex items-center gap-1 text-sm"
            title="Ver pedido"
          >
            <ShoppingCart size={16} /> Ver Pedido
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Cotizaciones</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Nueva Cotización
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(estado => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Vencimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCotizaciones.map(cotizacion => {
              const clienteNombre = cotizacion.cliente_id 
                ? clientes.find(cl => cl.id === cotizacion.cliente_id)?.nombre_completo
                : cotizacion.nombre_cliente_temporal
              return (
                <tr key={cotizacion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cotizacion.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{clienteNombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(cotizacion.fecha_creacion)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(cotizacion.fecha_vencimiento)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(cotizacion.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(cotizacion.estado)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openModal(cotizacion)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => { setPrintItem(cotizacion); setShowPrintModal(true) }}
                      className="text-gray-600 hover:text-gray-800"
                      title="Imprimir"
                    >
                      <Printer size={18} />
                    </button>
                    {getEstadoActions(cotizacion)}
                  </td>
                </tr>
              )
            })}
            {filteredCotizaciones.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron cotizaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            {editingItem ? 'Editar Cotización' : 'Nueva Cotización'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Cliente */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Datos del Cliente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente Registrado</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                  </select>
                </div>
                {!formData.cliente_id && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Temporal *</label>
                        <input
                          type="text"
                          value={formData.nombre_cliente_temporal}
                          onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente_temporal: e.target.value }))}
                          required={!formData.cliente_id}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Temporal *</label>
                        <input
                          type="text"
                          value={formData.telefono_cliente_temporal}
                          onChange={(e) => setFormData(prev => ({ ...prev, telefono_cliente_temporal: e.target.value }))}
                          required={!formData.cliente_id}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items */}
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
                    <input
                      type="number"
                      value={item.descuento_pct}
                      onChange={(e) => updateItem(index, 'descuento_pct', parseFloat(e.target.value) || 0)}
                      placeholder="Desc %"
                      min="0"
                      max="100"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X size={18} />
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

            {/* Totales */}
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

            {/* Notas y condiciones */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condiciones de Pago</label>
                <input
                  type="text"
                  value={formData.condiciones_pago}
                  onChange={(e) => setFormData(prev => ({ ...prev, condiciones_pago: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingItem(null); resetFormData() }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                {editingItem ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Print Modal */}
      {showPrintModal && printItem && (
        <Modal onClose={() => { setShowPrintModal(false); setPrintItem(null) }}>
          <div className="space-y-4">
            <div className="text-center border-b border-gray-200 pb-4">
              <h2 className="font-playfair text-2xl font-bold text-amber-900">Velas Artesanales</h2>
              <p className="text-gray-600">Cotización {printItem.id}</p>
              <p className="text-sm text-gray-500">{formatDate(printItem.fecha_creacion)}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Cliente:</p>
              <p className="font-medium">
                {printItem.cliente_id 
                  ? clientes.find(cl => cl.id === printItem.cliente_id)?.nombre_completo
                  : printItem.nombre_cliente_temporal}
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-right py-2">Cant</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Desc</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {printItem.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2">{item.nombre_producto}</td>
                    <td className="text-right py-2">{item.cantidad}</td>
                    <td className="text-right py-2">{formatCurrency(item.precio_unitario)}</td>
                    <td className="text-right py-2">{item.descuento_pct}%</td>
                    <td className="text-right py-2">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(printItem.subtotal)}</span>
              </div>
              {printItem.aplicar_iva && (
                <div className="flex justify-between">
                  <span>IVA (19%):</span>
                  <span>{formatCurrency(printItem.iva_monto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>{formatCurrency(printItem.total)}</span>
              </div>
            </div>

            {printItem.condiciones_pago && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium">Condiciones de pago:</p>
                <p>{printItem.condiciones_pago}</p>
              </div>
            )}

            {printItem.notas && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium">Notas:</p>
                <p>{printItem.notas}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
              >
                <Printer size={18} /> Imprimir
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
