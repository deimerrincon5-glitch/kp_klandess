import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { Plus, Edit, Trash2, Search, CandlestickChart, X } from 'lucide-react'

const CATEGORIAS = ['Vela de soja', 'Vela de parafina', 'Vela de cera de abeja', 'Vela decorativa', 'Set / Kit', 'Otro']

export default function Productos() {
  const { productos, materiasPrimas, addProducto, updateProducto, deleteProducto, pedidos } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')

  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion: '',
    categoria: 'Vela de soja',
    imagen_url: '',
    precio_venta: 0,
    tiempo_produccion_minutos: 0,
    activo: true,
    receta: [],
    notas_fabricacion: ''
  })

  const filteredItems = useMemo(() => {
    return productos.filter(p => {
      if (!p.activo) return false
      if (searchTerm && !p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterCategoria && p.categoria !== filterCategoria) return false
      return true
    })
  }, [productos, searchTerm, filterCategoria])

  const insumosActivos = useMemo(() => {
    return materiasPrimas.filter(mp => mp.activo)
  }, [materiasPrimas])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Calculate recipe costs
    const recetaWithCosts = formData.receta.map(r => {
      const insumo = insumosActivos.find(mp => mp.id === r.insumo_id)
      return {
        ...r,
        insumo_nombre: insumo?.nombre || '',
        unidad: insumo?.unidad_medida || '',
        costo_parcial: r.cantidad_usada * (insumo?.costo_por_unidad || 0)
      }
    })

    const data = {
      ...formData,
      receta: recetaWithCosts
    }

    if (editingItem) {
      updateProducto(editingItem.id, data)
    } else {
      addProducto(data)
    }
    setShowModal(false)
    setEditingItem(null)
    resetFormData()
  }

  const handleDelete = (item) => {
    try {
      if (window.confirm(`¿Está seguro de eliminar "${item.nombre_producto}"?`)) {
        deleteProducto(item.id)
      }
    } catch (error) {
      alert(error.message)
    }
  }

  const resetFormData = () => {
    setFormData({
      nombre_producto: '',
      descripcion: '',
      categoria: 'Vela de soja',
      imagen_url: '',
      precio_venta: 0,
      tiempo_produccion_minutos: 0,
      activo: true,
      receta: [],
      notas_fabricacion: ''
    })
  }

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nombre_producto: item.nombre_producto,
        descripcion: item.descripcion,
        categoria: item.categoria,
        imagen_url: item.imagen_url,
        precio_venta: item.precio_venta,
        tiempo_produccion_minutos: item.tiempo_produccion_minutos,
        activo: item.activo,
        receta: item.receta || [],
        notas_fabricacion: item.notas_fabricacion
      })
    } else {
      setEditingItem(null)
      resetFormData()
    }
    setShowModal(true)
  }

  const addIngrediente = () => {
    setFormData(prev => ({
      ...prev,
      receta: [...prev.receta, { insumo_id: '', cantidad_usada: 0 }]
    }))
  }

  const removeIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      receta: prev.receta.filter((_, i) => i !== index)
    }))
  }

  const updateIngrediente = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      receta: prev.receta.map((r, i) => {
        if (i === index) {
          return { ...r, [field]: value }
        }
        return r
      })
    }))
  }

  const calculateRecetaCost = () => {
    return formData.receta.reduce((sum, r) => {
      const insumo = insumosActivos.find(mp => mp.id === r.insumo_id)
      return sum + (r.cantidad_usada * (insumo?.costo_por_unidad || 0))
    }, 0)
  }

  const costoProduccion = calculateRecetaCost()
  const margenEstimado = formData.precio_venta > 0 ? ((formData.precio_venta - costoProduccion) / formData.precio_venta) * 100 : 0
  const precioMinimoSugerido = costoProduccion * 1.35

  const getMargenColor = (margen) => {
    if (margen >= 40) return 'text-green-600'
    if (margen >= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Catálogo de Productos + Recetas</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Agregar Producto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar producto..."
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
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <ProductCard
            key={item.id}
            item={item}
            onEdit={() => openModal(item)}
            onDelete={() => handleDelete(item)}
            getMargenColor={getMargenColor}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            {editingItem ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Datos Básicos */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Datos Básicos</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={formData.nombre_producto}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_producto: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo Producción (min)</label>
                    <input
                      type="number"
                      value={formData.tiempo_produccion_minutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiempo_produccion_minutos: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta (COP) *</label>
                    <input
                      type="number"
                      value={formData.precio_venta}
                      onChange={(e) => setFormData(prev => ({ ...prev, precio_venta: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="100"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Imagen (opcional)</label>
                    <input
                      type="text"
                      value={formData.imagen_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagen_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Receta */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-medium text-gray-900 mb-3">Receta de Fabricación</h3>
              <div className="space-y-2">
                {formData.receta.map((ingrediente, index) => {
                  const insumo = insumosActivos.find(mp => mp.id === ingrediente.insumo_id)
                  const costoParcial = insumo ? ingrediente.cantidad_usada * insumo.costo_por_unidad : 0
                  return (
                    <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                      <select
                        value={ingrediente.insumo_id}
                        onChange={(e) => updateIngrediente(index, 'insumo_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Seleccionar insumo...</option>
                        {insumosActivos.map(mp => (
                          <option key={mp.id} value={mp.id}>{mp.nombre} ({mp.unidad_medida})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={ingrediente.cantidad_usada}
                        onChange={(e) => updateIngrediente(index, 'cantidad_usada', parseFloat(e.target.value) || 0)}
                        placeholder="Cantidad"
                        min="0"
                        step="0.01"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-sm text-gray-600 py-2">{insumo?.unidad_medida || ''}</span>
                      <span className="text-sm text-gray-900 font-medium py-2">{formatCurrency(costoParcial)}</span>
                      <button
                        type="button"
                        onClick={() => removeIngrediente(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={addIngrediente}
                  className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                >
                  + Agregar ingrediente
                </button>
              </div>
              
              {/* Resumen de costos */}
              <div className="mt-4 bg-amber-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Costo Producción:</span>
                  <span className="font-medium">{formatCurrency(costoProduccion)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margen Estimado:</span>
                  <span className={`font-medium ${getMargenColor(margenEstimado)}`}>{margenEstimado.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Precio Mínimo Sugerido:</span>
                  <span className="font-medium">{formatCurrency(precioMinimoSugerido)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Fabricación</label>
              <textarea
                value={formData.notas_fabricacion}
                onChange={(e) => setFormData(prev => ({ ...prev, notas_fabricacion: e.target.value }))}
                rows={3}
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
                {editingItem ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function ProductCard({ item, onEdit, onDelete, getMargenColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {item.imagen_url ? (
        <img src={item.imagen_url} alt={item.nombre_producto} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-amber-100 flex items-center justify-center">
          <CandlestickChart size={48} className="text-amber-400" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-gray-900">{item.nombre_producto}</h3>
          <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{item.categoria}</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Precio Venta:</span>
            <span className="font-medium">{formatCurrency(item.precio_venta)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Costo Producción:</span>
            <span className="font-medium">{formatCurrency(item.costo_produccion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Margen:</span>
            <span className={`font-medium ${getMargenColor(item.margen_utilidad)}`}>{item.margen_utilidad.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 text-blue-600 hover:text-blue-800 text-sm font-medium py-1"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex-1 text-red-600 hover:text-red-800 text-sm font-medium py-1"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
