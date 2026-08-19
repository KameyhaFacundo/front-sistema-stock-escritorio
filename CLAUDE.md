# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Front-end (React 19 + Vite) for **Kamex Solutions**, a white-label, multi-tenant inventory/POS management SPA. UI text and code comments are in Spanish. It talks to a separate Laravel backend (`back-sistema-stock`, sibling repo) via a REST API — permission codes, routes, and Sentry DSN pairing must stay in sync with that repo (see references to `PermisoSeeder.php` / `routes/api.php` in comments).

White-labeling: brand name, tagline, logo and primary color are all read from `VITE_*` env vars (`src/config/brand.js`) and baked in per client at build time — one build per deployment, not a runtime setting. Copy `.env.example` to `.env` to configure locally.

## Commands

- `pnpm dev` — start Vite dev server
- `pnpm build` — production build (adds brotli/gzip compression via `vite-plugin-compression`)
- `pnpm lint` — ESLint (flat config, `eslint.config.js`)
- `pnpm test` — run the full Vitest suite once
- `pnpm test:watch` — Vitest in watch mode
- Single test file: `pnpm vitest run src/test/format.test.jsx`
- Single test by name: `pnpm vitest run -t "nombre del test"`

Package manager is **pnpm** (pinned in `package.json`); don't use npm/yarn lockfiles.

Tests live under `src/test/` (not co-located with source), target `src/utils/*` and a few hooks, and run against `jsdom` with `src/test/setup.js` as the Vitest setup file.

## Architecture

### Routing & code splitting
`src/routes.jsx` defines a single `createBrowserRouter` tree. Every page is lazy-loaded via `src/utils/lazyWithRetry.js` (retries the dynamic import once on chunk-load failure, e.g. after a new deploy invalidates old chunk URLs). Route nesting encodes where providers attach:

```
<AppProvider>                     // global app state (caja resumen, fiados, etc.)
  <DefaultLayout>                 // sidebar/topbar chrome, theme toggle
    <CoreDataProviders>           // Productos + Ventas context — only POS-heavy routes
      /dashboard /pos /productos /movimientos /compras
    </CoreDataProviders>
    /proveedores /clientes /usuarios /caja /super-admin  // no CoreDataProviders
  </DefaultLayout>
</AppProvider>
```
`/`, `/signin`, `/onboarding`, `/planes`, `/pago/*`, `/catalogo/:slug`, `/privacidad`, `/terminos` sit outside all of this (public/pre-auth pages).

### State management — three layers, don't mix them up
- **Server state** → TanStack Query, one hook file per domain in `src/hooks/queries/` (`useProductosQueries.js`, `useCajaQueries.js`, ...). `src/hooks/queries/optimisticListMutation.js` is a shared helper for optimistic list mutations.
- **Cross-cutting app state** → React Context in `src/context/` and `src/auth/`. Each context is split into `XContextBase.jsx` (just `createContext` + the `useX` hook) and `XContext.jsx` (the `Provider` component). This split exists so the hook can be imported without pulling in the provider implementation (avoids Fast Refresh/circular-import issues) — follow the same pattern for new contexts.
- **Local UI state** → plain `useState`/`useReducer` in components.

Query invalidation on sucursal switch (`AuthContext.switchSucursal`) is the pattern to follow whenever data is scoped to the active branch: invalidate `['productos']`, `['caja']`, `['movimientos']`, `['ventas']` query keys.

### API / services layer
`src/api/client.js` is a thin wrapper over the global `axios` instance (prefixes every call with `VITE_API_URL`) so interceptor registration stays centralized. Each domain in `src/services/*.js` wraps `api` and maps the Laravel response shape (snake_case, nested `data.data`, paginated envelopes) into a camelCase view model consumed by the UI — see `mapProducto` in `productosService.js` as the reference pattern. Always go through a service; don't call `api` directly from components.

`src/interceptors/Axios.interceptor.jsx` (mounted once in `App.jsx`) is where all cross-cutting HTTP behavior lives:
- attaches `Authorization: Bearer` from `localStorage.token` (skipped for login/signin requests)
- on `401` (excluding login/logout/register), triggers a deduplicated logout and returns a never-resolving promise so callers' `.catch()` never fires a stray error toast
- on `403` with `trial_expired`, shows a blocking "choose a plan" modal (suppressed on `/planes` itself)
- shows a "sin conexión" toast when there's no `error.response` at all

### Auth & permissions
`src/auth/AuthContext.jsx` persists `token`/`user`/`permisos` in `localStorage` and exposes them via `AuthContextBase`. Two multi-tenant features live here:
- **Sucursal switching** (`switchSucursal`) — swaps the active branch and invalidates branch-scoped queries.
- **Impersonation** (`impersonarEmpresa` / `volverDeImpersonar`) — super-admin "log in as" a tenant's user; stashes the admin's own session under `impersonator_*` keys to restore it later. `ImpersonationBanner` (mounted in `App.jsx`) reflects this state.

`src/hooks/useHasPermiso.jsx` maps short frontend-friendly permission names (`PERMISOS_MAP`) to the backend's real permission codes — these must match the Laravel `PermisoSeeder`. `is_super_admin` intentionally does **not** bypass this check for normal routes (only the backend's `/super-admin` routes honor it) — don't "fix" the sidebar by short-circuiting on it. Route guarding is `src/security/PrivateRoute.jsx`.

### Demo mode
`src/auth/demoMode.js` (`VITE_DEMO_MODE=true`) fakes a fully-permissioned admin user (`DEMO_USER`, `DEMO_PERMISOS_CODIGOS`) so the app can run without a backend, e.g. for sales demos. The Axios interceptor's error handling is bypassed under demo mode. Keep `DEMO_PERMISOS_CODIGOS` in sync with `PERMISOS_MAP` in `useHasPermiso.jsx` whenever a new permission is added.

### Theming
CSS-variable-based dark/light theme — see `src/theme/ThemeContext.jsx` (`useAppTheme()`) and `src/theme/tokens.js`. Always import colors from `tokens.js`; never hardcode hex values in components, or they won't react to the theme toggle. (Full details in project memory `theme-system`.)

### Error reporting
`src/sentry.js` initializes Sentry only if `VITE_SENTRY_DSN` is set (no-op otherwise, safe for local dev). `ErrorBoundary` (`src/components/shared/ErrorBoundary.jsx`) wraps the whole app in `App.jsx`. User-facing alerts/confirmations go through the SweetAlert2 wrapper in `src/functions/alerts.js` (`Alerta()` builder), not raw `window.alert`/`window.confirm`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
