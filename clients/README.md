# Builds por cliente (white-label)

Un solo código (`main`), un `.env` + logo distinto por cliente. Nada de ramas
por cliente — con el tiempo se desincronizan y cada arreglo hay que
repetirlo a mano en cada una.

## Estructura

```
clients/
  _template/          ← copiar esta carpeta para armar un cliente nuevo
    .env
    logo/
      logo-negro.png
      logo-blanco.png
  <nombre-cliente>/    ← una carpeta por cliente real, NO se sube a git
    .env
    logo/
      logo-negro.png
      logo-blanco.png
```

`clients/*` está en `.gitignore` salvo `_template/` y este README — los
`.env` y logos reales de cada cliente no se comparten en el repo (pueden
tener URLs de API, DSN de Sentry, o logos con derechos que no son para
publicar).

## Armar el build de un cliente

1. Si es la primera vez con ese cliente: copiar `clients/_template/` a
   `clients/<nombre-cliente>/` y completar el `.env` (nombre, eslogan, color,
   URL de API) y poner sus dos logos en `logo/`.
2. Copiar los archivos de ese cliente al lugar donde Vite los lee:
   ```
   cp clients/<nombre-cliente>/.env .env
   cp clients/<nombre-cliente>/logo/logo-negro.png  public/img/
   cp clients/<nombre-cliente>/logo/logo-blanco.png public/img/
   ```
3. Si el `.env` de ese cliente apunta `VITE_LOGO_URL`/`VITE_LOGO_URL_DARK` a
   esos mismos nombres de archivo, no hace falta tocar nada más — solo
   correr el build normal (`pnpm build`, o `npm run build-resources` desde
   `escritorio-launcher` para el instalador de escritorio).

## Qué es configurable hoy vía `.env`

Ver `.env.example` — nombre de la app, eslogan, nombre de empresa, color
primario, y las rutas del logo (`VITE_LOGO_URL`/`VITE_LOGO_URL_DARK`).

Todo lo demás (routing, permisos, lógica) es el mismo código para todos los
clientes — eso es a propósito, es lo que evita mantener N versiones del
sistema.
