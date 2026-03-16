# Distributor Web — Frontend

## Descripcion

Frontend del SaaS de gestion para distribuidora argentina. Interfaz web moderna construida con Next.js 15 y React 19, que se conecta a un backend NestJS. Incluye modulos de ventas estilo POS, gestion de stock, cuentas corrientes, facturacion electronica ARCA (ex AFIP), y reportes con exportacion.

## Tecnologias

| Tecnologia | Version | Uso |
|---|---|---|
| [Next.js](https://nextjs.org/) | ^15.1.0 | Framework React con App Router |
| [React](https://react.dev/) | ^19.0.0 | Libreria de UI |
| [TypeScript](https://www.typescriptlang.org/) | ^5.7.0 | Tipado estatico |
| [TailwindCSS](https://tailwindcss.com/) | ^4.0.0 | Estilos utilitarios (via PostCSS) |
| [Shadcn/ui](https://ui.shadcn.com/) | manual | Componentes UI (copiados al proyecto) |
| [Radix UI](https://www.radix-ui.com/) | varias | Primitivas accesibles (Dialog, Select, Tabs, Toast, etc.) |
| [TanStack Table](https://tanstack.com/table) | ^8.20.6 | Tablas con sorting, filtros y paginacion |
| [React Hook Form](https://react-hook-form.com/) | ^7.54.2 | Gestion de formularios |
| [Zod](https://zod.dev/) | ^3.24.1 | Validacion de schemas |
| [Axios](https://axios-http.com/) | ^1.7.9 | Cliente HTTP con interceptors |
| [lucide-react](https://lucide.dev/) | ^0.468.0 | Iconos |
| [class-variance-authority](https://cva.style/) | ^0.7.1 | Variantes de componentes |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | ^2.1.1 / ^2.6.0 | Utilidad para clases CSS |

## Requisitos Previos

- **Node.js** 20 o superior
- **npm** (incluido con Node.js)
- **Backend** corriendo en `http://localhost:3001` (ver repositorio del backend NestJS)

## Instalacion y Configuracion

### 1. Clonar repositorio

```bash
git clone <url-del-repositorio>
cd distributor-web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar backend

El cliente API apunta por defecto a `http://localhost:3001`. Si el backend corre en otra URL, modificar la `baseURL` en:

```
src/lib/api-client.ts
```

La autenticacion usa cookies httpOnly con `withCredentials: true`, por lo que el backend debe tener CORS configurado para aceptar el origen del frontend.

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicacion estara disponible en **http://localhost:3000**.

## Estructura del Proyecto

```
src/
├── app/                            # Paginas (App Router)
│   ├── globals.css                 # Estilos globales + TailwindCSS
│   ├── layout.tsx                  # Layout raiz (AuthProvider + Toaster)
│   ├── login/                      # Pagina de login
│   │   └── page.tsx
│   └── (dashboard)/                # Layout autenticado (Sidebar + Topbar)
│       ├── layout.tsx              # Guard de autenticacion
│       ├── dashboard/              # Dashboard con KPIs
│       ├── proveedores/            # CRUD proveedores
│       ├── clientes/               # CRUD clientes
│       ├── productos/              # CRUD productos + familias/subfamilias
│       ├── precios/                # Gestion de precios por lista
│       ├── ventas/                 # Ventas (POS, listado, detalle)
│       ├── stock/                  # Stock (overview, ingreso, movimientos)
│       ├── cuentas-corrientes/     # Cuentas corrientes y deudores
│       ├── facturacion/            # Comprobantes y config ARCA
│       └── reportes/               # Reportes (ventas, IVA, stock valorizado)
│
├── components/
│   ├── ui/                         # Componentes Shadcn/ui
│   │   ├── alert-dialog.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── layout/                     # Layout principal
│   │   ├── sidebar.tsx             # Sidebar con navegacion por rol
│   │   └── topbar.tsx              # Barra superior con usuario
│   ├── forms/                      # Formularios reutilizables
│   │   ├── proveedor-form.tsx
│   │   ├── cliente-form.tsx
│   │   └── producto-form.tsx
│   ├── tables/                     # Tabla generica
│   │   └── data-table.tsx
│   └── shared/                     # Componentes compartidos
│       ├── cuit-input.tsx          # Input CUIT con formato y validacion
│       └── role-gate.tsx           # Renderizado condicional por rol
│
├── hooks/
│   ├── use-auth.ts                 # AuthProvider + useAuth (login, logout, refresh)
│   └── use-toast.ts                # Hook para notificaciones toast
│
├── lib/
│   ├── api-client.ts               # Axios con interceptor de refresh automatico
│   ├── cuit-validator.ts           # Validacion CUIT modulo 11
│   ├── download.ts                 # Helper para descarga de archivos (CSV/Excel)
│   ├── formatters.ts               # formatCurrency, formatCondicionIva, etc.
│   ├── iva-calculator.ts           # Calculo IVA con/sin discriminar
│   └── utils.ts                    # Utilidad cn() para clases CSS
│
└── types/
    └── index.ts                    # Interfaces y enums TypeScript
```

## Paginas y Funcionalidades

### Login

- Formulario con validacion (React Hook Form + Zod)
- Autenticacion via cookies httpOnly
- Redireccion automatica al dashboard tras login exitoso
- Guard de autenticacion en el layout del dashboard

### Dashboard

- 4 KPIs principales:
  - Ventas del dia (cantidad y total)
  - Ventas del mes (cantidad y total)
  - Deuda total de clientes
  - Productos bajo stock minimo
- Tabla con las ultimas 5 ventas

### Proveedores

- Listado con busqueda y paginacion server-side
- Crear y editar con validacion CUIT (algoritmo modulo 11)
- Campos: razon social, CUIT, condicion IVA, direccion, telefono, email, contacto
- Eliminacion logica (soft delete)

### Clientes

- Listado con busqueda y paginacion
- Crear y editar con validacion de documento
- Soporte para CUIT, DNI y CUIL
- Campos: razon social, tipo/numero documento, condicion IVA, lista de precio asignada, limite de credito
- Eliminacion logica

### Productos

- Listado con indicador visual de bajo stock
- Crear y editar con seleccion de familia/subfamilia y proveedor
- Campos: codigo, nombre, descripcion, unidad de medida, alicuota IVA, stock actual/minimo
- Gestion de familias y subfamilias (CRUD inline desde la misma pagina)

### Precios

- Tabs por lista de precios (Lista 1, Lista 2, Lista 3)
- Edicion inline del precio neto por producto
- Actualizacion masiva por porcentaje

### Ventas (POS)

- Creacion estilo punto de venta:
  1. Seleccion de cliente (determina lista de precio y condicion IVA)
  2. Agregado de productos con cantidad
  3. Calculo automatico de IVA en tiempo real
- Flujo de estados: Borrador -> Confirmada -> Facturada
- Anulacion de ventas
- Listado con filtros por estado y fecha
- Vista detalle de cada venta

### Stock

- Vista general con alertas de productos bajo stock minimo
- Ingreso de mercaderia (entrada de stock)
- Historial de movimientos (entradas, salidas, ajustes)

### Cuentas Corrientes

- Listado de deudores con saldo total
- Detalle por cliente con historial de movimientos (debitos y creditos)
- Registro de pagos

### Facturacion (ARCA)

- Historial de comprobantes emitidos (Facturas A/B/C, Notas de Credito/Debito)
- Detalle de factura con numero de CAE y fecha de vencimiento
- Configuracion ARCA: CUIT, punto de venta, certificado digital, entorno (testing/produccion)

### Reportes

- **Reporte de ventas**: filtros por rango de fechas, exportacion a CSV y Excel
- **Reporte IVA Ventas**: agrupado por alicuota, para declaracion jurada
- **Stock valorizado**: inventario valorizado a precio de lista

## Autenticacion y Roles

### Mecanismo de autenticacion

- JWT almacenado en cookies httpOnly (gestionado por el backend)
- Refresh automatico transparente via interceptor Axios: si una request recibe 401, se reintenta el refresh del token y se reenvian las requests en cola
- Verificacion de sesion al cargar la app (`GET /auth/me`)

### Roles del sistema

El sistema maneja 4 roles definidos en el enum `Role`:

- **ADMIN**: Acceso completo a todas las funcionalidades
- **VENDEDOR**: Ventas, clientes, productos, precios, cuentas corrientes
- **DEPOSITO**: Stock, productos, proveedores
- **CONTADOR**: Facturacion, reportes, precios, clientes, cuentas corrientes, proveedores, productos

### Permisos por Rol

| Pagina | Admin | Vendedor | Deposito | Contador |
|---|:---:|:---:|:---:|:---:|
| Dashboard | Si | Si | Si | Si |
| Proveedores | Si | - | Si | Si |
| Clientes | Si | Si | - | Si |
| Productos | Si | Si | Si | Si |
| Precios | Si | Si | - | Si |
| Ventas | Si | Si | - | Si |
| Stock | Si | - | Si | - |
| Cuentas Corrientes | Si | Si | - | Si |
| Facturacion | Si | - | - | Si |
| Reportes | Si | - | - | Si |
| Usuarios | Si | - | - | - |

La navegacion del sidebar se filtra automaticamente segun el rol del usuario autenticado. El componente `RoleGate` permite control granular dentro de una pagina.

## Componentes Reutilizables

### DataTable

Tabla generica construida sobre TanStack Table v8. Soporta:
- Definicion de columnas tipadas
- Sorting por columna
- Busqueda global con filtrado
- Paginacion client-side
- Renderizado personalizado de celdas

**Ubicacion**: `src/components/tables/data-table.tsx`

### CuitInput

Input especializado para CUIT argentino:
- Formato automatico `XX-XXXXXXXX-X` mientras se escribe
- Validacion en tiempo real con algoritmo modulo 11
- Feedback visual de estado valido/invalido

**Ubicacion**: `src/components/shared/cuit-input.tsx`

### RoleGate

Componente de renderizado condicional que muestra su contenido solo si el usuario tiene uno de los roles permitidos.

**Ubicacion**: `src/components/shared/role-gate.tsx`

### Formularios

Formularios reutilizables con React Hook Form y validacion Zod:
- `proveedor-form.tsx` — Crear/editar proveedor
- `cliente-form.tsx` — Crear/editar cliente
- `producto-form.tsx` — Crear/editar producto

**Ubicacion**: `src/components/forms/`

## Utilidades

### api-client (`src/lib/api-client.ts`)

Cliente Axios preconfigurado con:
- `baseURL` apuntando al backend (`http://localhost:3001`)
- `withCredentials: true` para enviar cookies
- Interceptor de respuesta que maneja 401 automaticamente: refresca el token y reintenta las requests fallidas en cola
- Funciones helper tipadas: `get<T>()`, `post<T>()`, `patch<T>()`, `del<T>()`

### formatters (`src/lib/formatters.ts`)

Funciones de formato para mostrar datos en la UI:
- `formatCurrency` — Formato moneda argentina ($X.XXX,XX)
- `formatCondicionIva` — Labels legibles para condiciones IVA
- `formatListaPrecio` — Labels para listas de precio
- `formatEstadoVenta` — Labels y colores para estados de venta

### cuit-validator (`src/lib/cuit-validator.ts`)

Validacion client-side de CUIT argentino usando el algoritmo oficial de modulo 11.

### iva-calculator (`src/lib/iva-calculator.ts`)

Calculo de IVA segun condicion del cliente:
- Responsable Inscripto: IVA discriminado
- Consumidor Final / Monotributista / Exento: IVA incluido en precio

### download (`src/lib/download.ts`)

Helper para descarga de archivos generados por el backend (reportes en CSV y Excel).

## Build para Produccion

```bash
npm run build
npm start
```

El build genera una aplicacion Next.js optimizada con:
- React Strict Mode habilitado
- Compilacion TypeScript estricta
- Path aliases (`@/*` -> `./src/*`)

## Scripts Disponibles

| Script | Comando | Descripcion |
|---|---|---|
| `dev` | `npm run dev` | Inicia servidor de desarrollo con hot reload |
| `build` | `npm run build` | Genera build de produccion |
| `start` | `npm start` | Inicia servidor de produccion (requiere build previo) |
| `lint` | `npm run lint` | Ejecuta ESLint sobre el proyecto |

## Licencia

UNLICENSED — Proyecto privado.
