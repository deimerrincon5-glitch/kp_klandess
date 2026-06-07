import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { generateUUID, generateId } from '../utils/uuid'
import { formatDate, formatCurrency, addDaysToDate, isDateBefore, getCurrentYear, getCurrentDateISO } from '../utils/format'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Materias Primas
  const [materiasPrimas, setMateriasPrimas] = useLocalStorage('materiasPrimas', [])
  
  // Productos con recetas
  const [productos, setProductos] = useLocalStorage('productos', [])
  
  // Inventario Terminado
  const [inventarioTerminado, setInventarioTerminado] = useLocalStorage('inventarioTerminado', [])
  
  // Clientes
  const [clientes, setClientes] = useLocalStorage('clientes', [])
  
  // Cotizaciones
  const [cotizaciones, setCotizaciones] = useLocalStorage('cotizaciones', [])
  
  // Pedidos
  const [pedidos, setPedidos] = useLocalStorage('pedidos', [])
  
  // Ventas
  const [ventas, setVentas] = useLocalStorage('ventas', [])
  
  // Finanzas
  const [finanzasIngresos, setFinanzasIngresos] = useLocalStorage('finanzas_ingresos', [])
  const [finanzasEgresos, setFinanzasEgresos] = useLocalStorage('finanzas_egresos', [])
  const [gastosFijos, setGastosFijos] = useLocalStorage('gastos_fijos', [])
  
  // Toast notifications
  const [toasts, setToasts] = useState([])
  
  // Company name
  const [companyName, setCompanyName] = useLocalStorage('companyName', 'Velas Artesanales')

  // Add toast notification
  const addToast = useCallback((message, type = 'success') => {
    const id = generateUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  // Initialize app with seed data if empty
  const initializeApp = useCallback(() => {
    if (materiasPrimas.length === 0 && productos.length === 0) {
      const seedData = getSeedData()
      setMateriasPrimas(seedData.materiasPrimas)
      setProductos(seedData.productos)
      setClientes(seedData.clientes)
      setCotizaciones(seedData.cotizaciones)
      setPedidos(seedData.pedidos)
      setVentas(seedData.ventas)
      setFinanzasIngresos(seedData.finanzasIngresos)
      setFinanzasEgresos(seedData.finanzasEgresos)
      setGastosFijos(seedData.gastosFijos)
      setInventarioTerminado(seedData.inventarioTerminado)
      addToast('Sistema inicializado con datos de demostración', 'success')
    }
  }, [materiasPrimas.length, productos.length, setMateriasPrimas, setProductos, setClientes, setCotizaciones, setPedidos, setVentas, setFinanzasIngresos, setFinanzasEgresos, setGastosFijos, setInventarioTerminado, addToast])

  // Recalculate product costs when ingredient costs change
  const recalculateProductCosts = useCallback((insumoId) => {
    const insumo = materiasPrimas.find(m => m.id === insumoId)
    if (!insumo) return

    setProductos(prevProductos => {
      return prevProductos.map(producto => {
        const usesInsumo = producto.receta.some(r => r.insumo_id === insumoId)
        if (!usesInsumo) return producto

        const newReceta = producto.receta.map(ingrediente => {
          if (ingrediente.insumo_id === insumoId) {
            return {
              ...ingrediente,
              costo_parcial: ingrediente.cantidad_usada * insumo.costo_por_unidad
            }
          }
          return ingrediente
        })

        const newCostoProduccion = newReceta.reduce((sum, r) => sum + r.costo_parcial, 0)
        const newMargenUtilidad = ((producto.precio_venta - newCostoProduccion) / producto.precio_venta) * 100
        const newPrecioMinimoSugerido = newCostoProduccion * 1.35

        return {
          ...producto,
          receta: newReceta,
          costo_produccion: newCostoProduccion,
          margen_utilidad: newMargenUtilidad,
          precio_minimo_sugerido: newPrecioMinimoSugerido
        }
      })
    })
  }, [materiasPrimas, setProductos])

  // MATERIAS PRIMAS CRUD
  const addMateriaPrima = useCallback((data) => {
    const nueva = {
      id: generateUUID(),
      ...data,
      costo_total: data.cantidad_disponible * data.costo_por_unidad,
      fecha_ultima_compra: data.fecha_ultima_compra || getCurrentDateISO(),
      activo: true
    }
    setMateriasPrimas(prev => [...prev, nueva])
    addToast('Materia prima agregada exitosamente')
    return nueva
  }, [setMateriasPrimas, addToast])

  const updateMateriaPrima = useCallback((id, data) => {
    setMateriasPrimas(prev => {
      const updated = prev.map(mp => {
        if (mp.id === id) {
          const newData = {
            ...mp,
            ...data,
            costo_total: data.cantidad_disponible * data.costo_por_unidad
          }
          // Trigger recalculation if cost changed
          if (data.costo_por_unidad !== undefined && data.costo_por_unidad !== mp.costo_por_unidad) {
            setTimeout(() => recalculateProductCosts(id), 0)
          }
          return newData
        }
        return mp
      })
      return updated
    })
    addToast('Materia prima actualizada')
  }, [setMateriasPrimas, recalculateProductCosts, addToast])

  const deleteMateriaPrima = useCallback((id) => {
    // Check if used in any active product recipe
    const productosAfectados = productos.filter(p => 
      p.activo && p.receta.some(r => r.insumo_id === id)
    )

    if (productosAfectados.length > 0) {
      const nombres = productosAfectados.map(p => p.nombre_producto).join(', ')
      throw new Error(`No se puede eliminar. Este insumo se usa en: ${nombres}. Solo puede marcarlo como inactivo.`)
    }

    setMateriasPrimas(prev => prev.filter(mp => mp.id !== id))
    addToast('Materia prima eliminada')
  }, [productos, setMateriasPrimas, addToast])

  const registrarCompraMateriaPrima = useCallback((id, cantidadComprada, nuevoCostoPorUnidad) => {
    setMateriasPrimas(prev => prev.map(mp => {
      if (mp.id === id) {
        const nuevaCantidad = mp.cantidad_disponible + cantidadComprada
        const newData = {
          ...mp,
          cantidad_disponible: nuevaCantidad,
          costo_por_unidad: nuevoCostoPorUnidad,
          costo_total: nuevaCantidad * nuevoCostoPorUnidad,
          fecha_ultima_compra: getCurrentDateISO()
        }
        // Trigger recalculation
        setTimeout(() => recalculateProductCosts(id), 0)
        return newData
      }
      return mp
    }))
    addToast('Compra registrada exitosamente')
  }, [setMateriasPrimas, recalculateProductCosts, addToast])

  // PRODUCTOS CRUD
  const addProducto = useCallback((data) => {
    const costoProduccion = data.receta.reduce((sum, r) => sum + r.costo_parcial, 0)
    const margenUtilidad = ((data.precio_venta - costoProduccion) / data.precio_venta) * 100
    const precioMinimoSugerido = costoProduccion * 1.35

    const nuevo = {
      id: generateUUID(),
      ...data,
      costo_produccion: costoProduccion,
      margen_utilidad: margenUtilidad,
      precio_minimo_sugerido: precioMinimoSugerido,
      activo: true
    }
    setProductos(prev => [...prev, nuevo])
    addToast('Producto agregado exitosamente')
    return nuevo
  }, [setProductos, addToast])

  const updateProducto = useCallback((id, data) => {
    setProductos(prev => prev.map(p => {
      if (p.id === id) {
        const costoProduccion = data.receta ? data.receta.reduce((sum, r) => sum + r.costo_parcial, 0) : p.costo_produccion
        const margenUtilidad = ((data.precio_venta || p.precio_venta) - costoProduccion) / (data.precio_venta || p.precio_venta) * 100
        const precioMinimoSugerido = costoProduccion * 1.35

        return {
          ...p,
          ...data,
          costo_produccion: costoProduccion,
          margen_utilidad: margenUtilidad,
          precio_minimo_sugerido: precioMinimoSugerido
        }
      }
      return p
    }))
    addToast('Producto actualizado')
  }, [setProductos, addToast])

  const deleteProducto = useCallback((id) => {
    // Check if has pending or in-production orders
    const pedidosActivos = pedidos.filter(p => 
      (p.estado === 'Pendiente' || p.estado === 'En producción') &&
      p.items.some(item => item.producto_id === id)
    )

    if (pedidosActivos.length > 0) {
      throw new Error(`No se puede eliminar. El producto tiene ${pedidosActivos.length} pedidos activos.`)
    }

    setProductos(prev => prev.filter(p => p.id !== id))
    addToast('Producto eliminado')
  }, [pedidos, setProductos, addToast])

  // INVENTARIO TERMINADO
  const registrarProduccion = useCallback((productoId, cantidad, fecha, notas) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) throw new Error('Producto no encontrado')

    // Check stock of all ingredients
    const ingredientesFaltantes = []
    producto.receta.forEach(ingrediente => {
      const insumo = materiasPrimas.find(m => m.id === ingrediente.insumo_id)
      if (!insumo) return
      
      const cantidadNecesaria = ingrediente.cantidad_usada * cantidad
      if (insumo.cantidad_disponible < cantidadNecesaria) {
        ingredientesFaltantes.push({
          nombre: insumo.nombre,
          necesario: cantidadNecesaria,
          disponible: insumo.cantidad_disponible
        })
      }
    })

    if (ingredientesFaltantes.length > 0) {
      const mensaje = ingredientesFaltantes.map(i => 
        `${i.nombre}: necesita ${i.necesario} ${i.unidad}, tiene ${i.disponible}`
      ).join('\n')
      throw new Error(`Stock insuficiente:\n${mensaje}`)
    }

    // Deduct ingredients
    setMateriasPrimas(prev => prev.map(mp => {
      const ingrediente = producto.receta.find(r => r.insumo_id === mp.id)
      if (ingrediente) {
        const cantidadUsada = ingrediente.cantidad_usada * cantidad
        return {
          ...mp,
          cantidad_disponible: mp.cantidad_disponible - cantidadUsada,
          costo_total: (mp.cantidad_disponible - cantidadUsada) * mp.costo_por_unidad
        }
      }
      return mp
    }))

    // Add to finished inventory
    const lote = {
      id_lote: generateUUID(),
      fecha_fabricacion: fecha,
      cantidad: cantidad,
      notas: notas
    }

    setInventarioTerminado(prev => {
      const existing = prev.find(inv => inv.producto_id === productoId)
      if (existing) {
        return prev.map(inv => {
          if (inv.producto_id === productoId) {
            const nuevaCantidad = inv.cantidad_disponible + cantidad
            return {
              ...inv,
              cantidad_disponible: nuevaCantidad,
              valor_total_stock: nuevaCantidad * producto.costo_produccion,
              lotes: [...inv.lotes, lote]
            }
          }
          return inv
        })
      } else {
        return [...prev, {
          id: generateUUID(),
          producto_id: productoId,
          nombre_producto: producto.nombre_producto,
          cantidad_disponible: cantidad,
          stock_minimo: 5,
          costo_unitario: producto.costo_produccion,
          valor_total_stock: cantidad * producto.costo_produccion,
          lotes: [lote]
        }]
      }
    })

    addToast(`Producción registrada: ${cantidad} unidades de ${producto.nombre_producto}`)
  }, [productos, materiasPrimas, setMateriasPrimas, setInventarioTerminado, addToast])

  const ajusteManualInventarioTerminado = useCallback((id, nuevaCantidad, justificacion) => {
    setInventarioTerminado(prev => prev.map(inv => {
      if (inv.id === id) {
        const producto = productos.find(p => p.id === inv.producto_id)
        const costoUnitario = producto ? producto.costo_produccion : inv.costo_unitario
        return {
          ...inv,
          cantidad_disponible: nuevaCantidad,
          valor_total_stock: nuevaCantidad * costoUnitario
        }
      }
      return inv
    }))
    addToast('Ajuste manual registrado')
  }, [productos, setInventarioTerminado, addToast])

  // CLIENTES CRUD
  const addCliente = useCallback((data) => {
    const nuevo = {
      id: generateUUID(),
      ...data,
      fecha_registro: getCurrentDateISO()
    }
    setClientes(prev => [...prev, nuevo])
    addToast('Cliente registrado exitosamente')
    return nuevo
  }, [setClientes, addToast])

  const updateCliente = useCallback((id, data) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    addToast('Cliente actualizado')
  }, [setClientes, addToast])

  const deleteCliente = useCallback((id) => {
    setClientes(prev => prev.filter(c => c.id !== id))
    addToast('Cliente eliminado')
  }, [setClientes, addToast])

  // COTIZACIONES
  const generateCotizacionId = useCallback(() => {
    return generateId('COT', getCurrentYear())
  }, [])

  const addCotizacion = useCallback((data) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0)
    const descuentoTotal = data.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario * item.descuento_pct / 100), 0)
    const ivaMonto = data.aplicar_iva ? subtotal * 0.19 : 0
    const total = subtotal - descuentoTotal + ivaMonto

    const nueva = {
      id: generateCotizacionId(),
      ...data,
      fecha_creacion: getCurrentDateISO(),
      fecha_vencimiento: addDaysToDate(getCurrentDateISO(), 30),
      subtotal,
      descuento_total: descuentoTotal,
      iva_monto: ivaMonto,
      total,
      convertida_a_pedido_id: null
    }
    setCotizaciones(prev => [...prev, nueva])
    addToast(`Cotización ${nueva.id} creada`)
    return nueva
  }, [generateCotizacionId, setCotizaciones, addToast])

  const updateCotizacion = useCallback((id, data) => {
    setCotizaciones(prev => prev.map(c => {
      if (c.id === id) {
        const subtotal = data.items ? data.items.reduce((sum, item) => sum + item.subtotal, 0) : c.subtotal
        const descuentoTotal = data.items ? data.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario * item.descuento_pct / 100), 0) : c.descuento_total
        const ivaMonto = data.aplicar_iva !== undefined ? (data.aplicar_iva ? subtotal * 0.19 : 0) : c.iva_monto
        const total = subtotal - descuentoTotal + ivaMonto

        return {
          ...c,
          ...data,
          subtotal,
          descuento_total: descuentoTotal,
          iva_monto: ivaMonto,
          total
        }
      }
      return c
    }))
    addToast('Cotización actualizada')
  }, [setCotizaciones, addToast])

  const deleteCotizacion = useCallback((id) => {
    setCotizaciones(prev => prev.filter(c => c.id !== id))
    addToast('Cotización eliminada')
  }, [setCotizaciones, addToast])

  const aprobarCotizacion = useCallback((cotizacionId) => {
    const cotizacion = cotizaciones.find(c => c.id === cotizacionId)
    if (!cotizacion) throw new Error('Cotización no encontrada')

    // Create pedido
    const pedidoId = generateId('PED', getCurrentYear())
    const nuevoPedido = {
      id: pedidoId,
      origen: 'Cotización',
      cotizacion_id: cotizacionId,
      cliente_id: cotizacion.cliente_id,
      nombre_cliente: cotizacion.cliente_id ? 
        (clientes.find(cl => cl.id === cotizacion.cliente_id)?.nombre_completo || '') : 
        cotizacion.nombre_cliente_temporal,
      telefono_cliente: cotizacion.cliente_id ? 
        (clientes.find(cl => cl.id === cotizacion.cliente_id)?.telefono || '') : 
        cotizacion.telefono_cliente_temporal,
      direccion_entrega: '',
      fecha_pedido: getCurrentDateISO(),
      fecha_entrega_estimada: addDaysToDate(getCurrentDateISO(), 7),
      fecha_entrega_real: null,
      estado: 'Pendiente',
      historial_estados: [{ estado: 'Pendiente', fecha: getCurrentDateISO(), notas: 'Creado desde cotización' }],
      items: cotizacion.items,
      subtotal: cotizacion.subtotal,
      descuento: cotizacion.descuento_total,
      aplicar_iva: cotizacion.aplicar_iva,
      iva_monto: cotizacion.iva_monto,
      total: cotizacion.total,
      metodo_pago: 'Transferencia bancaria',
      estado_pago: 'Pendiente',
      adelanto: 0,
      saldo_pendiente: cotizacion.total,
      notas: cotizacion.notas
    }

    setPedidos(prev => [...prev, nuevoPedido])
    
    // Update cotizacion
    setCotizaciones(prev => prev.map(c => 
      c.id === cotizacionId ? { ...c, estado: 'Aprobada', convertida_a_pedido_id: pedidoId } : c
    ))

    addToast(`Cotización aprobada. Pedido ${pedidoId} creado`, 'success')
    return pedidoId
  }, [cotizaciones, clientes, setPedidos, setCotizaciones, addToast])

  const actualizarCotizacionesVencidas = useCallback(() => {
    const hoy = new Date()
    setCotizaciones(prev => prev.map(c => {
      if ((c.estado === 'Borrador' || c.estado === 'Enviada') && isDateBefore(c.fecha_vencimiento, hoy)) {
        return { ...c, estado: 'Vencida' }
      }
      return c
    }))
  }, [setCotizaciones])

  // PEDIDOS
  const generatePedidoId = useCallback(() => {
    return generateId('PED', getCurrentYear())
  }, [])

  const addPedido = useCallback((data) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0)
    const ivaMonto = data.aplicar_iva ? subtotal * 0.19 : 0
    const total = subtotal + ivaMonto

    const nuevo = {
      id: generatePedidoId(),
      origen: 'Manual',
      cotizacion_id: null,
      ...data,
      fecha_pedido: getCurrentDateISO(),
      fecha_entrega_estimada: data.fecha_entrega_estimada || addDaysToDate(getCurrentDateISO(), 7),
      fecha_entrega_real: null,
      estado: 'Pendiente',
      historial_estados: [{ estado: 'Pendiente', fecha: getCurrentDateISO(), notas: 'Pedido creado' }],
      subtotal,
      descuento: 0,
      iva_monto: ivaMonto,
      total,
      estado_pago: data.estado_pago || 'Pendiente',
      adelanto: data.adelanto || 0,
      saldo_pendiente: total - (data.adelanto || 0)
    }
    setPedidos(prev => [...prev, nuevo])
    addToast(`Pedido ${nuevo.id} creado`)
    return nuevo
  }, [generatePedidoId, setPedidos, addToast])

  const updatePedido = useCallback((id, data) => {
    setPedidos(prev => prev.map(p => {
      if (p.id === id) {
        // If estado changed, add to historial
        if (data.estado && data.estado !== p.estado) {
          const nuevoHistorial = [
            ...p.historial_estados,
            { estado: data.estado, fecha: getCurrentDateISO(), notas: data.notas_cambio || '' }
          ]
          return { ...p, ...data, historial_estados: nuevoHistorial }
        }
        return { ...p, ...data }
      }
      return p
    }))
    addToast('Pedido actualizado')
  }, [setPedidos, addToast])

  const deletePedido = useCallback((id) => {
    setPedidos(prev => prev.filter(p => p.id !== id))
    addToast('Pedido eliminado')
  }, [setPedidos, addToast])

  const marcarEntregadoYPagado = useCallback((pedidoId) => {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) throw new Error('Pedido no encontrado')

    // Calculate production cost
    let costoProduccionTotal = 0
    pedido.items.forEach(item => {
      const producto = productos.find(p => p.id === item.producto_id)
      if (producto) {
        costoProduccionTotal += producto.costo_produccion * item.cantidad
      }
    })

    // Create venta
    const ventaId = generateId('VTA', getCurrentYear())
    const nuevaVenta = {
      id: ventaId,
      pedido_id: pedidoId,
      fecha_venta: getCurrentDateISO(),
      nombre_cliente: pedido.nombre_cliente,
      items: pedido.items,
      subtotal: pedido.subtotal,
      total: pedido.total,
      metodo_pago: pedido.metodo_pago,
      costo_produccion_total: costoProduccionTotal,
      utilidad: pedido.total - costoProduccionTotal,
      margen_utilidad_pct: ((pedido.total - costoProduccionTotal) / pedido.total) * 100
    }
    setVentas(prev => [...prev, nuevaVenta])

    // Create income
    const ingreso = {
      id: generateUUID(),
      fecha: getCurrentDateISO(),
      concepto: `Venta ${ventaId} - ${pedido.nombre_cliente}`,
      monto: pedido.total,
      categoria: 'Venta de producto',
      referencia_venta_id: ventaId,
      notas: ''
    }
    setFinanzasIngresos(prev => [...prev, ingreso])

    // Update pedido
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return {
          ...p,
          estado: 'Entregado',
          estado_pago: 'Pagado',
          fecha_entrega_real: getCurrentDateISO(),
          historial_estados: [
            ...p.historial_estados,
            { estado: 'Entregado', fecha: getCurrentDateISO(), notas: 'Entregado y pagado' }
          ]
        }
      }
      return p
    }))

    addToast(`Venta ${ventaId} generada automáticamente`, 'success')
    return ventaId
  }, [pedidos, productos, setVentas, setFinanzasIngresos, setPedidos, addToast])

  // VENTAS
  const generateVentaId = useCallback(() => {
    return generateId('VTA', getCurrentYear())
  }, [])

  const addVentaDirecta = useCallback((data) => {
    let costoProduccionTotal = 0
    data.items.forEach(item => {
      const producto = productos.find(p => p.id === item.producto_id)
      if (producto) {
        costoProduccionTotal += producto.costo_produccion * item.cantidad
      }
    })

    const subtotal = data.items.reduce((sum, item) => sum + item.subtotal, 0)
    const ivaMonto = data.aplicar_iva ? subtotal * 0.19 : 0
    const total = subtotal + ivaMonto

    const nueva = {
      id: generateVentaId(),
      pedido_id: null,
      fecha_venta: getCurrentDateISO(),
      ...data,
      subtotal,
      total,
      costo_produccion_total: costoProduccionTotal,
      utilidad: total - costoProduccionTotal,
      margen_utilidad_pct: ((total - costoProduccionTotal) / total) * 100
    }
    setVentas(prev => [...prev, nueva])

    // Create income
    const ingreso = {
      id: generateUUID(),
      fecha: getCurrentDateISO(),
      concepto: `Venta directa ${nueva.id} - ${data.nombre_cliente}`,
      monto: total,
      categoria: 'Venta de producto',
      referencia_venta_id: nueva.id,
      notas: ''
    }
    setFinanzasIngresos(prev => [...prev, ingreso])

    addToast(`Venta ${nueva.id} registrada`)
    return nueva
  }, [generateVentaId, productos, setVentas, setFinanzasIngresos, addToast])

  // FINANZAS
  const addIngreso = useCallback((data) => {
    const nuevo = {
      id: generateUUID(),
      ...data,
      fecha: data.fecha || getCurrentDateISO()
    }
    setFinanzasIngresos(prev => [...prev, nuevo])
    addToast('Ingreso registrado')
    return nuevo
  }, [setFinanzasIngresos, addToast])

  const addEgreso = useCallback((data) => {
    const nuevo = {
      id: generateUUID(),
      ...data,
      fecha: data.fecha || getCurrentDateISO()
    }
    setFinanzasEgresos(prev => [...prev, nuevo])
    addToast('Egreso registrado')
    return nuevo
  }, [setFinanzasEgresos, addToast])

  const addGastoFijo = useCallback((data) => {
    const nuevo = {
      id: generateUUID(),
      ...data,
      activo: true
    }
    setGastosFijos(prev => [...prev, nuevo])
    addToast('Gasto fijo agregado')
    return nuevo
  }, [setGastosFijos, addToast])

  // Computed values for dashboard
  const dashboardData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Ventas del mes
    const ventasMes = ventas.filter(v => {
      const d = new Date(v.fecha_venta)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    const totalVentasMes = ventasMes.reduce((sum, v) => sum + v.total, 0)

    // Pedidos pendientes
    const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente' || p.estado === 'En producción')

    // Cotizaciones sin responder
    const cotizacionesSinResponder = cotizaciones.filter(c => c.estado === 'Enviada')

    // Alertas de stock
    const alertasStockMP = materiasPrimas.filter(mp => mp.activo && mp.cantidad_disponible < mp.stock_minimo)
    const alertasStockTerminado = inventarioTerminado.filter(inv => inv.cantidad_disponible < inv.stock_minimo)

    // Pedidos con entrega próxima (≤ 2 días)
    const dosDiasDespues = new Date()
    dosDiasDespues.setDate(dosDiasDespues.getDate() + 2)
    const pedidosEntregaProxima = pedidos.filter(p => {
      if (p.estado === 'Entregado' || p.estado === 'Cancelado') return false
      const fechaEntrega = new Date(p.fecha_entrega_estimada)
      return fechaEntrega <= dosDiasDespues
    })

    return {
      totalVentasMes,
      pedidosPendientesCount: pedidosPendientes.length,
      cotizacionesSinResponderCount: cotizacionesSinResponder.length,
      alertasStockCount: alertasStockMP.length + alertasStockTerminado.length,
      pedidosEntregaProximaCount: pedidosEntregaProxima.length,
      pedidosEntregaProxima
    }
  }, [ventas, pedidos, cotizaciones, materiasPrimas, inventarioTerminado])

  const value = {
    // State
    materiasPrimas,
    productos,
    inventarioTerminado,
    clientes,
    cotizaciones,
    pedidos,
    ventas,
    finanzasIngresos,
    finanzasEgresos,
    gastosFijos,
    toasts,
    companyName,
    dashboardData,

    // Setters
    setCompanyName,

    // Toast
    addToast,

    // Init
    initializeApp,

    // Materias Primas
    addMateriaPrima,
    updateMateriaPrima,
    deleteMateriaPrima,
    registrarCompraMateriaPrima,
    recalculateProductCosts,

    // Productos
    addProducto,
    updateProducto,
    deleteProducto,

    // Inventario Terminado
    registrarProduccion,
    ajusteManualInventarioTerminado,

    // Clientes
    addCliente,
    updateCliente,
    deleteCliente,

    // Cotizaciones
    addCotizacion,
    updateCotizacion,
    deleteCotizacion,
    aprobarCotizacion,
    actualizarCotizacionesVencidas,

    // Pedidos
    addPedido,
    updatePedido,
    deletePedido,
    marcarEntregadoYPagado,

    // Ventas
    addVentaDirecta,

    // Finanzas
    addIngreso,
    addEgreso,
    addGastoFijo
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

// Seed data function
function getSeedData() {
  const now = new Date()
  const year = now.getFullYear()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  return {
    materiasPrimas: [
      {
        id: generateUUID(),
        nombre: 'Cera de soja escamas',
        categoria: 'Cera',
        unidad_medida: 'gramos',
        cantidad_disponible: 2500,
        costo_por_unidad: 18,
        costo_total: 45000,
        stock_minimo: 500,
        proveedor: 'Proveedores Candeleros SAS',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: 'Cera premium 100% soja',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Fragancia lavanda premium',
        categoria: 'Fragancia',
        unidad_medida: 'mililitros',
        cantidad_disponible: 150,
        costo_por_unidad: 1200,
        costo_total: 180000,
        stock_minimo: 30,
        proveedor: 'Aromas del Mundo',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: 'Fragancia importada',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Fragancia vainilla',
        categoria: 'Fragancia',
        unidad_medida: 'mililitros',
        cantidad_disponible: 200,
        costo_por_unidad: 900,
        costo_total: 180000,
        stock_minimo: 30,
        proveedor: 'Aromas del Mundo',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Colorante en escamas rojo',
        categoria: 'Colorante',
        unidad_medida: 'gramos',
        cantidad_disponible: 50,
        costo_por_unidad: 800,
        costo_total: 40000,
        stock_minimo: 10,
        proveedor: 'ColorCera',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Mecha de algodón pretratada',
        categoria: 'Mecha',
        unidad_medida: 'unidades',
        cantidad_disponible: 100,
        costo_por_unidad: 350,
        costo_total: 35000,
        stock_minimo: 20,
        proveedor: 'Mechas Premium',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Vaso de vidrio 8oz transparente',
        categoria: 'Envase',
        unidad_medida: 'unidades',
        cantidad_disponible: 40,
        costo_por_unidad: 2800,
        costo_total: 112000,
        stock_minimo: 10,
        proveedor: 'Envases de Vidrio',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Vaso de aluminio plateado',
        categoria: 'Envase',
        unidad_medida: 'unidades',
        cantidad_disponible: 25,
        costo_por_unidad: 3500,
        costo_total: 87500,
        stock_minimo: 8,
        proveedor: 'Envases de Aluminio',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      },
      {
        id: generateUUID(),
        nombre: 'Caja kraft para regalo',
        categoria: 'Decoración',
        unidad_medida: 'unidades',
        cantidad_disponible: 30,
        costo_por_unidad: 1200,
        costo_total: 36000,
        stock_minimo: 10,
        proveedor: 'Empaques Kraft',
        fecha_ultima_compra: oneMonthAgo.toISOString(),
        notas: '',
        activo: true
      }
    ],
    productos: [
      {
        id: generateUUID(),
        nombre_producto: 'Vela Soja Lavanda 200g',
        descripcion: 'Vela aromática de soja con fragancia de lavanda francesa',
        categoria: 'Vela de soja',
        imagen_url: '',
        precio_venta: 28000,
        costo_produccion: 0,
        margen_utilidad: 0,
        precio_minimo_sugerido: 0,
        tiempo_produccion_minutos: 45,
        activo: true,
        receta: [],
        notas_fabricacion: 'Derretir cera a 75°C, añadir fragancia a 65°C'
      },
      {
        id: generateUUID(),
        nombre_producto: 'Vela Soja Vainilla 200g',
        descripcion: 'Vela aromática de soja con fragancia de vainilla bourbon',
        categoria: 'Vela de soja',
        imagen_url: '',
        precio_venta: 26000,
        costo_produccion: 0,
        margen_utilidad: 0,
        precio_minimo_sugerido: 0,
        tiempo_produccion_minutos: 45,
        activo: true,
        receta: [],
        notas_fabricacion: ''
      },
      {
        id: generateUUID(),
        nombre_producto: 'Vela Decorativa Rosa',
        descripcion: 'Vela decorativa en envase de aluminio con colorante',
        categoria: 'Vela decorativa',
        imagen_url: '',
        precio_venta: 35000,
        costo_produccion: 0,
        margen_utilidad: 0,
        precio_minimo_sugerido: 0,
        tiempo_produccion_minutos: 60,
        activo: true,
        receta: [],
        notas_fabricacion: ''
      },
      {
        id: generateUUID(),
        nombre_producto: 'Kit Regalo x2 Velas',
        descripcion: 'Set de 2 velas en caja kraft regalo',
        categoria: 'Set / Kit',
        imagen_url: '',
        precio_venta: 68000,
        costo_produccion: 0,
        margen_utilidad: 0,
        precio_minimo_sugerido: 0,
        tiempo_produccion_minutos: 100,
        activo: true,
        receta: [],
        notas_fabricacion: ''
      }
    ],
    clientes: [
      {
        id: generateUUID(),
        nombre_completo: 'María González',
        tipo: 'Persona Natural',
        documento: '1098765432',
        email: 'maria.g@email.com',
        telefono: '3201234567',
        ciudad: 'Bogotá',
        direccion: 'Calle 123 #45-67',
        notas: '',
        fecha_registro: oneMonthAgo.toISOString()
      },
      {
        id: generateUUID(),
        nombre_completo: 'Tienda Aromas del Alma',
        tipo: 'Empresa',
        documento: '900123456-7',
        email: 'contacto@aromasdelalma.co',
        telefono: '3109876543',
        ciudad: 'Medellín',
        direccion: 'Carrera 50 #10-20',
        notas: 'Cliente mayorista',
        fecha_registro: oneMonthAgo.toISOString()
      },
      {
        id: generateUUID(),
        nombre_completo: 'Laura Martínez',
        tipo: 'Persona Natural',
        documento: '1087654321',
        email: 'laurita.m@gmail.com',
        telefono: '3156789012',
        ciudad: 'Bogotá',
        direccion: 'Avenida 19 #30-40',
        notas: '',
        fecha_registro: oneMonthAgo.toISOString()
      }
    ],
    cotizaciones: [
      {
        id: `COT-${year}-001`,
        cliente_id: null,
        nombre_cliente_temporal: 'Tienda Aromas del Alma',
        telefono_cliente_temporal: '3109876543',
        fecha_creacion: oneMonthAgo.toISOString(),
        fecha_vencimiento: addDaysToDate(oneMonthAgo.toISOString(), 30),
        estado: 'Aprobada',
        items: [],
        subtotal: 540000,
        descuento_total: 0,
        aplicar_iva: false,
        iva_monto: 0,
        total: 540000,
        notas: '',
        condiciones_pago: '50% anticipo, 50% contra entrega',
        convertida_a_pedido_id: `PED-${year}-001`
      },
      {
        id: `COT-${year}-002`,
        cliente_id: null,
        nombre_cliente_temporal: 'María González',
        telefono_cliente_temporal: '3201234567',
        fecha_creacion: now.toISOString(),
        fecha_vencimiento: addDaysToDate(now.toISOString(), 15),
        estado: 'Enviada',
        items: [],
        subtotal: 171000,
        descuento_total: 0,
        aplicar_iva: false,
        iva_monto: 0,
        total: 171000,
        notas: '',
        condiciones_pago: 'Pago contra entrega',
        convertida_a_pedido_id: null
      }
    ],
    pedidos: [
      {
        id: `PED-${year}-001`,
        origen: 'Cotización',
        cotizacion_id: `COT-${year}-001`,
        cliente_id: null,
        nombre_cliente: 'Tienda Aromas del Alma',
        telefono_cliente: '3109876543',
        direccion_entrega: 'Carrera 50 #10-20, Medellín',
        fecha_pedido: oneMonthAgo.toISOString(),
        fecha_entrega_estimada: addDaysToDate(now.toISOString(), 5),
        fecha_entrega_real: null,
        estado: 'En producción',
        historial_estados: [
          { estado: 'Pendiente', fecha: oneMonthAgo.toISOString(), notas: 'Creado desde cotización' },
          { estado: 'En producción', fecha: now.toISOString(), notas: 'Iniciada producción' }
        ],
        items: [],
        subtotal: 540000,
        descuento: 0,
        aplicar_iva: false,
        iva_monto: 0,
        total: 540000,
        metodo_pago: 'Transferencia bancaria',
        estado_pago: 'Pendiente',
        adelanto: 150000,
        saldo_pendiente: 390000,
        notas: ''
      },
      {
        id: `PED-${year}-002`,
        origen: 'Manual',
        cotizacion_id: null,
        cliente_id: null,
        nombre_cliente: 'Laura Martínez',
        telefono_cliente: '3156789012',
        direccion_entrega: 'Avenida 19 #30-40, Bogotá',
        fecha_pedido: now.toISOString(),
        fecha_entrega_estimada: addDaysToDate(now.toISOString(), 1),
        fecha_entrega_real: null,
        estado: 'Listo',
        historial_estados: [
          { estado: 'Pendiente', fecha: now.toISOString(), notas: 'Pedido creado' },
          { estado: 'Listo', fecha: now.toISOString(), notas: 'Producción completada' }
        ],
        items: [],
        subtotal: 84000,
        descuento: 0,
        aplicar_iva: false,
        iva_monto: 0,
        total: 84000,
        metodo_pago: 'Efectivo',
        estado_pago: 'Pagado',
        adelanto: 84000,
        saldo_pendiente: 0,
        notas: ''
      },
      {
        id: `PED-${year}-003`,
        origen: 'Manual',
        cotizacion_id: null,
        cliente_id: null,
        nombre_cliente: 'María González',
        telefono_cliente: '3201234567',
        direccion_entrega: 'Calle 123 #45-67, Bogotá',
        fecha_pedido: oneMonthAgo.toISOString(),
        fecha_entrega_estimada: addDaysToDate(oneMonthAgo.toISOString(), 2),
        fecha_entrega_real: oneMonthAgo.toISOString(),
        estado: 'Entregado',
        historial_estados: [
          { estado: 'Pendiente', fecha: oneMonthAgo.toISOString(), notas: 'Pedido creado' },
          { estado: 'Entregado', fecha: oneMonthAgo.toISOString(), notas: 'Entregado y pagado' }
        ],
        items: [],
        subtotal: 68000,
        descuento: 0,
        aplicar_iva: false,
        iva_monto: 0,
        total: 68000,
        metodo_pago: 'Efectivo',
        estado_pago: 'Pagado',
        adelanto: 68000,
        saldo_pendiente: 0,
        notas: ''
      }
    ],
    ventas: [
      {
        id: `VTA-${year}-001`,
        pedido_id: `PED-${year}-003`,
        fecha_venta: oneMonthAgo.toISOString(),
        nombre_cliente: 'María González',
        items: [],
        subtotal: 68000,
        total: 68000,
        metodo_pago: 'Efectivo',
        costo_produccion_total: 15000,
        utilidad: 53000,
        margen_utilidad_pct: 77.9
      }
    ],
    finanzasIngresos: [
      {
        id: generateUUID(),
        fecha: oneMonthAgo.toISOString(),
        concepto: 'Venta VTA-2025-001 - Kit Regalo',
        monto: 68000,
        categoria: 'Venta de producto',
        referencia_venta_id: `VTA-${year}-001`,
        notas: ''
      },
      {
        id: generateUUID(),
        fecha: now.toISOString(),
        concepto: 'Anticipo PED-2025-001',
        monto: 150000,
        categoria: 'Anticipo pedido',
        referencia_venta_id: null,
        notas: ''
      }
    ],
    finanzasEgresos: [
      {
        id: generateUUID(),
        fecha: oneMonthAgo.toISOString(),
        concepto: 'Compra cera soja 2kg',
        monto: 36000,
        categoria: 'Compra materia prima',
        comprobante: '',
        notas: ''
      },
      {
        id: generateUUID(),
        fecha: now.toISOString(),
        concepto: 'Domicilio/envío pedido',
        monto: 8000,
        categoria: 'Transporte y envío',
        comprobante: '',
        notas: ''
      },
      {
        id: generateUUID(),
        fecha: now.toISOString(),
        concepto: 'Compra fragancias proveedor',
        monto: 85000,
        categoria: 'Compra materia prima',
        comprobante: '',
        notas: ''
      }
    ],
    gastosFijos: [
      {
        id: generateUUID(),
        nombre: 'Internet',
        monto_mensual: 65000,
        categoria: 'Servicios públicos',
        activo: true
      }
    ],
    inventarioTerminado: []
  }
}
