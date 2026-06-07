import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Edit, Trash2, Search, User, ShoppingCart, Star } from 'lucide-react'

export default function Clientes() {
  const { clientes, pedidos, addCliente, updateCliente, deleteCliente } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          c.nombre_completo.toLowerCase().includes(term) ||
          c.documento.toLowerCase().includes(term) ||
          c.ciudad.toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [clientes, searchTerm])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      nombre_completo: formData.get('nombre_completo'),
      tipo: formData.get('tipo'),
      documento: formData.get('documento'),
      email: formData.get('email'),
      telefono: formData.get('telefono'),
      ciudad: formData.get('ciudad'),
      direccion: formData.get('direccion'),
      notas: formData.get('notas')
    }

    if (editingItem) {
      updateCliente(editingItem.id, data)
    } else {
      addCliente(data)
    }
    setShowModal(false)
    setEditingItem(null)
  }

  const handleDelete = (item) => {
    if (window.confirm(`¿Está seguro de eliminar a "${item.nombre_completo}"?`)) {
      deleteCliente(item.id)
    }
  }

  const getClienteHistorial = (clienteId) => {
    return pedidos.filter(p => p.cliente_id === clienteId)
  }

  const getTotalCompras = (clienteId) => {
    const pedidosCliente = pedidos.filter(p => 
      p.cliente_id === clienteId && 
      (p.estado === 'Entregado' || p.estado_pago === 'Pagado')
    )
    return pedidosCliente.reduce((sum, p) => sum + p.total, 0)
  }

  const isClienteFrecuente = (clienteId) => {
    const pedidosEntregados = pedidos.filter(p => 
      p.cliente_id === clienteId && p.estado === 'Entregado'
    )
    return pedidosEntregados.length > 3
  }

  const openDetail = (cliente) => {
    setDetailItem(cliente)
    setShowDetailModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Clientes</h1>
        <button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Agregar Cliente
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, documento o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Ciudad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Total Compras</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredClientes.map(cliente => (
              <tr key={cliente.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(cliente)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <User size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{cliente.nombre_completo}</p>
                        {isClienteFrecuente(cliente.id) && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs text-gray-500">{cliente.documento}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.tipo}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm text-gray-900">{cliente.telefono}</p>
                  <p className="text-xs text-gray-500">{cliente.email}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{cliente.ciudad}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(getTotalCompras(cliente.id))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingItem(cliente); setShowModal(true) }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(cliente)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredClientes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron clientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Agregar/Editar */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null) }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            {editingItem ? 'Editar Cliente' : 'Agregar Cliente'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <input
                name="nombre_completo"
                defaultValue={editingItem?.nombre_completo}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  name="tipo"
                  defaultValue={editingItem?.tipo}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Persona Natural">Persona Natural</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento (CC/NIT) *</label>
                <input
                  name="documento"
                  defaultValue={editingItem?.documento}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingItem?.email}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  name="telefono"
                  defaultValue={editingItem?.telefono}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input
                  name="ciudad"
                  defaultValue={editingItem?.ciudad}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  name="direccion"
                  defaultValue={editingItem?.direccion}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                name="notas"
                defaultValue={editingItem?.notas}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingItem(null) }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                {editingItem ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Detalle */}
      {showDetailModal && detailItem && (
        <Modal onClose={() => { setShowDetailModal(false); setDetailItem(null) }}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-3 rounded-full">
                <User size={24} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-playfair text-xl font-semibold text-amber-900">{detailItem.nombre_completo}</h2>
                <p className="text-sm text-gray-600">{detailItem.tipo} • {detailItem.documento}</p>
                {isClienteFrecuente(detailItem.id) && (
                  <div className="flex items-center gap-1 text-yellow-600 text-sm">
                    <Star size={14} className="fill-yellow-600" />
                    <span>Cliente frecuente</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-medium">{detailItem.email || '-'}</p>
              </div>
              <div>
                <p className="text-gray-600">Teléfono:</p>
                <p className="font-medium">{detailItem.telefono}</p>
              </div>
              <div>
                <p className="text-gray-600">Ciudad:</p>
                <p className="font-medium">{detailItem.ciudad}</p>
              </div>
              <div>
                <p className="text-gray-600">Dirección:</p>
                <p className="font-medium">{detailItem.direccion || '-'}</p>
              </div>
            </div>

            {detailItem.notas && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Notas:</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">{detailItem.notas}</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingCart size={18} />
                Historial de Pedidos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getClienteHistorial(detailItem.id).length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay pedidos registrados</p>
                ) : (
                  getClienteHistorial(detailItem.id).map(pedido => (
                    <div key={pedido.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium">{pedido.id}</p>
                        <p className="text-gray-600">{formatDate(pedido.fecha_pedido)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(pedido.total)}</p>
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

            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total histórico de compras:</span>
                <span className="text-xl font-bold text-amber-900">{formatCurrency(getTotalCompras(detailItem.id))}</span>
              </div>
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
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
