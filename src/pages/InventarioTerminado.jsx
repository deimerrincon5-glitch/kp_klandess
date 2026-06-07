import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCurrentDateISO } from '../utils/format'
import { Plus, Settings, AlertTriangle, Package } from 'lucide-react'

export default function InventarioTerminado() {
  const { inventarioTerminado, productos, registrarProduccion, ajusteManualInventarioTerminado } = useApp()
  const [showProduccionModal, setShowProduccionModal] = useState(false)
  const [showAjusteModal, setShowAjusteModal] = useState(false)
  const [ajusteItem, setAjusteItem] = useState(null)

  const [produccionData, setProduccionData] = useState({
    producto_id: '',
    cantidad: 0,
    fecha: getCurrentDateISO().split('T')[0],
    notas: ''
  })

  const productosActivos = useMemo(() => {
    return productos.filter(p => p.activo)
  }, [productos])

  const resumen = useMemo(() => {
    const valorTotal = inventarioTerminado.reduce((sum, inv) => sum + inv.valor_total_stock, 0)
    const unidadesTotales = inventarioTerminado.reduce((sum, inv) => sum + inv.cantidad_disponible, 0)
    const productosStockBajo = inventarioTerminado.filter(inv => inv.cantidad_disponible < inv.stock_minimo).length
    return { valorTotal, unidadesTotales, productosStockBajo }
  }, [inventarioTerminado])

  const handleProduccion = (e) => {
    e.preventDefault()
    try {
      registrarProduccion(
        produccionData.producto_id,
        produccionData.cantidad,
        produccionData.fecha,
        produccionData.notas
      )
      setShowProduccionModal(false)
      setProduccionData({ producto_id: '', cantidad: 0, fecha: getCurrentDateISO().split('T')[0], notas: '' })
    } catch (error) {
      alert(error.message)
    }
  }

  const handleAjuste = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const nuevaCantidad = parseFloat(formData.get('nueva_cantidad'))
    const justificacion = formData.get('justificacion')
    
    if (!justificacion.trim()) {
      alert('Debe proporcionar una justificación')
      return
    }

    ajusteManualInventarioTerminado(ajusteItem.id, nuevaCantidad, justificacion)
    setShowAjusteModal(false)
    setAjusteItem(null)
  }

  const getStockBadge = (item) => {
    if (item.cantidad_disponible < item.stock_minimo) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">STOCK BAJO</span>
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">OK</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-3xl font-bold text-amber-900">Inventario de Producto Terminado</h1>
        <button
          onClick={() => setShowProduccionModal(true)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={18} />
          Registrar Producción
        </button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Valor Total Inventario</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumen.valorTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Unidades Totales</p>
          <p className="text-2xl font-bold text-gray-900">{resumen.unidadesTotales}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Productos con Stock Bajo</p>
          <p className="text-2xl font-bold text-red-600">{resumen.productosStockBajo}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Stock Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Stock Mínimo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Valor Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventarioTerminado.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Package size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.nombre_producto}</p>
                      <p className="text-xs text-gray-500">{item.lotes.length} lote(s)</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.cantidad_disponible}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.stock_minimo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(item.valor_total_stock)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{getStockBadge(item)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => { setAjusteItem(item); setShowAjusteModal(true) }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Ajuste manual"
                  >
                    <Settings size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {inventarioTerminado.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No hay productos en inventario terminado. Registre producción para agregar stock.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Producción */}
      {showProduccionModal && (
        <Modal onClose={() => { setShowProduccionModal(false); setProduccionData({ producto_id: '', cantidad: 0, fecha: getCurrentDateISO().split('T')[0], notas: '' }) }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Registrar Producción
          </h2>
          <form onSubmit={handleProduccion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
              <select
                value={produccionData.producto_id}
                onChange={(e) => setProduccionData(prev => ({ ...prev, producto_id: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seleccionar producto...</option>
                {productosActivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_producto}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Producir *</label>
                <input
                  type="number"
                  value={produccionData.cantidad}
                  onChange={(e) => setProduccionData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                  min="1"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={produccionData.fecha}
                  onChange={(e) => setProduccionData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={produccionData.notas}
                onChange={(e) => setProduccionData(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowProduccionModal(false); setProduccionData({ producto_id: '', cantidad: 0, fecha: getCurrentDateISO().split('T')[0], notas: '' }) }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Registrar Producción
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Ajuste Manual */}
      {showAjusteModal && ajusteItem && (
        <Modal onClose={() => { setShowAjusteModal(false); setAjusteItem(null) }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            Ajuste Manual - {ajusteItem.nombre_producto}
          </h2>
          <form onSubmit={handleAjuste} className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Stock actual: <span className="font-medium">{ajusteItem.cantidad_disponible}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Cantidad *</label>
              <input
                name="nueva_cantidad"
                type="number"
                defaultValue={ajusteItem.cantidad_disponible}
                min="0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justificación *</label>
              <textarea
                name="justificacion"
                placeholder="Ej: Merma por defecto, daño durante transporte, etc."
                rows={3}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowAjusteModal(false); setAjusteItem(null) }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Aplicar Ajuste
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
