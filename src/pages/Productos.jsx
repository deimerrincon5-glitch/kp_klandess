import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { Plus, Edit, Trash2, Search, CandlestickChart, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

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
    if (margen >= 40) return 'text-success-600'
    if (margen >= 25) return 'text-warning-600'
    return 'text-error-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Catálogo de Productos + Recetas</h1>
          <p className="text-neutral-500 mt-1">Gestiona tus productos y recetas de fabricación</p>
        </div>
        <Button
          onClick={() => openModal()}
          icon={Plus}
        >
          Agregar Producto
        </Button>
      </div>

      {/* Filters */}
      <Card variant="elevated" padding="md">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              type="text"
              placeholder="Buscar producto..."
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
        </div>
      </Card>

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
          <div className="col-span-full text-center py-12 text-neutral-500">
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setEditingItem(null); resetFormData() }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            {editingItem ? 'Editar Producto' : 'Agregar Producto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            {/* Datos Básicos */}
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Datos Básicos</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del Producto *</label>
                  <Input
                    type="text"
                    value={formData.nombre_producto}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_producto: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría *</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                    >
                      {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Tiempo Producción (min)</label>
                    <Input
                      type="number"
                      value={formData.tiempo_produccion_minutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiempo_produccion_minutos: parseFloat(e.target.value) || 0 }))}
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Precio Venta (COP) *</label>
                    <Input
                      type="number"
                      value={formData.precio_venta}
                      onChange={(e) => setFormData(prev => ({ ...prev, precio_venta: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">URL Imagen (opcional)</label>
                    <Input
                      type="text"
                      value={formData.imagen_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagen_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Receta */}
            <div className="border-b border-neutral-200 pb-4">
              <h3 className="font-heading font-medium text-neutral-900 mb-3">Receta de Fabricación</h3>
              <div className="space-y-2">
                {formData.receta.map((ingrediente, index) => {
                  const insumo = insumosActivos.find(mp => mp.id === ingrediente.insumo_id)
                  const costoParcial = insumo ? ingrediente.cantidad_usada * insumo.costo_por_unidad : 0
                  return (
                    <div key={index} className="flex gap-2 items-start bg-neutral-50 p-3 rounded-lg">
                      <select
                        value={ingrediente.insumo_id}
                        onChange={(e) => updateIngrediente(index, 'insumo_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
                      >
                        <option value="">Seleccionar insumo...</option>
                        {insumosActivos.map(mp => (
                          <option key={mp.id} value={mp.id}>{mp.nombre} ({mp.unidad_medida})</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        value={ingrediente.cantidad_usada}
                        onChange={(e) => updateIngrediente(index, 'cantidad_usada', parseFloat(e.target.value) || 0)}
                        placeholder="Cantidad"
                        min="0"
                        step="0.01"
                        className="w-24"
                      />
                      <span className="text-sm text-neutral-600 py-2">{insumo?.unidad_medida || ''}</span>
                      <span className="text-sm text-neutral-900 font-medium py-2">{formatCurrency(costoParcial)}</span>
                      <button
                        type="button"
                        onClick={() => removeIngrediente(index)}
                        className="text-error-600 hover:text-error-800 p-1 hover:bg-error-50 rounded transition-base"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )
                })}
                <button
                  type="button"
                  onClick={addIngrediente}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  + Agregar ingrediente
                </button>
              </div>
              
              {/* Resumen de costos */}
              <div className="mt-4 bg-primary-50 p-4 rounded-lg border border-primary-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Costo Producción:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(costoProduccion)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Margen Estimado:</span>
                  <span className={`font-medium ${getMargenColor(margenEstimado)}`}>{margenEstimado.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Precio Mínimo Sugerido:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(precioMinimoSugerido)}</span>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notas de Fabricación</label>
              <textarea
                value={formData.notas_fabricacion}
                onChange={(e) => setFormData(prev => ({ ...prev, notas_fabricacion: e.target.value }))}
                rows={3}
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
                {editingItem ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function ProductCard({ item, onEdit, onDelete, getMargenColor }) {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden hover:shadow-lg transition-base">
      {item.imagen_url ? (
        <img src={item.imagen_url} alt={item.nombre_producto} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-primary-100 flex items-center justify-center">
          <CandlestickChart size={48} className="text-primary-400" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-medium text-neutral-900">{item.nombre_producto}</h3>
          <Badge variant="primary">{item.categoria}</Badge>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600">Precio Venta:</span>
            <span className="font-heading font-medium text-neutral-900">{formatCurrency(item.precio_venta)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Costo Producción:</span>
            <span className="font-heading font-medium text-neutral-900">{formatCurrency(item.costo_produccion)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Margen:</span>
            <span className={`font-heading font-medium ${getMargenColor(item.margen_utilidad)}`}>{item.margen_utilidad.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200">
          <Button
            onClick={onEdit}
            variant="ghost"
            className="flex-1"
          >
            Editar
          </Button>
          <Button
            onClick={onDelete}
            variant="ghost"
            className="flex-1 text-error-600 hover:text-error-800"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
