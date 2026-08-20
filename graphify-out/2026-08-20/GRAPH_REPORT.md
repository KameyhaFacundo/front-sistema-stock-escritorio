# Graph Report - front-sistema-stock  (2026-08-20)

## Corpus Check
- 187 files · ~534,204 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 982 nodes · 3016 edges · 93 communities (60 shown, 33 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36c3f43f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Clientes.jsx
- Sidebar.jsx
- Movimientos.jsx
- Proveedores.jsx
- Dashboard.jsx
- Home.jsx
- Lint & Test Tooling Deps
- Caja.jsx
- useProductosQueries.js
- src/routes.jsx
- Productos.jsx
- ConfigModal.jsx
- VentasContext.jsx
- PRIMARY_COLOR
- tokens.js
- client.js
- useLotesQueries.js
- demoData.js
- deudasService.js
- fmtMoney
- ToastContext.jsx
- ErrorBoundary.jsx
- Deudas Clientes Queries
- PWA Manifest
- DefaultLayout.jsx
- useCajaQueries.js
- useHasPermiso.jsx
- brand.js
- Sucursales Queries
- dependencies
- useProveedoresQueries.js
- AuthContextBase.jsx
- constants.js
- EditorPlantilla.jsx
- Facturas.jsx
- movimientosService.js
- Architecture
- useIsMobile
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
- AppContext.jsx
- Builds por cliente (white-label)
- React + Vite
- useToast
- Compras.jsx
- exceljs
- useClientesQueries.js
- guardarSesion
- ThemeContext.jsx
- ErrorBoundary
- DefaultLayout
- EtiquetaPreview.jsx
- productosService.js
- axios

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
- `ModalCompraPorCurva()` --calls--> `useToast()`  [EXTRACTED]
  src/pages/Compras/Compras.jsx → src/context/ToastContext.jsx
- `ModalEditarProveedor()` --calls--> `useToast()`  [EXTRACTED]
  src/pages/Proveedores/Proveedores.jsx → src/context/ToastContext.jsx
- `useActualizarCliente()` --calls--> `useOptimisticListMutation()`  [EXTRACTED]
  src/hooks/queries/useClientesQueries.js → src/hooks/queries/optimisticListMutation.js
- `useEliminarCliente()` --calls--> `useOptimisticListMutation()`  [EXTRACTED]
  src/hooks/queries/useClientesQueries.js → src/hooks/queries/optimisticListMutation.js
- `useActualizarProveedor()` --calls--> `useOptimisticListMutation()`  [EXTRACTED]
  src/hooks/queries/useProveedoresQueries.js → src/hooks/queries/optimisticListMutation.js

## Import Cycles
- None detected.

## Communities (93 total, 33 thin omitted)

### Community 0 - "Clientes.jsx"
Cohesion: 0.09
Nodes (31): ConfirmDialog, fieldSx, labelSx, PAYMENT_OPTIONS, DEUDA_COLORS, Clientes(), colTh, exportarCSVClientes() (+23 more)

### Community 1 - "Sidebar.jsx"
Cohesion: 0.14
Nodes (20): APP_NAME, useLogo(), buildMenuSections(), Sidebar(), SIDEBAR_COLLAPSED_STORAGE_KEY, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED, CatalogoPublico() (+12 more)

### Community 2 - "Movimientos.jsx"
Cohesion: 0.09
Nodes (33): CommandPalette, useMovimientos(), useTransferirStock(), useCrearPresupuesto(), useBusquedaProductos(), useDropdownKeyboardNav(), AutocompleteLineaProducto(), matchProducto() (+25 more)

### Community 3 - "Proveedores.jsx"
Cohesion: 0.10
Nodes (32): COMPANY_NAME, ModalActualizarPrecios(), ModalCategorias(), exportarCSVProveedores(), exportarPDFProveedores(), hexToRgb(), METODO_LABELS, ModalEditarProveedor() (+24 more)

### Community 4 - "Dashboard.jsx"
Cohesion: 0.09
Nodes (19): card, COL_TD, COL_TH, COMPRA_ESTADO_COLORS, COMPRA_ESTADO_LABELS, FORMAS_REINTEGRO, METODO_COLORS, METODO_LABELS (+11 more)

### Community 5 - "Home.jsx"
Cohesion: 0.06
Nodes (46): useApp(), useCaja(), CoreDataProviders(), useVentas(), useClientes(), useCrearCliente(), FACTURAS_KEYS, useFactura() (+38 more)

### Community 6 - "Lint & Test Tooling Deps"
Cohesion: 0.05
Nodes (43): eslint, @eslint/js, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, devDependencies (+35 more)

### Community 7 - "Caja.jsx"
Cohesion: 0.09
Nodes (28): AyudaButton(), aNumero(), CampoPrecio(), digitosAntesDe(), formatearDesdeTexto(), formatearDesdeValor(), posicionTrasNDigitos(), card (+20 more)

### Community 8 - "useProductosQueries.js"
Cohesion: 0.24
Nodes (9): ProductosProvider(), ProductosCtx, useOptimisticListMutation(), useCrearMovimiento(), PRODUCTOS_KEYS, useActualizarProducto(), useCrearProducto(), useEliminarProducto() (+1 more)

### Community 9 - "src/routes.jsx"
Cohesion: 0.09
Nodes (20): LegalLayout(), Caja, CatalogoPublico, Clientes, Compras, ConfirmarEmail, Dashboard, DefaultLayout (+12 more)

### Community 10 - "Productos.jsx"
Cohesion: 0.10
Nodes (18): useProductos(), useProductosPaginado(), useContainerWidth(), useDebouncedValue(), BarcodeScanner, generarCodigoInterno(), generarPdfInventario(), generarPdfListadoProductos() (+10 more)

### Community 11 - "ConfigModal.jsx"
Cohesion: 0.13
Nodes (12): WA_NUMBER, card, ConfigModal(), fieldSx, formFromEmpresa(), METODOS_ARQUEO, selectSx, TabNegocio() (+4 more)

### Community 12 - "VentasContext.jsx"
Cohesion: 0.19
Nodes (10): VentasProvider(), VentasCtx, MOVIMIENTOS_KEYS, DEFAULT_LIST_PARAMS, useCrearVenta(), useVentas(), VENTAS_KEYS, mapVenta() (+2 more)

### Community 13 - "PRIMARY_COLOR"
Cohesion: 0.14
Nodes (15): BarcodeScanner(), ColSortHeader, colTh, colTh, SortIco, PRIMARY_COLOR, PRIMARY_HOVER, chunk() (+7 more)

### Community 14 - "tokens.js"
Cohesion: 0.12
Nodes (24): colTh, ROL_COLORS, ERROR_DARK, GOLD, INFO, METHOD_COLORS, MONEY, ORANGE (+16 more)

### Community 15 - "client.js"
Cohesion: 0.17
Nodes (7): api, http, asistenteService, catalogoService, permisosService, sistemaService, tallesService

### Community 16 - "useLotesQueries.js"
Cohesion: 0.20
Nodes (3): LOTES_KEYS, useVencimientosProximos(), lotesService

### Community 17 - "demoData.js"
Cohesion: 0.16
Nodes (13): CATS, CLIENTES, DEMO_CAJA, DEMO_MOVIMIENTOS, DEMO_PRODUCTOS, DEMO_VENTAS, fecha(), generarVentasDemo() (+5 more)

### Community 19 - "fmtMoney"
Cohesion: 0.11
Nodes (34): PaymentModal, useEliminarPresupuesto(), usePresupuesto(), useHasPermiso(), Caja(), abrirWhatsApp(), abrirWhatsAppResumen(), ClienteRow() (+26 more)

### Community 20 - "ToastContext.jsx"
Cohesion: 0.32
Nodes (4): ToastCtx, ToastProvider(), localStoragePersister, queryClient

### Community 21 - "ErrorBoundary.jsx"
Cohesion: 0.40
Nodes (6): ErrorScreen(), RouteErrorElement(), CHUNK_ERROR_MESSAGES, isChunkLoadError(), reloadOnceForChunkError(), lazyWithRetry()

### Community 23 - "PWA Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 24 - "DefaultLayout.jsx"
Cohesion: 0.23
Nodes (12): AsistenteIA(), PAGES, FAQS, WA_MSG, ConfiguracionInicialModal(), SUCCESS, BORDER, CARD (+4 more)

### Community 25 - "useCajaQueries.js"
Cohesion: 0.28
Nodes (9): DEMO_MODE, CAJA_INIT, CajaProvider(), CajaCtx, CAJA_KEYS, useAbrirCaja(), useAgregarMovimientoCaja(), useCerrarCaja() (+1 more)

### Community 26 - "useHasPermiso.jsx"
Cohesion: 0.24
Nodes (7): PERMISOS_MAP, primeraRutaDisponible(), RUTAS_LANDING, OAuthCallback(), OAuthCallback, PrivateRoute(), mockPermisos

### Community 27 - "brand.js"
Cohesion: 0.18
Nodes (8): APP_TAGLINE, APP_VERSION, CATALOGO_HABILITADO, LOGO_URL_DARK, POINT_HABILITADO, SUPPORT_EMAIL, ACCENT_COLORS, DEFAULT_ACCENT

### Community 29 - "dependencies"
Cohesion: 0.29
Nodes (7): jsbarcode, dependencies, jsbarcode, jspdf, @tanstack/react-query-devtools, jspdf, @tanstack/react-query-devtools

### Community 30 - "useProveedoresQueries.js"
Cohesion: 0.20
Nodes (4): PROVEEDORES_KEYS, useActualizarProveedor(), useEliminarProveedor(), proveedoresService

### Community 31 - "AuthContextBase.jsx"
Cohesion: 0.22
Nodes (9): App(), AuthProvider(), AuthContext, logoutApi(), AppLoading(), LOGO_URL, useTokenExpirationCheck(), AxiosInterceptor() (+1 more)

### Community 32 - "constants.js"
Cohesion: 0.15
Nodes (7): PAGE_SIZES, STALE_TIMES, categoriasService, comprasService, mapCompra(), gruposTallesService, rolesService

### Community 33 - "EditorPlantilla.jsx"
Cohesion: 0.12
Nodes (14): ColorPickerPopover(), SWATCHES, EditorPlantilla(), ALIGNS, EditorVisual(), CAMPO_EJEMPLO, CAMPO_LABELS, CAMPOS_DEFAULT (+6 more)

### Community 34 - "Facturas.jsx"
Cohesion: 0.27
Nodes (6): getPages(), PAGE_SIZES, TablePagination, colTh, ESTADO_LABELS, INK2

### Community 36 - "Architecture"
Cohesion: 0.15
Nodes (11): API / services layer, Architecture, Auth & permissions, Commands, Demo mode, Error reporting, graphify, Project overview (+3 more)

### Community 37 - "useIsMobile"
Cohesion: 0.25
Nodes (7): DataTable, useSucursales(), ModalDetalleCompra(), ModalHistorialCompras(), ModalHistorialPrecios(), Usuarios(), useIsMobile()

### Community 40 - "usePresupuestosQueries.js"
Cohesion: 0.29
Nodes (3): PRESUPUESTOS_KEYS, usePresupuestos(), presupuestosService

### Community 61 - "format.js"
Cohesion: 0.60
Nodes (4): fmtDayLabel(), fmtInputDate(), fmtTime(), parseFechaLocal()

### Community 78 - "demoMode.js"
Cohesion: 0.24
Nodes (7): forgotPasswordApi(), resetPasswordApi(), DEMO_PERMISOS_CODIGOS, DEMO_TOKEN, DEMO_USER, ViewForgot(), ViewReset()

### Community 79 - "AppContext.jsx"
Cohesion: 0.20
Nodes (11): DEMO_DEUDAS, DEMO_FIADOS, AppProvider(), METODO_LABELS, AppCtx, DASHBOARD_KEYS, useDashboardStats(), usePrefetchDashboardStats() (+3 more)

### Community 80 - "Builds por cliente (white-label)"
Cohesion: 0.33
Nodes (5): Armar el build de un cliente, Builds por cliente (white-label), Estructura, Módulos opcionales por cliente ("este cliente quiere ver algo que otros no"), Qué es configurable hoy vía `.env`

### Community 81 - "React + Vite"
Cohesion: 0.40
Nodes (4): Expanding the ESLint configuration, front-Estudio-Juridico, React Compiler, React + Vite

### Community 82 - "useToast"
Cohesion: 0.20
Nodes (10): useToast(), ModalCambiarPassword(), ModalCambiarPin(), TabCatalogo(), TabCobros(), TabPerfil(), TabSeguridad(), TallesEditor() (+2 more)

### Community 83 - "Compras.jsx"
Cohesion: 0.13
Nodes (17): useAuth(), usePlan(), COLUMNS, ComparativaProveedoresChip(), Compras(), ESTADO_COLORS, ESTADOS, METODO_LABELS (+9 more)

### Community 85 - "useClientesQueries.js"
Cohesion: 0.25
Nodes (4): CLIENTES_KEYS, useActualizarCliente(), useEliminarCliente(), clientesService

### Community 86 - "guardarSesion"
Cohesion: 0.33
Nodes (7): loginApi(), verificar2faApi(), expiresAtISO(), guardarSesion(), rutaLandingTrasLogin(), View2FA(), ViewLogin()

### Community 87 - "ThemeContext.jsx"
Cohesion: 0.40
Nodes (5): applyVars(), SEMANTIC_PRESETS, THEME_PRESETS, ThemeContextProvider(), ThemeCtx

### Community 89 - "DefaultLayout"
Cohesion: 0.60
Nodes (3): useNotificaciones(), DefaultLayout(), playAlertSound()

## Knowledge Gaps
- **209 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useToast()` connect `useToast` to `Clientes.jsx`, `Sidebar.jsx`, `Movimientos.jsx`, `Proveedores.jsx`, `Dashboard.jsx`, `Home.jsx`, `Caja.jsx`, `Productos.jsx`, `ConfigModal.jsx`, `PRIMARY_COLOR`, `tokens.js`, `client.js`, `fmtMoney`, `ToastContext.jsx`, `DefaultLayout.jsx`, `AuthContextBase.jsx`, `EditorPlantilla.jsx`, `useIsMobile`, `Compras.jsx`, `DefaultLayout`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `fmtMoney()` connect `fmtMoney` to `Clientes.jsx`, `Sidebar.jsx`, `Movimientos.jsx`, `Facturas.jsx`, `Dashboard.jsx`, `useIsMobile`, `Home.jsx`, `Proveedores.jsx`, `Productos.jsx`, `PRIMARY_COLOR`, `Compras.jsx`, `DefaultLayout.jsx`, `DefaultLayout`, `format.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `PRIMARY_COLOR` connect `PRIMARY_COLOR` to `Clientes.jsx`, `EditorPlantilla.jsx`, `Facturas.jsx`, `Sidebar.jsx`, `Movimientos.jsx`, `Dashboard.jsx`, `Home.jsx`, `Caja.jsx`, `Proveedores.jsx`, `Productos.jsx`, `ConfigModal.jsx`, `tokens.js`, `Compras.jsx`, `ThemeContext.jsx`, `DefaultLayout.jsx`, `useHasPermiso.jsx`, `brand.js`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Clientes.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._
- **Should `Sidebar.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13793103448275862 - nodes in this community are weakly interconnected._
- **Should `Movimientos.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._