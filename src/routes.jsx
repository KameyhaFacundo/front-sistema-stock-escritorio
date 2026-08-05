import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Outlet,
} from "react-router-dom";
import DefaultLayout from "./layout/DefaultLayout";
import lazyWithRetry from "./utils/lazyWithRetry";
import { AppProvider } from "./context/AppContext";
import CoreDataProviders from "./context/CoreDataProviders";
import RouteErrorElement from "./components/shared/RouteErrorElement";
import PrivateRoute from "./security/PrivateRoute";

const Landing      = lazyWithRetry(() => import("./pages/Landing/Landing"));
const Login        = lazyWithRetry(() => import("./pages/Login/Login"));
const Onboarding   = lazyWithRetry(() => import("./pages/Onboarding/Onboarding"));
const ConfirmarEmail = lazyWithRetry(() => import("./pages/ConfirmarEmail/ConfirmarEmail"));
const Bienvenida   = lazyWithRetry(() => import("./pages/Bienvenida/Bienvenida"));
const Dashboard    = lazyWithRetry(() => import("./pages/Dashboard/Dashboard"));
const Home         = lazyWithRetry(() => import("./pages/Home/Home"));
const Compras      = lazyWithRetry(() => import("./pages/Compras/Compras"));
const Proveedores  = lazyWithRetry(() => import("./pages/Proveedores/Proveedores"));
const Clientes     = lazyWithRetry(() => import("./pages/Clientes/Clientes"));
const Productos    = lazyWithRetry(() => import("./pages/Productos/Productos"));
const Movimientos  = lazyWithRetry(() => import("./pages/Movimientos/Movimientos"));
const Usuarios     = lazyWithRetry(() => import("./pages/Usuarios/Usuarios"));
const Caja         = lazyWithRetry(() => import("./pages/Caja/Caja"));
const Facturas     = lazyWithRetry(() => import("./pages/Facturas/Facturas"));
const NotFound     = lazyWithRetry(() => import("./pages/NotFound/NotFound"));
const CatalogoPublico = lazyWithRetry(() => import("./pages/Catalogo/CatalogoPublico"));
const OAuthCallback  = lazyWithRetry(() => import("./pages/Login/OAuthCallback"));
const Etiquetas      = lazyWithRetry(() => import("./pages/Etiquetas/Etiquetas"));
const Privacidad   = lazyWithRetry(() => import("./pages/Legal/Privacidad"));
const Terminos     = lazyWithRetry(() => import("./pages/Legal/Terminos"));

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<RouteErrorElement />}>
      <Route path="/"            element={<Landing />} />
      <Route path="/signin"      element={<Login />} />
      <Route path="/reset-password" element={<Login />} />
      <Route path="/confirmar-email" element={<ConfirmarEmail />} />
      <Route path="/onboarding"  element={<Onboarding />} />
      <Route path="/bienvenida"  element={<Bienvenida />} />
      <Route path="/catalogo/:slug" element={<CatalogoPublico />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/privacidad"  element={<Privacidad />} />
      <Route path="/terminos"    element={<Terminos />} />

      <Route element={<AppProvider><Outlet /></AppProvider>}>
        <Route element={<DefaultLayout />}>
          <Route element={<CoreDataProviders><Outlet /></CoreDataProviders>}>
            <Route path="/dashboard"    element={<PrivateRoute allowedPermissions="verDashboard"><Dashboard /></PrivateRoute>} />
            <Route path="/pos"          element={<PrivateRoute allowedPermissions="verPOS"><Home /></PrivateRoute>} />
            <Route path="/productos"    element={<PrivateRoute allowedPermissions="verProductos"><Productos /></PrivateRoute>} />
            <Route path="/movimientos"  element={<PrivateRoute allowedPermissions="verMovimientos"><Movimientos /></PrivateRoute>} />
            <Route path="/etiquetas"    element={<PrivateRoute allowedPermissions="verEtiquetas"><Etiquetas /></PrivateRoute>} />
            <Route path="/compras"      element={<PrivateRoute allowedPermissions="verCompras"><Compras /></PrivateRoute>} />
          </Route>
          <Route path="/proveedores"  element={<PrivateRoute allowedPermissions="verProveedores"><Proveedores /></PrivateRoute>} />
          <Route path="/clientes"     element={<PrivateRoute allowedPermissions="verClientes"><Clientes /></PrivateRoute>} />
          <Route path="/usuarios"     element={<PrivateRoute allowedPermissions="verUsuarios"><Usuarios /></PrivateRoute>} />
          <Route path="/caja"        element={<PrivateRoute allowedPermissions="verCaja"><Caja /></PrivateRoute>} />
          <Route path="/facturas"    element={<PrivateRoute allowedPermissions="verVentas"><Facturas /></PrivateRoute>} />
          <Route path="*"             element={<NotFound />} />
        </Route>
      </Route>
    </Route>
  )
);
