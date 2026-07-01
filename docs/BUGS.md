# BUGS.md — Registro de Bugs

Este archivo registra errores encontrados, su estado y solución.

---

## Estados

- `open`
- `investigating`
- `fixed`
- `won't fix`
- `needs hardware test`
- `regression`

---

## Severidad

- `critical`: impide operar evento.
- `high`: rompe flujo importante.
- `medium`: afecta usabilidad o resultado.
- `low`: detalle menor.

---

## Plantilla de bug

```md
## BUG-000 — Título corto

### Estado
open

### Severidad
medium

### Módulo
Cámara / Plantillas / Impresión / UI / Base de datos / Archivos / Otro

### Descripción
Qué ocurre.

### Pasos para reproducir
1. ...
2. ...
3. ...

### Resultado esperado
Qué debería pasar.

### Resultado actual
Qué está pasando.

### Evidencia
Capturas, logs o notas.

### Hipótesis
Posible causa.

### Solución
Pendiente.

### Pruebas de cierre
- [ ] ...
```

---

## Bugs activos

No hay bugs activos.

---

## Bugs cerrados

## BUG-001 — Binario de Electron no se descargó en `npm install`

### Estado
fixed

### Severidad
low

### Módulo
Otro (tooling/entorno)

### Descripción
Tras `npm install`, `node_modules/electron` quedó sin `dist/electron.exe` y `path.txt`
vacío; `npx electron .` lanzaba "Electron failed to install correctly".

### Hipótesis
La caché de `@electron/get` tenía el zip correcto (v33.4.11) pero el paso de extracción
del `install.js` no copió el binario.

### Solución
Se extrajo el zip cacheado a `node_modules/electron/dist` y se fijó `path.txt=electron.exe`.
Es un problema de entorno; no afecta el código de la app. En Fase 10 el empaque usa el
binario vía electron-builder.

### Pruebas de cierre
- [x] `npx electron .` arranca (smoke boot exit 0, versión renderizada).

## BUG-002 — Hex sueltos en CSS de componentes

### Estado
fixed

### Severidad
low

### Módulo
UI

### Descripción
6 valores hex literales (gradiente danger del botón, color de texto de error) violaban
DESIGN_BRAND §9 ("cero hex sueltos").

### Solución
Se añadieron tokens `--danger-bright/-deep/-soft/-soft-dim` en `tokens.css` y se reemplazaron
los literales por `var(--...)`. Verificado con grep: 0 hex fuera de `tokens.css`.

### Pruebas de cierre
- [x] grep de hex en `src/renderer` (excluyendo tokens.css) → sin coincidencias.

## BUG-008 — Renderer en blanco en producción por CSP sobre file://

### Estado
fixed

### Severidad
critical

### Módulo
UI / Empaque

### Descripción
Con `isPackaged=true`, la CSP estricta (`script-src 'self'`) aplicada al renderer cargado por
`file://` bloqueaba los scripts del bundle (origen nulo no hace match con `'self'`), dejando la
ventana en blanco en la app instalada. No se notaba en dev (servidor Vite).

### Solución
Servir el renderer empaquetado por un protocolo propio `app://bundle/...`
(`registerSchemesAsPrivileged` + `protocol.handle`) con la CSP en las respuestas `app://`
(DEC-018). Verificado: la app empaquetada renderiza v1.0.0 + galería completa bajo CSP estricta.

### Pruebas de cierre
- [x] `npx electron .` (modo producción, app://) renderiza v1.0.0 y crea DB.
- [x] Galería renderiza bajo CSP (scripts/estilos/fuentes 'self' permitidos).
