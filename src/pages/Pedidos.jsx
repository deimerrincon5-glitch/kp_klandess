import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, addDaysToDate, getCurrentDateISO } from '../utils/format'
import { Plus, Edit, Trash2, Search, ClipboardList, AlertTriangle, LayoutGrid, Table, CheckCircle, XCircle, Clock, Package } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const ESTADOS = ['Pendiente', 'En producción', 'Listo', 'Entregado', 'Cancelado']
const ESTADOS_PAGO = ['Pendiente', 'Pago parcial', 'Pagado']
const METODOS_PAGO = ['Efectivo', 'Transferencia bancaria', 'Nequi', 'Daviplata', 'Otro']

export default function Pedidos() {
  const navigate = useNavigate()
  const { pedidos, clientes, productos, addPedido, updatePedido, deletePedido, marcarEntregadoYPagado, dashboardData } = useApp()
  const [viewMode, setViewMode] = useState('table') // 'table' or 'kanban'
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

  const [formData, setFormData] = useState({
    cliente_id: '',
    nombre_cliente: '',
    telefono_cliente: '',
    direccion_entrega: '',
    fecha_entrega_estimada: addDaysToDate(getCurrentDateISO(), 7).split('T')[0],
    items: [],
    aplicar_iva: false,
    metodo_pago: 'Transferencia bancaria',
    estado_pago: 'Pendiente',
    adelanto: 0,
    notas: ''
  })

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          p.id.toLowerCase().includes(term) ||
          p.nombre_cliente.toLowerCase().includes(term)
        )
      }
      if (filterEstado && p.estado !== filterEstado) return false
      return true
    })
  }, [pedidos, searchTerm, filterEstado])

  const productosActivos = useMemo(() => {
    return productos.filter(p => p.activo)
  }, [productos])

  const kanbanColumns = ESTADOS.filter(e => e !== 'Cancelado').map(estado => ({
    estado,
    pedidos: filteredPedidos.filter(p => p.estado === estado),
    total: filteredPedidos.filter(p => p.estado === estado).reduce((sum, p) => sum + p.total, 0)
  }))

  const resumen = useMemo(() => {
    const pedidosActivos = pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En producción' || p.estado === 'Listo')
    const valorEnCurso = pedidosActivos.reduce((sum, p) => sum + p.total, 0)
    const alertasEntrega = dashboardData.pedidosEntregaProximaCount
    return { pedidosActivosCount: pedidosActivos.length, valorEnCurso, alertasEntrega }
  }, [pedidos, dashboardData])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const itemsWithSubtotal = formData.items.map(item => ({
      ...item,
      subtotal: item.cantidad * item.precio_unitario
    }))

    const data = {
      ...formData,
      items: itemsWithSubtotal,
      fecha_entrega_estimada: formData.fecha_entrega_estimada
    }

    addPedido(data)
    setShowModal(false)
    setEditingItem(null)
    resetFormData()
  }

  const handleDelete = (item) => {
    if (window.confirm(`¿Está seguro de eliminar el pedido ${item.id}?`)) {
      deletePedido(item.id)
    }
  }

  const handleEstadoChange = (pedidoId, nuevoEstado) => {
    updatePedido(pedidoId, { estado: nuevoEstado })
  }

  const handleMarcarEntregadoYPagado = (pedido) => {
    if (pedido.estado_pago !== 'Pagado') {
      if (!window.confirm('El pedido no está pagado. ¿Desea marcarlo como pagado y entregado de todas formas?')) {
        return
      }
    }
    if (window.confirm(`¿Está seguro de marcar el pedido ${pedido.id} como entregado y pagado? Esto generará automáticamente una venta.`)) {
      marcarEntregadoYPagado(pedido.id)
    }
  }

  const resetFormData = () => {
    setFormData({
      cliente_id: '',
      nombre_cliente: '',
      telefono_cliente: '',
      direccion_entrega: '',
      fecha_entrega_estimada: addDaysToDate(getCurrentDateISO(), 7).split('T')[0],
      items: [],
      aplicar_iva: false,
      metodo_pago: 'Transferencia bancaria',
      estado_pago: 'Pendiente',
      adelanto: 0,
      notas: ''
    })
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        cliente_id: item.cliente_id || '',
        nombre_cliente: item.nombre_cliente,
        telefono_cliente: item.telefono_cliente,
        direccion_entrega: item.direccion_entrega,
        fecha_entrega_estimada: item.fecha_entrega_estimada.split('T')[0],
        items: item.items || [],
        aplicar_iva: item.aplicar_iva,
        metodo_pago: item.metodo_pago,
        estado_pago: item.estado_pago,
        adelanto: item.adelanto,
        notas: item.notas || ''
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

  const getEstadoBadge = (estado) => {
    const variants = {
      'Pendiente': 'warning',
      'En producción': 'info',
      'Listo': 'secondary',
      'Entregado': 'success',
      'Cancelado': 'error'
    }
    return <Badge variant={variants[estado]}>{estado}</Badge>
  }

  const isEntregaProxima = (pedido) => {
    const dosDiasDespues = new Date()
    dosDiasDespues.setDate(dosDiasDespues.getDate() + 2)
    const fechaEntrega = new Date(pedido.fecha_entrega_estimada)
    return fechaEntrega <= dosDiasDespues && pedido.estado !== 'Entregado'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Pedidos</h1>
          <p className="text-neutral-500 mt-1">Gestiona tus pedidos y seguimiento</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-2 border border-neutral-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-base ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-100'}`}
            >
              <Table size={20} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded transition-base ${viewMode === 'kanban' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-100'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <Button
            onClick={() => openModal()}
            icon={Plus}
          >
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Pedidos Activos</p>
          <p className="text-2xl font-bold text-neutral-900">{resumen.pedidosActivosCount}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Valor en Curso</p>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(resumen.valorEnCurso)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Alertas de Entrega</p>
          <p className="text-2xl font-bold text-error-600">{resumen.alertasEntrega}</p>
        </Card>
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

      {/* Table View */}
      {viewMode === 'table' && (
        <Card variant="elevated" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Fecha Entrega</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Pago</th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredPedidos.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-neutral-50 transition-base">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-heading font-medium text-neutral-900">{pedido.id}</span>
                        {isEntregaProxima(pedido) && <AlertTriangle size={14} className="text-error-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{pedido.nombre_cliente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{formatDate(pedido.fecha_entrega_estimada)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">{formatCurrency(pedido.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(pedido.estado)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-900">{pedido.estado_pago}</span>
                      {pedido.adelanto > 0 && <span className="text-xs text-neutral-500"> ({formatCurrency(pedido.adelanto)})</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => openModal(pedido)}
                        className="text-primary-600 hover:text-primary-800 transition-base p-1 hover:bg-primary-50 rounded"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      {pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
                        <button
                          onClick={() => handleMarcarEntregadoYPagado(pedido)}
                          className="text-success-600 hover:text-success-800 transition-base p-1 hover:bg-success-50 rounded"
                          title="Marcar entregado y pagado"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(pedido)}
                        className="text-error-600 hover:text-error-800 transition-base p-1 hover:bg-error-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPedidos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                      No se encontraron pedidos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(column => (
            <div key={column.estado} className="flex-shrink-0 w-80 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-medium text-neutral-900">{column.estado}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">{column.pedidos.length}</span>
                  <span className="text-sm text-neutral-600">{formatCurrency(column.total)}</span>
                </div>
              </div>
              <div className="space-y-3">
                {column.pedidos.map(pedido => (
                  <KanbanCard
                    key={pedido.id}
                    pedido={pedido}
                    onEstadoChange={handleEstadoChange}
                    onMarcarEntregadoYPagado={handleMarcarEntregadoYPagado}
                    isEntregaProxima={isEntregaProxima(pedido)}
                    getEstadoBadge={getEstadoBadge}
                  />
                ))}
                {column.pedidos.length === 0 && (
                  <p className="text-center text-neutral-500 text-sm py-4">Sin pedidos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            {editingItem ? 'Editar Pedido' : 'Nuevo Pedido'}
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
                    onChange={(e) => {
                      const cliente = clientes.find(c => c.id === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        cliente_id: e.target.value,
                        nombre_cliente: cliente?.nombre_completo || '',
                        telefono_cliente: cliente?.telefono || '',
                        direccion_entrega: cliente?.direccion || ''
                      }))
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del Cliente *</label>
                  <Input
                    type="text"
                    value={formData.nombre_cliente}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_cliente: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono *</label>
                    <Input
                      type="text"
                      value={formData.telefono_cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_cliente: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha Entrega Estimada *</label>
                    <input
                      type="date"
                      value={formData.fecha_entrega_estimada}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección de Entrega</label>
                  <Input
                    type="text"
                    value={formData.direccion_entrega}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion_entrega: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Items */}
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
                      <XCircle size={18} />
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

            {/* Pago */}
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Información de Pago</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Método de Pago</label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData(prev => ({ ...prev, metodo_pago: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                    >
                      {METODOS_PAGO.map(metodo => <option key={metodo} value={metodo}>{metodo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Estado de Pago</label>
                    <select
                      value={formData.estado_pago}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado_pago: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                    >
                      {ESTADOS_PAGO.map(estado => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </div>
                </div>
                {formData.estado_pago === 'Pago parcial' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Adelanto</label>
                    <Input
                      type="number"
                      value={formData.adelanto}
                      onChange={(e) => setFormData(prev => ({ ...prev, adelanto: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              />
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
    </div>
  )
}

function KanbanCard({ pedido, onEstadoChange, onMarcarEntregadoYPagado, isEntregaProxima, getEstadoBadge }) {
  return (
    <Card variant="elevated" padding="sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-heading font-medium text-neutral-900">{pedido.id}</span>
        {isEntregaProxima && <AlertTriangle size={14} className="text-error-500" />}
      </div>
      <p className="text-sm text-neutral-600 mb-2">{pedido.nombre_cliente}</p>
      <p className="text-lg font-bold text-neutral-900 mb-3">{formatCurrency(pedido.total)}</p>
      <div className="space-y-2">
        <select
          value={pedido.estado}
          onChange={(e) => onEstadoChange(pedido.id, e.target.value)}
          className="w-full text-xs px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En producción">En producción</option>
          <option value="Listo">Listo</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        {pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
          <Button
            onClick={() => onMarcarEntregadoYPagado(pedido)}
            variant="success"
            className="w-full text-xs"
          >
            Marcar Entregado y Pagado
          </Button>
        )}
      </div>
    </Card>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
