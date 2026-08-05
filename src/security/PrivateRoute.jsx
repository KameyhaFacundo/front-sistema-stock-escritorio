import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContextBase";
import useHasPermiso from "../hooks/useHasPermiso";
import { Alerta } from "../functions/alerts";

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
    return <div>Cargando...</div>;
  }

  if (!(show ? true : checkPermisos(allowedPermissions))) {
    // Si está logueado, lo mandamos al Dashboard en vez de a la landing
    // pública — es un destino dentro de la app que todo rol que puede
    // iniciar sesión tiene habilitado. Si ni siquiera tiene acceso al
    // Dashboard (caso raro), cae a "/" para no generar un loop de
    // redirección contra esta misma ruta.
    const destino = user && checkPermisos('verDashboard') ? '/dashboard' : '/';
    return <Navigate to={destino} replace />;
  }

  return children;
};

export default PrivateRoute;
