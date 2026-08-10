import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutApi } from "./authServiceApi";
import { AuthContext } from "./AuthContextBase";
import api from "../api/client";

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};