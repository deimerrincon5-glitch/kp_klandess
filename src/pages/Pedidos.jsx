import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, addDaysToDate, getCurrentDateISO } from '../utils/format'
import { Plus, Edit, Trash2, Search, ClipboardList, AlertTriangle, LayoutGrid, Table, CheckCircle, XCircle, Clock, Package } from 'lucide-react'

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
    const colors = {
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'En producción': 'bg-blue-100 text-blue-800',
      'Listo': 'bg-purple-100 text-purple-800',
      'Entregado': 'bg-green-100 text-green-800',
      'Cancelado': 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[estado]}`}>{estado}</span>
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
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Pedidos</h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`}
            >
              <Table size={20} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-amber-100 text-amber-700' : 'text-gray-500'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={18} />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Pedidos Activos</p>
          <p className="text-2xl font-bold text-gray-900">{resumen.pedidosActivosCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Valor en Curso</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.valorEnCurso)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Alertas de Entrega</p>
          <p className="text-2xl font-bold text-red-600">{resumen.alertasEntrega}</p>
        </div>
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

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Fecha Entrega</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPedidos.map(pedido => (
                <tr key={pedido.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{pedido.id}</span>
                      {isEntregaProxima(pedido) && <AlertTriangle size={14} className="text-red-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pedido.nombre_cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(pedido.fecha_entrega_estimada)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(pedido.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(pedido.estado)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{pedido.estado_pago}</span>
                    {pedido.adelanto > 0 && <span className="text-xs text-gray-500"> ({formatCurrency(pedido.adelanto)})</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => openModal(pedido)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    {pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
                      <button
                        onClick={() => handleMarcarEntregadoYPagado(pedido)}
                        className="text-green-600 hover:text-green-800"
                        title="Marcar entregado y pagado"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(pedido)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPedidos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron pedidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(column => (
            <div key={column.estado} className="flex-shrink-0 w-80 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{column.estado}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{column.pedidos.length}</span>
                  <span className="text-sm text-gray-600">{formatCurrency(column.total)}</span>
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
                  <p className="text-center text-gray-500 text-sm py-4">Sin pedidos</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            {editingItem ? 'Editar Pedido' : 'Nuevo Pedido'}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                  </select>
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <input
                      type="text"
                      value={formData.telefono_cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_cliente: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega Estimada *</label>
                    <input
                      type="date"
                      value={formData.fecha_entrega_estimada}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_entrega_estimada: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    value={formData.direccion_entrega}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion_entrega: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
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
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <XCircle size={18} />
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

            {/* Pago */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Información de Pago</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) => setFormData(prev => ({ ...prev, metodo_pago: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      {METODOS_PAGO.map(metodo => <option key={metodo} value={metodo}>{metodo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
                    <select
                      value={formData.estado_pago}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado_pago: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      {ESTADOS_PAGO.map(estado => <option key={estado} value={estado}>{estado}</option>)}
                    </select>
                  </div>
                </div>
                {formData.estado_pago === 'Pago parcial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adelanto</label>
                    <input
                      type="number"
                      value={formData.adelanto}
                      onChange={(e) => setFormData(prev => ({ ...prev, adelanto: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
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
    </div>
  )
}

function KanbanCard({ pedido, onEstadoChange, onMarcarEntregadoYPagado, isEntregaProxima, getEstadoBadge }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{pedido.id}</span>
        {isEntregaProxima && <AlertTriangle size={14} className="text-red-500" />}
      </div>
      <p className="text-sm text-gray-600 mb-2">{pedido.nombre_cliente}</p>
      <p className="text-lg font-bold text-amber-900 mb-3">{formatCurrency(pedido.total)}</p>
      <div className="space-y-2">
        <select
          value={pedido.estado}
          onChange={(e) => onEstadoChange(pedido.id, e.target.value)}
          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500"
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En producción">En producción</option>
          <option value="Listo">Listo</option>
          <option value="Entregado">Entregado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        {pedido.estado !== 'Entregado' && pedido.estado !== 'Cancelado' && (
          <button
            onClick={() => onMarcarEntregadoYPagado(pedido)}
            className="w-full text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
          >
            Marcar Entregado y Pagado
          </button>
        )}
      </div>
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
