import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCurrentDateISO } from '../utils/format'
import { Plus, Settings, AlertTriangle, Package } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

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
      return <Badge variant="error">STOCK BAJO</Badge>
    }
    return <Badge variant="success">OK</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-neutral-900">Inventario de Producto Terminado</h1>
          <p className="text-neutral-500 mt-1">Gestiona el stock de productos terminados</p>
        </div>
        <Button
          onClick={() => setShowProduccionModal(true)}
          icon={Plus}
        >
          Registrar Producción
        </Button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Valor Total Inventario</p>
          <p className="text-2xl font-bold text-neutral-900">{formatCurrency(resumen.valorTotal)}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Unidades Totales</p>
          <p className="text-2xl font-bold text-neutral-900">{resumen.unidadesTotales}</p>
        </Card>
        <Card variant="elevated" padding="md">
          <p className="text-sm font-medium text-neutral-500 mb-1">Productos con Stock Bajo</p>
          <p className="text-2xl font-bold text-error-600">{resumen.productosStockBajo}</p>
        </Card>
      </div>

      {/* Table */}
      <Card variant="elevated" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Stock Disponible</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Stock Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-neutral-700 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {inventarioTerminado.map(item => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-base">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary-100 p-2 rounded-lg">
                        <Package size={20} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-heading font-medium text-neutral-900">{item.nombre_producto}</p>
                        <p className="text-xs text-neutral-500">{item.lotes.length} lote(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {item.cantidad_disponible}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {item.stock_minimo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {formatCurrency(item.valor_total_stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStockBadge(item)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => { setAjusteItem(item); setShowAjusteModal(true) }}
                      className="text-primary-600 hover:text-primary-800 transition-base p-1 hover:bg-primary-50 rounded"
                      title="Ajuste manual"
                    >
                      <Settings size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {inventarioTerminado.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No hay productos en inventario terminado. Registre producción para agregar stock.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Registrar Producción */}
      {showProduccionModal && (
        <Modal onClose={() => { setShowProduccionModal(false); setProduccionData({ producto_id: '', cantidad: 0, fecha: getCurrentDateISO().split('T')[0], notas: '' }) }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Registrar Producción
          </h2>
          <form onSubmit={handleProduccion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Producto *</label>
              <select
                value={produccionData.producto_id}
                onChange={(e) => setProduccionData(prev => ({ ...prev, producto_id: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              >
                <option value="">Seleccionar producto...</option>
                {productosActivos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_producto}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Cantidad a Producir *</label>
                <Input
                  type="number"
                  value={produccionData.cantidad}
                  onChange={(e) => setProduccionData(prev => ({ ...prev, cantidad: parseFloat(e.target.value) || 0 }))}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha *</label>
                <Input
                  type="date"
                  value={produccionData.fecha}
                  onChange={(e) => setProduccionData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
              <textarea
                value={produccionData.notas}
                onChange={(e) => setProduccionData(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowProduccionModal(false); setProduccionData({ producto_id: '', cantidad: 0, fecha: getCurrentDateISO().split('T')[0], notas: '' }) }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Registrar Producción
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Ajuste Manual */}
      {showAjusteModal && ajusteItem && (
        <Modal onClose={() => { setShowAjusteModal(false); setAjusteItem(null) }}>
          <h2 className="font-heading text-xl font-semibold text-neutral-900 mb-4">
            Ajuste Manual - {ajusteItem.nombre_producto}
          </h2>
          <form onSubmit={handleAjuste} className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
              <p className="text-sm text-neutral-600">Stock actual: <span className="font-heading font-medium text-neutral-900">{ajusteItem.cantidad_disponible}</span></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nueva Cantidad *</label>
              <Input
                name="nueva_cantidad"
                type="number"
                defaultValue={ajusteItem.cantidad_disponible}
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Justificación *</label>
              <textarea
                name="justificacion"
                placeholder="Ej: Merma por defecto, daño durante transporte, etc."
                rows={3}
                required
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-base"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowAjusteModal(false); setAjusteItem(null) }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Aplicar Ajuste
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
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
