import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "./authServiceApi";
import { AuthContext } from "./AuthContextBase";
import api from "../api/client";
import { superAdminService } from "../services/superAdminService";
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "../layout/sidebarConstants";

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [myPermisos, setMyPermisos] = useState(() => {
    const stored = localStorage.getItem("permisos");
    return stored ? JSON.parse(stored) : [];
  });
  const [sidebarShow, setSidebarShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem("impersonator_token"));
  const [impersonandoEmpresa, setImpersonandoEmpresa] = useState(() => {
    const stored = localStorage.getItem("impersonando_empresa");
    return stored || null;
  });

  const recargarPermisos = useCallback(async () => {
    try {
      const res = await api.get('me');
      if (res.data?.user) {
        const fresh = res.data.user;
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      }
      if (res.data?.permisos) {
        const permisos = res.data.permisos.map(p => p.codigo?.toLowerCase()).filter(Boolean);
        setMyPermisos(permisos);
        localStorage.setItem('permisos', JSON.stringify(permisos));
      }
    } catch (e) {
      console.error('No se pudo recargar los permisos', e);
    }
  }, []);

  // "permisos" en localStorage se escribe una sola vez, en el login, y nunca
  // se vuelve a tocar solo (recargarPermisos es manual — hoy solo lo dispara
  // el propio usuario editando sus permisos desde Usuarios). Si por lo que
  // sea esa copia queda vieja respecto de lo que el backend tiene guardado
  // (ej. se restauró un backup de otro momento, o algo se asignó por fuera de
  // la app), la única forma de que se corrija sola era antes cerrar sesión y
  // volver a entrar — un botón/campo se veía "sin permiso" para siempre sin
  // ninguna pista de por qué. Un refresco silencioso al abrir la app (una vez,
  // best-effort, no bloquea nada si falla) evita que esto quede pegado.
  useEffect(() => {
    if (token) recargarPermisos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchSucursal = useCallback(async (idSucursal) => {
    const res = await api.post('me/sucursal', { id_sucursal: idSucursal });
    if (res.data?.user) {
      const fresh = res.data.user;
      setUser(fresh);
      localStorage.setItem('user', JSON.stringify(fresh));
    }
    if (res.data?.permisos) {
      const permisos = res.data.permisos.map(p => p.codigo?.toLowerCase()).filter(Boolean);
      setMyPermisos(permisos);
      localStorage.setItem('permisos', JSON.stringify(permisos));
    }
    // El stock, la caja y los movimientos dependen de la sucursal activa —
    // invalidar sus queries para que se vuelvan a pedir con la nueva.
    queryClient.invalidateQueries({ queryKey: ['productos'] });
    queryClient.invalidateQueries({ queryKey: ['caja'] });
    queryClient.invalidateQueries({ queryKey: ['movimientos'] });
    queryClient.invalidateQueries({ queryKey: ['ventas'] });
  }, [queryClient]);

  const logout = async () => {
    await logoutApi();
    setToken(null);
    setUser(null);
    setMyPermisos([]);
    setLoading(false);
    window.location.href = "/signin";
  };

  // "Entrar como" — el super admin toma la sesión de un usuario de la empresa
  // para dar soporte sin pedirle la contraseña al cliente. Guarda su propia
  // sesión aparte para poder volver con volverDeImpersonar().
  const impersonarEmpresa = useCallback(async (empresaId, empresaNombre, idUsuario) => {
    const res = await superAdminService.impersonar(empresaId, idUsuario);

    localStorage.setItem("impersonator_token", localStorage.getItem("token") || "");
    localStorage.setItem("impersonator_user", localStorage.getItem("user") || "");
    localStorage.setItem("impersonator_permisos", localStorage.getItem("permisos") || "");
    localStorage.setItem("impersonator_expires_at", localStorage.getItem("expires_at") || "");
    localStorage.setItem("impersonando_empresa", empresaNombre || res.impersonando?.empresa || "");

    localStorage.setItem("token", res.access_token);
    localStorage.setItem("expires_at", new Date(Date.now() + res.expires_in * 1000).toISOString());
    localStorage.setItem("user", JSON.stringify(res.user));
    const permisos = (res.permisos || []).map(p => p.codigo?.toLowerCase()).filter(Boolean);
    localStorage.setItem("permisos", JSON.stringify(permisos));
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "false");

    setMyPermisos(permisos);
    setToken(res.access_token);
    setUser(res.user);
    setIsImpersonating(true);
    setImpersonandoEmpresa(empresaNombre || res.impersonando?.empresa || null);
    queryClient.clear();
    window.location.href = "/dashboard";
  }, [queryClient]);

  const volverDeImpersonar = useCallback(() => {
    const origToken = localStorage.getItem("impersonator_token");
    if (!origToken) return;

    localStorage.setItem("token", origToken);
    localStorage.setItem("user", localStorage.getItem("impersonator_user") || "");
    localStorage.setItem("permisos", localStorage.getItem("impersonator_permisos") || "");
    localStorage.setItem("expires_at", localStorage.getItem("impersonator_expires_at") || "");
    localStorage.removeItem("impersonator_token");
    localStorage.removeItem("impersonator_user");
    localStorage.removeItem("impersonator_permisos");
    localStorage.removeItem("impersonator_expires_at");
    localStorage.removeItem("impersonando_empresa");

    setIsImpersonating(false);
    setImpersonandoEmpresa(null);
    queryClient.clear();
    window.location.href = "/super-admin";
  }, [queryClient]);

  function getUser() {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        user,
        getUser,
        setUser,
        loading,
        logout,
        sidebarShow,
        setSidebarShow,
        myPermisos,
        setMyPermisos,
        recargarPermisos,
        switchSucursal,
        isImpersonating,
        impersonandoEmpresa,
        impersonarEmpresa,
        volverDeImpersonar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};