import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Edit, Trash2, Search, Filter, ShoppingCart, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const CATEGORIAS = ['Fragancia', 'Cera', 'Colorante', 'Envase', 'Decoración', 'Mecha', 'Pigmento', 'Aditivo', 'Otro']
const UNIDADES_MEDIDA = ['gramos', 'mililitros', 'unidades', 'kilogramos', 'litros']

export default function MateriaPrima() {
  const { materiasPrimas, addMateriaPrima, updateMateriaPrima, deleteMateriaPrima, registrarCompraMateriaPrima, productos } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [showCompraModal, setShowCompraModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [compraItem, setCompraItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterUnidad, setFilterUnidad] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')

  const filteredItems = useMemo(() => {
    return materiasPrimas.filter(mp => {
      if (!mp.activo) return false
      if (searchTerm && !mp.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterCategoria && mp.categoria !== filterCategoria) return false
      if (filterUnidad && mp.unidad_medida !== filterUnidad) return false
      if (filterEstado === 'alerta' && mp.cantidad_disponible >= mp.stock_minimo) return false
      if (filterEstado === 'sin_stock' && mp.cantidad_disponible > 0) return false
      return true
    })
  }, [materiasPrimas, searchTerm, filterCategoria, filterUnidad, filterEstado])

  const resumen = useMemo(() => {
    const totalInvertido = materiasPrimas.reduce((sum, mp) => sum + (mp.activo ? mp.costo_total : 0), 0)
    const insumosActivos = materiasPrimas.filter(mp => mp.activo).length
    const insumosAlerta = materiasPrimas.filter(mp => mp.activo && mp.cantidad_disponible < mp.stock_minimo).length
    return { totalInvertido, insumosActivos, insumosAlerta }
  }, [materiasPrimas])

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = {
      nombre: formData.get('nombre'),
      categoria: formData.get('categoria'),
      unidad_medida: formData.get('unidad_medida'),
      cantidad_disponible: parseFloat(formData.get('cantidad_disponible')),
      costo_por_unidad: parseFloat(formData.get('costo_por_unidad')),
      stock_minimo: parseFloat(formData.get('stock_minimo')),
      proveedor: formData.get('proveedor'),
      notas: formData.get('notas')
    }

    if (editingItem) {
      updateMateriaPrima(editingItem.id, data)
    } else {
      addMateriaPrima(data)
    }
    setShowModal(false)
    setEditingItem(null)
  }

  const handleDelete = (item) => {
    try {
      if (window.confirm(`¿Está seguro de eliminar "${item.nombre}"?`)) {
        deleteMateriaPrima(item.id)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  const handleCompra = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const cantidadComprada = parseFloat(formData.get('cantidad_comprada'))
    const nuevoCostoPorUnidad = parseFloat(formData.get('nuevo_costo_por_unidad'))

    registrarCompraMateriaPrima(compraItem.id, cantidadComprada, nuevoCostoPorUnidad)
    setShowCompraModal(false)
    setCompraItem(null)
  }

  const getStockBadge = (item) => {
    if (item.cantidad_disponible === 0) {
      return <Badge variant="error">SIN STOCK</Badge>
    }
    if (item.cantidad_disponible < item.stock_minimo) {
      return <Badge variant="warning">STOCK BAJO</Badge>
    }
    return <Badge variant="success">OK</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Inventario de Materia Prima</h1>
          <p className="text-neutral-500 mt-1">Gestiona tus insumos y materiales</p>
        </div>
        <Button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          icon={Plus}
        >
          Agregar Insumo
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Total Invertido</p>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(resumen.totalInvertido)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Insumos Activos</p>
          <p className="text-2xl font-bold text-neutral-900">{resumen.insumosActivos}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Insumos en Alerta</p>
          <p className="text-2xl font-bold text-error-600">{resumen.insumosAlerta}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={filterUnidad}
            onChange={(e) => setFilterUnidad(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="">Todas las unidades</option>
            {UNIDADES_MEDIDA.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
          >
            <option value="todos">Todos los estados</option>
            <option value="alerta">En alerta</option>
            <option value="sin_stock">Sin stock</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Costo/Unidad</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Costo Total</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-base">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-heading font-medium text-neutral-900">{item.nombre}</div>
                    <div className="text-sm text-neutral-500">{item.proveedor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{item.categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {item.cantidad_disponible} {item.unidad_medida}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {formatCurrency(item.costo_por_unidad)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {formatCurrency(item.costo_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStockBadge(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => { setCompraItem(item); setShowCompraModal(true) }}
                      className="text-success-600 hover:text-success-800 transition-base p-1 hover:bg-success-50 rounded"
                      title="Registrar compra"
                    >
                      <ShoppingCart size={18} />
                    </button>
                    <button
                      onClick={() => { setEditingItem(item); setShowModal(true) }}
                      className="text-primary-600 hover:text-primary-800 transition-base p-1 hover:bg-primary-50 rounded"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-error-600 hover:text-error-800 transition-base p-1 hover:bg-error-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No se encontraron insumos
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
            {editingItem ? 'Editar Insumo' : 'Agregar Insumo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
              <Input
                name="nombre"
                defaultValue={editingItem?.nombre}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría *</label>
                <select
                  name="categoria"
                  defaultValue={editingItem?.categoria}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                >
                  {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Unidad de Medida *</label>
                <select
                  name="unidad_medida"
                  defaultValue={editingItem?.unidad_medida}
                  required
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                >
                  {UNIDADES_MEDIDA.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Cantidad Disponible *</label>
                <Input
                  type="number"
                  name="cantidad_disponible"
                  defaultValue={editingItem?.cantidad_disponible}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Costo por Unidad (COP) *</label>
                <Input
                  type="number"
                  name="costo_por_unidad"
                  defaultValue={editingItem?.costo_por_unidad}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Stock Mínimo *</label>
                <Input
                  type="number"
                  name="stock_minimo"
                  defaultValue={editingItem?.stock_minimo}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Proveedor</label>
              <Input
                name="proveedor"
                defaultValue={editingItem?.proveedor}
              />
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

      {/* Modal Registrar Compra */}
      {showCompraModal && compraItem && (
        <Modal onClose={() => { setShowCompraModal(false); setCompraItem(null) }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Registrar Compra - {compraItem.nombre}
          </h2>
          <form onSubmit={handleCompra} className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <p className="text-sm text-neutral-600">Stock actual: <span className="font-medium text-neutral-900">{compraItem.cantidad_disponible} {compraItem.unidad_medida}</span></p>
              <p className="text-sm text-neutral-600">Costo actual: <span className="font-medium text-neutral-900">{formatCurrency(compraItem.costo_por_unidad)}/{compraItem.unidad_medida}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Cantidad Comprada *</label>
              <Input
                type="number"
                name="cantidad_comprada"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nuevo Costo por Unidad (COP) *</label>
              <Input
                type="number"
                name="nuevo_costo_por_unidad"
                defaultValue={compraItem.costo_por_unidad}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowCompraModal(false); setCompraItem(null) }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Compra
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
