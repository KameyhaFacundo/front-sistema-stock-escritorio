import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../auth/AuthContextBase";
import api from "../../api/client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { BG, INK, MUTED } from "../../theme/tokens";
import { APP_NAME, PRIMARY_COLOR } from "../../config/brand";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authCtx = useContext(AuthContext);
  const { setToken, setUser, setMyPermisos } = authCtx;

  useEffect(() => {
    const token = searchParams.get("token");
    const expiresIn = searchParams.get("expires_in");

    if (!token) {
      navigate("/signin?error=oauth_no_token", { replace: true });
      return;
    }

    localStorage.setItem("token", token);
    if (expiresIn) {
      localStorage.setItem(
        "expires_at",
        new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString()
      );
    }

    api.get('me')
      .then((res) => {
        const user = res.data.user;
        localStorage.setItem("user", JSON.stringify(user));
        // Ojo: solo los permisos directos (permisos_usuarios) — ver el
        // comentario en guardarSesion (Login.jsx), el backend nunca mira
        // los del rol al autorizar un request.
        const todos = user?.permisos?.map((p) => p.codigo?.toLowerCase()) || [];
        localStorage.setItem("permisos", JSON.stringify(todos));
        setMyPermisos(todos);
        setToken(token);
        setUser(user);
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("expires_at");
        navigate("/signin?error=oauth_failed", { replace: true });
      });
  }, []);

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <CircularProgress size={32} sx={{ color: PRIMARY_COLOR }} />
      <Typography sx={{ color: INK, fontWeight: 600, fontSize: 15 }}>
        {APP_NAME}
      </Typography>
      <Typography sx={{ color: MUTED, fontSize: 13 }}>
        Iniciando sesión...
      </Typography>
    </Box>
  );
}
