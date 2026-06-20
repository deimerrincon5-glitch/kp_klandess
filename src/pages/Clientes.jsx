import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Edit, Trash2, Search, User, ShoppingCart, Star } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

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
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Clientes</h1>
          <p className="text-neutral-500 mt-1">Gestiona tu base de clientes</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          icon={Plus}
        >
          Agregar Cliente
        </Button>
      </div>

      {/* Search */}
      <Card variant="elevated" padding="md">
        <div className="max-w-md">
          <Input
            type="text"
            placeholder="Buscar por nombre, documento o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Ciudad</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Total Compras</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredClientes.map(cliente => (
                <tr key={cliente.id} className="hover:bg-neutral-50 cursor-pointer transition-base" onClick={() => openDetail(cliente)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-100 p-2 rounded-full">
                        <User size={18} className="text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-heading font-medium text-neutral-900">{cliente.nombre_completo}</p>
                          {isClienteFrecuente(cliente.id) && <Star size={14} className="text-warning-500 fill-warning-500" />}
                        </div>
                        <p className="text-xs text-neutral-500">{cliente.documento}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{cliente.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-neutral-900">{cliente.telefono}</p>
                    <p className="text-xs text-neutral-500">{cliente.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{cliente.ciudad}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-heading font-medium text-neutral-900">
                    {formatCurrency(getTotalCompras(cliente.id))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingItem(cliente); setShowModal(true) }}
                      className="text-primary-600 hover:text-primary-800 transition-base p-1 hover:bg-primary-50 rounded"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente)}
                      className="text-error-600 hover:text-error-800 transition-base p-1 hover:bg-error-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Agregar/Editar */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null) }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            {editingItem ? 'Editar Cliente' : 'Agregar Cliente'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre Completo *</label>
              <Input
                name="nombre_completo"
                defaultValue={editingItem?.nombre_completo}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo *</label>
                <select
                  name="tipo"
                  defaultValue={editingItem?.tipo}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                >
                  <option value="Persona Natural">Persona Natural</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Documento (CC/NIT) *</label>
                <Input
                  name="documento"
                  defaultValue={editingItem?.documento}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                <Input
                  type="email"
                  name="email"
                  defaultValue={editingItem?.email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono *</label>
                <Input
                  name="telefono"
                  defaultValue={editingItem?.telefono}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Ciudad *</label>
                <Input
                  name="ciudad"
                  defaultValue={editingItem?.ciudad}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Dirección</label>
                <Input
                  name="direccion"
                  defaultValue={editingItem?.direccion}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
              <textarea
                name="notas"
                defaultValue={editingItem?.notas}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowModal(false); setEditingItem(null) }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Detalle */}
      {showDetailModal && detailItem && (
        <Modal onClose={() => { setShowDetailModal(false); setDetailItem(null) }}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <User size={24} className="text-primary-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-semibold text-neutral-900">{detailItem.nombre_completo}</h2>
                <p className="text-sm text-neutral-600">{detailItem.tipo} • {detailItem.documento}</p>
                {isClienteFrecuente(detailItem.id) && (
                  <div className="flex items-center gap-1 text-warning-600 text-sm">
                    <Star size={14} className="fill-warning-600" />
                    <span>Cliente frecuente</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-600">Email:</p>
                <p className="font-medium text-neutral-900">{detailItem.email || '-'}</p>
              </div>
              <div>
                <p className="text-neutral-600">Teléfono:</p>
                <p className="font-medium text-neutral-900">{detailItem.telefono}</p>
              </div>
              <div>
                <p className="text-neutral-600">Ciudad:</p>
                <p className="font-medium text-neutral-900">{detailItem.ciudad}</p>
              </div>
              <div>
                <p className="text-neutral-600">Dirección:</p>
                <p className="font-medium text-neutral-900">{detailItem.direccion || '-'}</p>
              </div>
            </div>

            {detailItem.notas && (
              <div>
                <p className="text-sm text-neutral-600 mb-1">Notas:</p>
                <p className="text-sm bg-neutral-50 p-3 rounded-lg text-neutral-900">{detailItem.notas}</p>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <ShoppingCart size={18} />
                Historial de Pedidos
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getClienteHistorial(detailItem.id).length === 0 ? (
                  <p className="text-neutral-500 text-sm">No hay pedidos registrados</p>
                ) : (
                  getClienteHistorial(detailItem.id).map(pedido => (
                    <div key={pedido.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-sm">
                      <div>
                        <p className="font-heading font-medium text-neutral-900">{pedido.id}</p>
                        <p className="text-neutral-600">{formatDate(pedido.fecha_pedido)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-medium text-neutral-900">{formatCurrency(pedido.total)}</p>
                        <Badge
                          variant={
                            pedido.estado === 'Entregado' ? 'success' :
                            pedido.estado === 'Pendiente' ? 'warning' :
                            'info'
                          }
                        >
                          {pedido.estado}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Total histórico de compras:</span>
                <span className="text-xl font-bold text-neutral-900">{formatCurrency(getTotalCompras(detailItem.id))}</span>
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
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
