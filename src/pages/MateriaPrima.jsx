import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Edit, Trash2, Search, Filter, ShoppingCart, AlertCircle } from 'lucide-react'

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
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">SIN STOCK</span>
    }
    if (item.cantidad_disponible < item.stock_minimo) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">STOCK BAJO</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">OK</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Inventario de Materia Prima</h1>
        <button
          onClick={() => { setEditingItem(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Agregar Insumo
        </button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total Invertido</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.totalInvertido)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Insumos Activos</p>
          <p className="text-2xl font-bold text-gray-900">{resumen.insumosActivos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Insumos en Alerta</p>
          <p className="text-2xl font-bold text-red-600">{resumen.insumosAlerta}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select
          value={filterUnidad}
          onChange={(e) => setFilterUnidad(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Todas las unidades</option>
          {UNIDADES_MEDIDA.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="todos">Todos los estados</option>
          <option value="alerta">En alerta</option>
          <option value="sin_stock">Sin stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Costo/Unidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Costo Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                  <div className="text-sm text-gray-500">{item.proveedor}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.categoria}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.cantidad_disponible} {item.unidad_medida}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(item.costo_por_unidad)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(item.costo_total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStockBadge(item)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => { setCompraItem(item); setShowCompraModal(true) }}
                    className="text-green-600 hover:text-green-800"
                    title="Registrar compra"
                  >
                    <ShoppingCart size={18} />
                  </button>
                  <button
                    onClick={() => { setEditingItem(item); setShowModal(true) }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron insumos
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
            {editingItem ? 'Editar Insumo' : 'Agregar Insumo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                name="nombre"
                defaultValue={editingItem?.nombre}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  name="categoria"
                  defaultValue={editingItem?.categoria}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                <select
                  name="unidad_medida"
                  defaultValue={editingItem?.unidad_medida}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {UNIDADES_MEDIDA.map(unidad => <option key={unidad} value={unidad}>{unidad}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Disponible *</label>
                <input
                  type="number"
                  name="cantidad_disponible"
                  defaultValue={editingItem?.cantidad_disponible}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por Unidad (COP) *</label>
                <input
                  type="number"
                  name="costo_por_unidad"
                  defaultValue={editingItem?.costo_por_unidad}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                <input
                  type="number"
                  name="stock_minimo"
                  defaultValue={editingItem?.stock_minimo}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input
                name="proveedor"
                defaultValue={editingItem?.proveedor}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
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

      {/* Modal Registrar Compra */}
      {showCompraModal && compraItem && (
        <Modal onClose={() => { setShowCompraModal(false); setCompraItem(null) }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Registrar Compra - {compraItem.nombre}
          </h2>
          <form onSubmit={handleCompra} className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Stock actual: <span className="font-medium">{compraItem.cantidad_disponible} {compraItem.unidad_medida}</span></p>
              <p className="text-sm text-gray-600">Costo actual: <span className="font-medium">{formatCurrency(compraItem.costo_por_unidad)}/{compraItem.unidad_medida}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Comprada *</label>
              <input
                type="number"
                name="cantidad_comprada"
                min="0.01"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Costo por Unidad (COP) *</label>
              <input
                type="number"
                name="nuevo_costo_por_unidad"
                defaultValue={compraItem.costo_por_unidad}
                min="0"
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowCompraModal(false); setCompraItem(null) }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Registrar Compra
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
