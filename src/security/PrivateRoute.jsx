import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContextBase";
import useHasPermiso, { primeraRutaDisponible } from "../hooks/useHasPermiso";
import { Alerta } from "../functions/alerts";
import AppLoading from "../components/shared/AppLoading";

const PrivateRoute = ({ children, allowedPermissions, show }) => {
  const { user, loading } = useContext(AuthContext);
  const { checkPermisos } = useHasPermiso();

  useEffect(() => {
    if (!loading && user) {
      if (show ? false : !checkPermisos(allowedPermissions)) {
        Alerta()
          .withMini(true)
          .withTipo("error")
          .withTitulo("Acceso Denegado")
          .withMensaje("No tiene permiso para realizar esta acción")
          .build();
      }
    }
  }, [allowedPermissions, show, checkPermisos, user, loading]);

  if (loading) {
    return <AppLoading />;
  }

  if (!(show ? true : checkPermisos(allowedPermissions))) {
    // Si está logueado, lo mandamos a la primera pantalla dentro de la app
    // a la que SÍ tiene acceso (no siempre es el Dashboard — el rol
    // "usuario" no lo tiene, ver primeraRutaDisponible). Si no está
    // logueado, o ningún permiso le abre nada, cae a "/" para no generar un
    // loop de redirección contra esta misma ruta.
    const destino = user ? primeraRutaDisponible(checkPermisos) : '/';
    return <Navigate to={destino} replace />;
  }

  return children;
};

export default PrivateRoute;
