# Graph Report - front-sistema-stock  (2026-08-20)

## Corpus Check
- 187 files · ~534,468 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 983 nodes · 3019 edges · 91 communities (57 shown, 34 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36c3f43f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Clientes.jsx
- Sidebar.jsx
- toLocalDateStr
- excelImport.js
- Dashboard.jsx
- Home.jsx
- Lint & Test Tooling Deps
- Caja.jsx
- useProductosQueries.js
- src/routes.jsx
- Productos.jsx
- ConfigModal.jsx
- VentasContext.jsx
- DefaultLayout.jsx
- tokens.js
- client.js
- Compras.jsx
- demoData.js
- AppContext.jsx
- fmtMoney
- Etiquetas.jsx
- agruparPorProducto
- Deudas Clientes Queries
- PWA Manifest
- Movimientos.jsx
- useCajaQueries.js
- useHasPermiso.jsx
- brand.js
- Sucursales Queries
- dependencies
- useOptimisticListMutation
- AuthContextBase.jsx
- constants.js
- EditorVisual.jsx
- Presupuestos.jsx
- movimientosService.js
- Architecture
- Facturas.jsx
- Searchable Table Hook
- Vercel Config
- usePresupuestosQueries.js
- Driver.js Dependency
- Emotion Styled Dependency
- Framer Motion Dependency
- MUI Icons Dependency
- MUI Material Dependency
- MUI System Dependency
- Emotion React Dependency
- PDF AutoTable Dependency
- QR Code Dependency
- React Dependency
- React Colorful Dependency
- React DOM Dependency
- React Hook Form Dependency
- React RND Dependency
- React Router Dependency
- Recharts Dependency
- Sentry React Dependency
- SweetAlert2 Dependency
- Query Persist Client Dependency
- React Query Dependency
- format.js
- ZXing Browser Dependency
- ZXing Library Dependency
- demoMode.js
- usuariosService.js
- Builds por cliente (white-label)
- React + Vite
- comprasPendientes.test.jsx
- useToast
- exceljs
- @tanstack/react-query-devtools
- Login.jsx
- main.jsx
- useNotificaciones.js
- EtiquetaPreview.jsx
- productosService.js

## God Nodes (most connected - your core abstractions)
1. `useToast()` - 71 edges
2. `fmtMoney()` - 65 edges
3. `useHasPermiso()` - 45 edges
4. `PRIMARY_COLOR` - 42 edges
5. `MUTED` - 41 edges
6. `fmtDate()` - 41 edges
7. `INK` - 39 edges
8. `P` - 36 edges
9. `Home()` - 34 edges
10. `BORDER` - 34 edges

## Surprising Connections (you probably didn't know these)
- `ModalCambiarPassword()` --calls--> `useToast()`  [EXTRACTED]
  src/layout/ConfigModal.jsx → src/context/ToastContext.jsx
- `ModalCambiarPin()` --calls--> `useToast()`  [EXTRACTED]
  src/layout/ConfigModal.jsx → src/context/ToastContext.jsx
- `TabCatalogo()` --calls--> `useToast()`  [EXTRACTED]
  src/layout/ConfigModal.jsx → src/context/ToastContext.jsx
- `TabPerfil()` --calls--> `useToast()`  [EXTRACTED]
  src/layout/ConfigModal.jsx → src/context/ToastContext.jsx
- `TabSeguridad()` --calls--> `useToast()`  [EXTRACTED]
  src/layout/ConfigModal.jsx → src/context/ToastContext.jsx

## Import Cycles
- None detected.

## Communities (91 total, 34 thin omitted)

### Community 0 - "Clientes.jsx"
Cohesion: 0.11
Nodes (27): fieldSx, labelSx, PAYMENT_OPTIONS, DEUDA_COLORS, colTh, labelSx, METODO_LABELS, PDF_ESTADO (+19 more)

### Community 1 - "Sidebar.jsx"
Cohesion: 0.21
Nodes (12): useCaja(), useSucursales(), useLogo(), buildMenuSections(), Sidebar(), SIDEBAR_COLLAPSED_STORAGE_KEY, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED (+4 more)

### Community 2 - "toLocalDateStr"
Cohesion: 0.17
Nodes (18): PaymentModal, useMovimientos(), useBusquedaProductos(), ModalSaldarTodo(), AutocompleteLineaProducto(), AutocompleteProductoFila(), exportarCSV(), exportarMovimientoExcel() (+10 more)

### Community 3 - "excelImport.js"
Cohesion: 0.17
Nodes (20): ModalImportarMovimientos(), ModalActualizarPrecios(), ModalCategorias(), exportarCSVProveedores(), exportarPDFProveedores(), Proveedores(), ALIAS_CANTIDAD, ALIAS_CODIGO (+12 more)

### Community 4 - "Dashboard.jsx"
Cohesion: 0.05
Nodes (32): AppProvider(), DASHBOARD_KEYS, useDashboardStats(), usePrefetchDashboardStats(), LOTES_KEYS, useVencimientosProximos(), card, COL_TD (+24 more)

### Community 5 - "Home.jsx"
Cohesion: 0.07
Nodes (41): useVentas(), useClientes(), useCrearCliente(), FACTURAS_KEYS, useFactura(), useFacturas(), useDropdownKeyboardNav(), aProductoPos() (+33 more)

### Community 6 - "Lint & Test Tooling Deps"
Cohesion: 0.05
Nodes (43): eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, devDependencies (+35 more)

### Community 7 - "Caja.jsx"
Cohesion: 0.12
Nodes (21): aNumero(), CampoPrecio(), digitosAntesDe(), formatearDesdeTexto(), formatearDesdeValor(), posicionTrasNDigitos(), card, fmt() (+13 more)

### Community 8 - "useProductosQueries.js"
Cohesion: 0.23
Nodes (8): ProductosProvider(), ProductosCtx, useCrearMovimiento(), useTransferirStock(), PRODUCTOS_KEYS, useActualizarProducto(), useCrearProducto(), useEliminarProducto()

### Community 9 - "src/routes.jsx"
Cohesion: 0.07
Nodes (28): ErrorBoundary, ErrorScreen(), RouteErrorElement(), Alerta(), AlertaBuilder, AlertaWithConfirmation(), doubleConfirmationAlert(), Caja (+20 more)

### Community 10 - "Productos.jsx"
Cohesion: 0.10
Nodes (20): useProductosPaginado(), useContainerWidth(), useDebouncedValue(), BarcodeScanner, BloqueImagenProducto(), formDesdeProducto(), generarCodigoInterno(), generarPdfInventario() (+12 more)

### Community 11 - "ConfigModal.jsx"
Cohesion: 0.10
Nodes (17): WA_NUMBER, card, ConfigModal(), fieldSx, formFromEmpresa(), METODOS_ARQUEO, ModalCambiarPassword(), ModalCambiarPin() (+9 more)

### Community 12 - "VentasContext.jsx"
Cohesion: 0.16
Nodes (12): DEMO_VENTAS, VentasProvider(), VentasCtx, CAJA_KEYS, MOVIMIENTOS_KEYS, DEFAULT_LIST_PARAMS, useCrearVenta(), useVentas() (+4 more)

### Community 13 - "DefaultLayout.jsx"
Cohesion: 0.21
Nodes (14): AsistenteIA(), FAQS, WA_MSG, PRIMARY_COLOR, ProductCard(), ProductModal(), usuariosService, P (+6 more)

### Community 14 - "tokens.js"
Cohesion: 0.15
Nodes (19): ERROR_DARK, GOLD, INFO, METHOD_COLORS, MONEY, ORANGE, PURPLE, ROL_COLORS (+11 more)

### Community 15 - "client.js"
Cohesion: 0.14
Nodes (8): api, asistenteService, catalogoService, etiquetasService, iaService, permisosService, sistemaService, tallesService

### Community 16 - "Compras.jsx"
Cohesion: 0.17
Nodes (7): COMPANY_NAME, COLUMNS, ESTADO_COLORS, ESTADOS, METODO_LABELS, selectSx, ARGB_PRIMARY

### Community 17 - "demoData.js"
Cohesion: 0.16
Nodes (13): CATS, CLIENTES, DEMO_CAJA, DEMO_MOVIMIENTOS, DEMO_PRODUCTOS, fecha(), generarVentasDemo(), hora() (+5 more)

### Community 18 - "AppContext.jsx"
Cohesion: 0.14
Nodes (8): DEMO_DEUDAS, DEMO_FIADOS, METODO_LABELS, AppCtx, useApp(), CoreDataProviders(), DEUDAS_KEYS, deudasService

### Community 19 - "fmtMoney"
Cohesion: 0.14
Nodes (34): CommandPalette, useHasPermiso(), DefaultLayout(), Caja(), abrirWhatsApp(), abrirWhatsAppResumen(), ClienteRow(), Clientes() (+26 more)

### Community 20 - "Etiquetas.jsx"
Cohesion: 0.19
Nodes (10): EditorPlantilla(), migrarCampos(), BarcodeScanner(), PRIMARY_HOVER, ToastCtx, chunk(), Etiquetas(), lsGet() (+2 more)

### Community 23 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 24 - "Movimientos.jsx"
Cohesion: 0.13
Nodes (12): ColSortHeader, colTh, PAGES, colTh, DataTable, SortIco, MOTIVOS_BAJA, RESUMEN_COLUMNS (+4 more)

### Community 25 - "useCajaQueries.js"
Cohesion: 0.32
Nodes (8): DEMO_MODE, CAJA_INIT, CajaProvider(), CajaCtx, useAbrirCaja(), useAgregarMovimientoCaja(), useCerrarCaja(), useTurnoActivo()

### Community 26 - "useHasPermiso.jsx"
Cohesion: 0.27
Nodes (6): PERMISOS_MAP, primeraRutaDisponible(), RUTAS_LANDING, OAuthCallback(), OAuthCallback, mockPermisos

### Community 27 - "brand.js"
Cohesion: 0.11
Nodes (14): AppLoading(), APP_NAME, APP_TAGLINE, APP_VERSION, CATALOGO_HABILITADO, LOGO_URL, LOGO_URL_DARK, POINT_HABILITADO (+6 more)

### Community 29 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, jsbarcode, dependencies, axios, jsbarcode, jspdf, jspdf

### Community 30 - "useOptimisticListMutation"
Cohesion: 0.17
Nodes (7): useOptimisticListMutation(), CLIENTES_KEYS, useActualizarCliente(), useEliminarCliente(), PROVEEDORES_KEYS, useActualizarProveedor(), useEliminarProveedor()

### Community 31 - "AuthContextBase.jsx"
Cohesion: 0.33
Nodes (6): http, App(), AuthContext, useTokenExpirationCheck(), AxiosInterceptor(), router

### Community 32 - "constants.js"
Cohesion: 0.11
Nodes (9): PAGE_SIZES, STALE_TIMES, categoriasService, clientesService, comprasService, mapCompra(), gruposTallesService, presupuestosService (+1 more)

### Community 33 - "EditorVisual.jsx"
Cohesion: 0.29
Nodes (7): ColorPickerPopover(), SWATCHES, ALIGNS, EditorVisual(), CAMPO_EJEMPLO, CAMPO_LABELS, CAMPOS_DEFAULT

### Community 34 - "Presupuestos.jsx"
Cohesion: 0.14
Nodes (17): ConfirmDialog, getPages(), PAGE_SIZES, TablePagination, ModalCliente(), ESTADO_COLORS, ESTADO_LABELS, PDF_BORDER (+9 more)

### Community 36 - "Architecture"
Cohesion: 0.15
Nodes (11): API / services layer, Architecture, Auth & permissions, Commands, Demo mode, Error reporting, graphify, Project overview (+3 more)

### Community 37 - "Facturas.jsx"
Cohesion: 0.22
Nodes (9): AyudaButton(), colTh, ESTADO_LABELS, cleanupActive(), hasTour(), listeners, onTourRegistered(), startTour() (+1 more)

### Community 40 - "usePresupuestosQueries.js"
Cohesion: 0.25
Nodes (5): PRESUPUESTOS_KEYS, useCrearPresupuesto(), useEliminarPresupuesto(), usePresupuesto(), usePresupuestos()

### Community 61 - "format.js"
Cohesion: 0.24
Nodes (11): matchProducto(), matchProveedor(), precioVentaSugerido(), comprimirImagen(), EscanearModal(), ImportarExcelModal(), escanearFacturaApi(), fmtDayLabel() (+3 more)

### Community 78 - "demoMode.js"
Cohesion: 0.33
Nodes (5): AuthProvider(), logoutApi(), DEMO_PERMISOS_CODIGOS, DEMO_TOKEN, DEMO_USER

### Community 80 - "Builds por cliente (white-label)"
Cohesion: 0.33
Nodes (5): Armar el build de un cliente, Builds por cliente (white-label), Estructura, Módulos opcionales por cliente ("este cliente quiere ver algo que otros no"), Qué es configurable hoy vía `.env`

### Community 81 - "React + Vite"
Cohesion: 0.40
Nodes (4): Expanding the ESLint configuration, front-Estudio-Juridico, React Compiler, React + Vite

### Community 83 - "useToast"
Cohesion: 0.15
Nodes (22): useAuth(), useProductos(), useToast(), usePlan(), TabCobros(), Compras(), ModalCompraPorCurva(), ModalDevolucionCompra() (+14 more)

### Community 86 - "Login.jsx"
Cohesion: 0.15
Nodes (19): forgotPasswordApi(), loginApi(), resetPasswordApi(), verificar2faApi(), ConfiguracionInicialModal(), expiresAtISO(), getAutofillFix(), getDotPattern() (+11 more)

### Community 87 - "main.jsx"
Cohesion: 0.24
Nodes (8): ToastProvider(), localStoragePersister, queryClient, applyVars(), SEMANTIC_PRESETS, THEME_PRESETS, ThemeContextProvider(), ThemeCtx

### Community 89 - "useNotificaciones.js"
Cohesion: 0.60
Nodes (3): useNotificaciones(), ALERT_SOUND_EVENT, playAlertSound()

## Knowledge Gaps
- **209 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useToast()` connect `useToast` to `Clientes.jsx`, `Sidebar.jsx`, `toLocalDateStr`, `Presupuestos.jsx`, `Dashboard.jsx`, `Facturas.jsx`, `Home.jsx`, `Caja.jsx`, `excelImport.js`, `Productos.jsx`, `ConfigModal.jsx`, `DefaultLayout.jsx`, `Compras.jsx`, `fmtMoney`, `Etiquetas.jsx`, `Login.jsx`, `Movimientos.jsx`, `AuthContextBase.jsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `fmtMoney()` connect `fmtMoney` to `Clientes.jsx`, `Sidebar.jsx`, `toLocalDateStr`, `Presupuestos.jsx`, `Dashboard.jsx`, `Facturas.jsx`, `Home.jsx`, `excelImport.js`, `Productos.jsx`, `DefaultLayout.jsx`, `Compras.jsx`, `useToast`, `Movimientos.jsx`, `format.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `PRIMARY_COLOR` connect `DefaultLayout.jsx` to `Clientes.jsx`, `Sidebar.jsx`, `Dashboard.jsx`, `Home.jsx`, `Caja.jsx`, `Productos.jsx`, `ConfigModal.jsx`, `tokens.js`, `Compras.jsx`, `Etiquetas.jsx`, `Movimientos.jsx`, `useHasPermiso.jsx`, `brand.js`, `EditorVisual.jsx`, `Presupuestos.jsx`, `Facturas.jsx`, `format.js`, `Login.jsx`, `main.jsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Clientes.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._
- **Should `Dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051418439716312055 - nodes in this community are weakly interconnected._
- **Should `Home.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07184325108853411 - nodes in this community are weakly interconnected._