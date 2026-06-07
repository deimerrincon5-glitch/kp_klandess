import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, getCurrentDateISO } from '../utils/format'
import { Plus, Edit, Trash2, Search, Wallet, ArrowUpCircle, ArrowDownCircle, Building2, TrendingUp } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'

const CATEGORIAS_INGRESOS = ['Venta de producto', 'Anticipo pedido', 'Devolución de proveedor', 'Otro']
const CATEGORIAS_EGRESOS = ['Compra materia prima', 'Servicios públicos', 'Arriendo', 'Marketing y publicidad', 'Transporte y envío', 'Herramientas y equipos', 'Otro']

export default function Finanzas() {
  const { finanzasIngresos, finanzasEgresos, gastosFijos, addIngreso, addEgreso, addGastoFijo } = useApp()
  const [activeTab, setActiveTab] = useState('ingresos')
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const [formData, setFormData] = useState({
    fecha: getCurrentDateISO().split('T')[0],
    concepto: '',
    monto: 0,
    categoria: '',
    referencia_venta_id: '',
    comprobante: '',
    notas: ''
  })

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const ingresosMes = useMemo(() => {
    return finanzasIngresos.filter(i => {
      const d = new Date(i.fecha)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }, [finanzasIngresos, currentMonth, currentYear])

  const egresosMes = useMemo(() => {
    return finanzasEgresos.filter(e => {
      const d = new Date(e.fecha)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
  }, [finanzasEgresos, currentMonth, currentYear])

  const resumen = useMemo(() => {
    const totalIngresos = ingresosMes.reduce((sum, i) => sum + i.monto, 0)
    const totalEgresos = egresosMes.reduce((sum, e) => sum + e.monto, 0)
    const utilidadNeta = totalIngresos - totalEgresos
    const margen = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0
    return { totalIngresos, totalEgresos, utilidadNeta, margen }
  }, [ingresosMes, egresosMes])

  // Combined movements for table
  const movimientosCombinados = useMemo(() => {
    const ingresos = finanzasIngresos.map(i => ({ ...i, tipo: 'Ingreso' }))
    const egresos = finanzasEgresos.map(e => ({ ...e, tipo: 'Egreso' }))
    return [...ingresos, ...egresos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [finanzasIngresos, finanzasEgresos])

  const filteredMovimientos = useMemo(() => {
    return movimientosCombinados.filter(m => {
      if (searchTerm && !m.concepto.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (filterTipo && m.tipo !== filterTipo) return false
      if (filterCategoria && m.categoria !== filterCategoria) return false
      return true
    })
  }, [movimientosCombinados, searchTerm, filterTipo, filterCategoria])

  // Cash flow chart data
  const flujoCajaData = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('es-ES', { month: 'short' })
      const monthIngresos = finanzasIngresos.filter(i => {
        const id = new Date(i.fecha)
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear()
      })
      const monthEgresos = finanzasEgresos.filter(e => {
        const ed = new Date(e.fecha)
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
      })
      months.push({
        month: monthName,
        ingresos: monthIngresos.reduce((sum, i) => sum + i.monto, 0),
        egresos: monthEgresos.reduce((sum, e) => sum + e.monto, 0)
      })
    }
    return months
  }, [finanzasIngresos, finanzasEgresos])

  // Monthly balance table
  const balanceMensual = useMemo(() => {
    const balances = []
    const now = new Date()
    let saldoAcumulado = 0

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
      const monthIngresos = finanzasIngresos.filter(i => {
        const id = new Date(i.fecha)
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear()
      })
      const monthEgresos = finanzasEgresos.filter(e => {
        const ed = new Date(e.fecha)
        return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
      })
      const ingresos = monthIngresos.reduce((sum, i) => sum + i.monto, 0)
      const egresos = monthEgresos.reduce((sum, e) => sum + e.monto, 0)
      const saldoMes = ingresos - egresos
      saldoAcumulado += saldoMes

      balances.push({
        mes: monthName,
        ingresos,
        egresos,
        saldoMes,
        saldoAcumulado
      })
    }
    return balances
  }, [finanzasIngresos, finanzasEgresos])

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      fecha: formData.fecha,
      concepto: formData.concepto,
      monto: parseFloat(formData.monto),
      categoria: formData.categoria,
      notas: formData.notas
    }

    if (activeTab === 'ingresos') {
      data.referencia_venta_id = formData.referencia_venta_id
      addIngreso(data)
    } else if (activeTab === 'egresos') {
      data.comprobante = formData.comprobante
      addEgreso(data)
    } else {
      // Gastos fijos
      addGastoFijo({
        nombre: formData.concepto,
        monto_mensual: parseFloat(formData.monto),
        categoria: formData.categoria
      })
    }

    setShowModal(false)
    resetFormData()
  }

  const handleDelete = (id, tipo) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      if (tipo === 'Ingreso') {
        // Delete from ingresos
      } else {
        // Delete from egresos
      }
    }
  }

  const resetFormData = () => {
    setFormData({
      fecha: getCurrentDateISO().split('T')[0],
      concepto: '',
      monto: 0,
      categoria: '',
      referencia_venta_id: '',
      comprobante: '',
      notas: ''
    })
  }

  const openModal = () => {
    resetFormData()
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-playfair text-3xl font-bold text-amber-900">Finanzas</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('ingresos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ingresos' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setActiveTab('egresos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'egresos' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Egresos
        </button>
        <button
          onClick={() => setActiveTab('gastos-fijos')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'gastos-fijos' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Gastos Fijos
        </button>
      </div>

      {/* Resumen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <ArrowUpCircle size={20} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Ingresos</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(resumen.totalIngresos)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <ArrowDownCircle size={20} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Total Egresos</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(resumen.totalEgresos)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Utilidad Neta</p>
          </div>
          <p className={`text-2xl font-bold ${resumen.utilidadNeta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(resumen.utilidadNeta)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Wallet size={20} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Margen %</p>
          </div>
          <p className={`text-2xl font-bold ${resumen.margen >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {resumen.margen.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
          Flujo de Caja (Últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flujoCajaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
            <Bar dataKey="egresos" fill="#EF4444" name="Egresos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Content based on tab */}
      {activeTab === 'ingresos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Ingresos</h2>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Ingreso
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ingresosMes.map(ingreso => (
                  <tr key={ingreso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(ingreso.fecha)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{ingreso.concepto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ingreso.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(ingreso.monto)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ingreso.notas || '-'}</td>
                  </tr>
                ))}
                {ingresosMes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No hay ingresos registrados este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'egresos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Egresos</h2>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Egreso
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Concepto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {egresosMes.map(egreso => (
                  <tr key={egreso.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(egreso.fecha)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{egreso.concepto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{egreso.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatCurrency(egreso.monto)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{egreso.notas || '-'}</td>
                  </tr>
                ))}
                {egresosMes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No hay egresos registrados este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'gastos-fijos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Gastos Fijos Mensuales</h2>
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus size={18} />
              Agregar Gasto Fijo
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Monto Mensual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-900 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {gastosFijos.filter(g => g.activo).map(gasto => (
                  <tr key={gasto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{gasto.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gasto.categoria}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(gasto.monto_mensual)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Activo</span>
                    </td>
                  </tr>
                ))}
                {gastosFijos.filter(g => g.activo).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No hay gastos fijos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Total gastos fijos mensuales:</p>
            <p className="text-2xl font-bold text-amber-900">
              {formatCurrency(gastosFijos.filter(g => g.activo).reduce((sum, g) => sum + g.monto_mensual, 0))}
            </p>
          </div>
        </div>
      )}

      {/* Combined Movements Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
          Todos los Movimientos
        </h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos los tipos</option>
            <option value="Ingreso">Ingresos</option>
            <option value="Egreso">Egresos</option>
          </select>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todas las categorías</option>
            {[...CATEGORIAS_INGRESOS, ...CATEGORIAS_EGRESOS].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Concepto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMovimientos.map(movimiento => (
              <tr key={movimiento.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(movimiento.fecha)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    movimiento.tipo === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {movimiento.tipo}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{movimiento.concepto}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movimiento.categoria}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  movimiento.tipo === 'Ingreso' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movimiento.tipo === 'Ingreso' ? '+' : '-'}{formatCurrency(movimiento.monto)}
                </td>
              </tr>
            ))}
            {filteredMovimientos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No se encontraron movimientos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monthly Balance Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
          Balance Acumulado por Mes
        </h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Mes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Ingresos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Egresos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Saldo del Mes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Saldo Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {balanceMensual.map(balance => (
              <tr key={balance.mes} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{balance.mes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(balance.ingresos)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{formatCurrency(balance.egresos)}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${balance.saldoMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance.saldoMes)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${balance.saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance.saldoAcumulado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); resetFormData() }}>
          <h2 className="font-playfair text-xl font-semibold text-amber-900 mb-4">
            {activeTab === 'ingresos' ? 'Agregar Ingreso' : activeTab === 'egresos' ? 'Agregar Egreso' : 'Agregar Gasto Fijo'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
              <input
                type="text"
                value={formData.concepto}
                onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto (COP) *</label>
              <input
                type="number"
                value={formData.monto}
                onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))}
                min="0"
                step="100"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Seleccionar...</option>
                {activeTab === 'ingresos' ? CATEGORIAS_INGRESOS.map(c => <option key={c} value={c}>{c}</option>) : 
                 activeTab === 'egresos' ? CATEGORIAS_EGRESOS.map(c => <option key={c} value={c}>{c}</option>) :
                 ['Servicios públicos', 'Arriendo', 'Marketing', 'Otro'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {activeTab === 'ingresos' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia Venta (opcional)</label>
                <input
                  type="text"
                  value={formData.referencia_venta_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, referencia_venta_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
            {activeTab === 'egresos' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (opcional)</label>
                <input
                  type="text"
                  value={formData.comprobante}
                  onChange={(e) => setFormData(prev => ({ ...prev, comprobante: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
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
                onClick={() => { setShowModal(false); resetFormData() }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                Agregar
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
