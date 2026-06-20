# Velas Artesanales App

Sistema de gestión completo para empresa de velas artesanales, desarrollado con React, Vite, Tailwind CSS y localStorage para persistencia de datos.

## 🚀 Características

- **Dashboard**: KPIs, gráficas de ingresos/egresos, productos más vendidos, márgenes
- **Materia Prima**: Inventario de materias primas con registro de compras
- **Productos + Recetas**: Catálogo de productos con recetas y cálculo automático de costos
- **Inventario Terminado**: Gestión de stock de productos terminados con registro de producción
- **Clientes**: Gestión de clientes con historial de pedidos
- **Cotizaciones**: Sistema de cotizaciones con flujo de aprobación → pedido automático
- **Pedidos**: Gestión de pedidos con vista Kanban y flujo → venta automática
- **Ventas**: Registro de ventas con gráficas de análisis
- **Finanzas**: Gestión financiera con ingresos, egresos y gastos fijos

## 🛠️ Stack Tecnológico

- **React 18.3.1** - Framework de UI
- **Vite 5.1.0** - Build tool
- **React Router v6** - Enrutamiento
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficas
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas
- **localStorage** - Persistencia de datos

## 📦 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/deimerrincon5-glitch/kp_klandess.git
cd kp_klandess

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Generar build de producción
npm run build
```

## 🌐 Despliegue en Render

### Paso 1: Conectar Repositorio a Render

1. Ve a [render.com](https://render.com) e inicia sesión
2. Clic en "New +" → "Web Service"
3. Selecciona "Connect GitHub"
4. Autoriza Render para acceder a tu cuenta de GitHub
5. Busca y selecciona el repositorio `kp_klandess`

### Paso 2: Configurar el Despliegue

**Configuración del Web Service:**

- **Name**: `velas-artesanales-app` (o el nombre que prefieras)
- **Region**: Selecciona la región más cercana a tus usuarios
- **Branch**: `main`
- **Runtime**: Static Site
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18.x` (o `20.x`)

### Paso 3: Variables de Entorno

Este proyecto **no requiere variables de entorno**. No es necesario configurar ninguna.

### Paso 4: Desplegar

1. Clic en "Create Web Service"
2. Render iniciará automáticamente el proceso de build y despliegue
3. Espera a que el build se complete (aproximadamente 2-3 minutos)
4. Una vez completado, Render te proporcionará una URL pública

### Paso 5: Verificar el Despliegue

1. Accede a la URL proporcionada por Render
2. Verifica que la aplicación cargue correctamente
3. Navega entre los diferentes módulos para asegurar que las rutas funcionen
4. Prueba las funcionalidades principales (crear productos, registrar ventas, etc.)

### Configuración de SPA

El archivo `render.yaml` incluido en el proyecto configura automáticamente las redirecciones para que las rutas de React Router funcionen correctamente al refrescar la página. No requiere configuración adicional.

## 📝 Reglas de Negocio

- **Protección de stock**: No permite stock negativo en materias primas ni productos terminados
- **Recálculo en cascada**: Al cambiar el costo de un insumo, se recalculan automáticamente los costos de los productos que lo usan
- **Flujo Cotización → Pedido**: Al aprobar una cotización, se crea automáticamente un pedido
- **Flujo Pedido → Venta**: Al marcar un pedido como entregado y pagado, se genera automáticamente una venta
- **Producción transaccional**: El registro de producción verifica y deduce automáticamente los insumos necesarios
- **Numeración automática**: Cotizaciones, pedidos y ventas tienen numeración automática (COT-YYYY-NNN, PED-YYYY-NNN, VTA-YYYY-NNN)
- **Alertas de entrega**: Pedidos con fecha de entrega en los próximos 2 días generan alertas
- **Vencimiento de cotizaciones**: Cotizaciones vencen automáticamente después de 15 días

## 🎨 Diseño

- **Paleta de colores**: Ámbar, crema, cobre
- **Tipografía**: Playfair Display (títulos), Inter (texto)
- **Diseño**: Responsivo para tablet y desktop (min-width: 768px)
- **Componentes**: Sidebar colapsable, toasts de notificación, cards con sombras suaves

## 📊 Datos de Demo

La aplicación carga automáticamente datos de demostración en la primera carga:
- 8 insumos de materia prima
- 4 productos con recetas
- 3 clientes
- 2 cotizaciones
- 3 pedidos
- 1 venta
- 5 movimientos financieros
- 1 gasto fijo

## 🔄 Actualizar Despliegue

Para actualizar el despliegue en Render después de hacer cambios:

```bash
# Hacer commit de los cambios
git add .
git commit -m "Descripción del cambio"
git push
```

Render detectará automáticamente los cambios en GitHub y reiniciará el proceso de build y despliegue.

## 📄 Licencia

Este proyecto es de uso privado para la gestión de la empresa de velas artesanales.

## 👤 Autor

Desarrollado para gestión de empresa de velas artesanales.
