import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, addDaysToDate, getCurrentDateISO } from '../utils/format'
import { Plus, Edit, Trash2, Search, FileText, Check, X, Printer, Send, ShoppingCart, Package, DollarSign, Percent } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

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
    const variants = {
      'Borrador': 'secondary',
      'Enviada': 'info',
      'Aprobada': 'success',
      'Rechazada': 'error',
      'Vencida': 'warning'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
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
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Cotizaciones</h1>
          <p className="text-neutral-500 mt-1">Gestiona tus cotizaciones y propuestas</p>
        </div>
        <Button
          onClick={() => openModal()}
          icon={Plus}
        >
          Nueva Cotización
        </Button>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              placeholder="Buscar por ID o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(estado => <option key={estado} value={estado}>{estado}</option>)}
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
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredCotizaciones.map(cotizacion => {
                const clienteNombre = cotizacion.cliente_id 
                  ? clientes.find(cl => cl.id === cotizacion.cliente_id)?.nombre_completo
                  : cotizacion.nombre_cliente_temporal
                return (
                  <tr key={cotizacion.id} className="hover:bg-neutral-50 transition-base">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">{cotizacion.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{clienteNombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(cotizacion.fecha_creacion)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(cotizacion.fecha_vencimiento)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">{formatCurrency(cotizacion.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(cotizacion.estado)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openModal(cotizacion)}
                        className="text-primary-600 hover:text-primary-800 transition-base p-1 hover:bg-primary-50 rounded"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => { setPrintItem(cotizacion); setShowPrintModal(true) }}
                        className="text-neutral-600 hover:text-neutral-800 transition-base p-1 hover:bg-neutral-100 rounded"
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
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron cotizaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            {editingItem ? 'Editar Cotización' : 'Nueva Cotización'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Cliente */}
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Datos del Cliente</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Cliente Registrado</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                  </select>
                </div>
                {!formData.cliente_id && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre Temporal *</label>
                        <Input
                          type="text"
                          value={formData.nombre_cliente_temporal}
                          onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente_temporal: e.target.value }))}
                          required={!formData.cliente_id}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono Temporal *</label>
                        <Input
                          type="text"
                          value={formData.telefono_cliente_temporal}
                          onChange={(e) => setFormData(prev => ({ ...prev, telefono_cliente_temporal: e.target.value }))}
                          required={!formData.cliente_id}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Ítems</h3>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="space-y-2 bg-neutral-50 p-4 rounded-lg">
                    <div className="flex gap-2">
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
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-error-600 hover:text-error-800 p-2 hover:bg-error-50 rounded transition-base"
                        aria-label="Eliminar ítem"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1">
                          <Package size={14} />
                          Cantidad
                        </label>
                        <Input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value) || 0)}
                          min="1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1">
                          <DollarSign size={14} />
                          Precio Unitario
                        </label>
                        <Input
                          type="number"
                          value={item.precio_unitario}
                          onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="100"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1 flex items-center gap-1">
                          <Percent size={14} />
                          Descuento (%)
                        </label>
                        <Input
                          type="number"
                          value={item.descuento_pct}
                          onChange={(e) => updateItem(index, 'descuento_pct', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} />
                  Agregar ítem
                </button>
              </div>
            </div>

            {/* Totales */}
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

            {/* Notas y condiciones */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Condiciones de Pago</label>
                <Input
                  type="text"
                  value={formData.condiciones_pago}
                  onChange={(e) => setFormData(prev => ({ ...prev, condiciones_pago: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowModal(false); setEditingItem(null); resetFormData() }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Print Modal */}
      {showPrintModal && printItem && (
        <Modal onClose={() => { setShowPrintModal(false); setPrintItem(null) }}>
          <div className="space-y-4">
            <div className="text-center border-b border-neutral-200 pb-4">
              <h2 className="font-display text-2xl font-bold text-neutral-900">Velas Artesanales</h2>
              <p className="text-neutral-600">Cotización {printItem.id}</p>
              <p className="text-sm text-neutral-500">{formatDate(printItem.fecha_creacion)}</p>
            </div>

            <div>
              <p className="text-sm text-neutral-600">Cliente:</p>
              <p className="font-heading font-medium text-neutral-900">
                {printItem.cliente_id 
                  ? clientes.find(cl => cl.id === printItem.cliente_id)?.nombre_completo
                  : printItem.nombre_cliente_temporal}
              </p>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2">Producto</th>
                  <th className="text-right py-2">Cant</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Desc</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {printItem.items.map((item, index) => (
                  <tr key={index} className="border-b border-neutral-100">
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
                <span className="text-neutral-600">Subtotal:</span>
                <span className="text-neutral-900">{formatCurrency(printItem.subtotal)}</span>
              </div>
              {printItem.aplicar_iva && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">IVA (19%):</span>
                  <span className="text-neutral-900">{formatCurrency(printItem.iva_monto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-neutral-200 pt-2">
                <span className="text-neutral-900">Total:</span>
                <span className="text-neutral-900">{formatCurrency(printItem.total)}</span>
              </div>
            </div>

            {printItem.condiciones_pago && (
              <div className="bg-neutral-50 p-3 rounded-lg text-sm">
                <p className="font-heading font-medium text-neutral-900">Condiciones de pago:</p>
                <p className="text-neutral-700">{printItem.condiciones_pago}</p>
              </div>
            )}

            {printItem.notas && (
              <div className="bg-neutral-50 p-3 rounded-lg text-sm">
                <p className="font-heading font-medium text-neutral-900">Notas:</p>
                <p className="text-neutral-700">{printItem.notas}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={() => window.print()}
                icon={Printer}
              >
                Imprimir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
