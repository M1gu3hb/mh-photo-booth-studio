# DECISIONS.md — Decisiones Técnicas y de Producto

Este archivo registra decisiones importantes. Cada decisión debe explicar contexto, decisión y consecuencia.

---

## DEC-001 — Aplicación de escritorio Windows

### Estado

Aceptada.

### Contexto

El software operará en eventos con cámara, computadora e impresora. Windows es el entorno más probable para compatibilidad con impresoras, cámaras y operadores.

### Decisión

Construir una aplicación de escritorio para Windows.

### Consecuencias

- Priorizar compatibilidad con Windows.
- Empaquetar como instalador o portable.
- Evitar depender de navegador externo.

---

## DEC-002 — Electron + React + TypeScript

### Estado

Aceptada provisionalmente.

### Contexto

Se necesita UI moderna, app de escritorio, acceso a archivos locales, posible impresión y facilidad de desarrollo con IA.

### Decisión

Usar Electron para escritorio, React para UI y TypeScript para seguridad de tipos.

### Consecuencias

- Separar main/preload/renderer.
- Definir IPC con tipos claros.
- Cuidar seguridad de Electron.

---

## DEC-003 — SQLite como base local

### Estado

Aceptada.

### Contexto

La app debe funcionar offline y guardar eventos, plantillas, sesiones, fotos e impresiones.

### Decisión

Usar SQLite para persistencia local.

### Consecuencias

- No depender de nube.
- Soportar backup/export local.
- Manejar migraciones de esquema.

---

## DEC-004 — Local-first/offline-first

### Estado

Aceptada.

### Contexto

En eventos puede fallar internet. La captura e impresión no deben depender de conexión.

### Decisión

Captura, composición, guardado, historial e impresión deben funcionar offline.

### Consecuencias

- Las funciones online serán opcionales.
- QR puede ser link manual.
- Subida a nube será posterior.

---

## DEC-005 — Plantillas PNG/JPG + JSON de slots

### Estado

Aceptada.

### Contexto

Se necesita personalización visual profesional sin construir desde el inicio un editor completo tipo Photoshop.

### Decisión

Soportar plantillas basadas en imagen de fondo y archivo JSON con slots de foto, QR y textos.

### Consecuencias

- Los diseños premium pueden hacerse fuera de la app.
- La app solo necesita ubicar zonas inicialmente.
- El editor avanzado puede crecer después.

---

## DEC-006 — Editor de slots primero

### Estado

Aceptada.

### Contexto

Un editor completo de capas puede consumir demasiado tiempo y complejidad.

### Decisión

Construir primero un editor de slots sobre imagen.

### Consecuencias

- Permite MVP profesional más rápido.
- Mantiene camino abierto a editor avanzado.
- Reduce riesgo inicial.

---

## DEC-007 — Cámara mediante adaptadores

### Estado

Aceptada.

### Contexto

El modelo exacto de cámara aún no está definido.

### Decisión

Crear `CameraService` con adaptadores intercambiables.

### Consecuencias

- Primera versión puede usar webcam/USB/capturadora.
- DSLR o SDK específico se integra después.
- Evitar acoplar la app a una marca.

---

## DEC-008 — Print Sheet Builder desde versión profesional inicial

### Estado

Aceptada.

### Contexto

Es importante ahorrar papel e imprimir varias tiras o sesiones en una misma hoja.

### Decisión

Incluir un módulo para acomodar una o varias composiciones en una hoja imprimible.

### Consecuencias

- La impresión se vuelve módulo serio.
- Requiere preview de impresión.
- Mejora el valor comercial del producto.

---

## DEC-009 — QR manual por evento primero

### Estado

Aceptada.

### Contexto

El QR es útil, pero una galería online completa no debe bloquear el MVP.

### Decisión

Iniciar con QR generado desde un link manual por evento.

### Consecuencias

- Funciona offline una vez configurado.
- Puede apuntar a Drive, web, galería, WhatsApp o Instagram.
- QR por sesión queda para fase avanzada.

---

## DEC-010 — No incluir contexto personal

### Estado

Aceptada.

### Contexto

La documentación debe contener solo información operativa del proyecto.

### Decisión

No incluir datos personales innecesarios. Usar únicamente “Miguel” como project owner y “Jardines Club Hípico” como primer uso objetivo.

### Consecuencias

- Documentación más limpia.
- Menos riesgo de privacidad.
- Más fácil volver el proyecto comercial.

---

## DEC-011 — Stack concreto confirmado (Fase 0)

### Estado

Aceptada.

### Contexto

`DEC-002` fijó Electron + React + TypeScript de forma provisional. La Fase 0 exige
elegir herramientas concretas, estables y compatibles con Windows y offline-first.

### Decisión

- **Bundler/dev:** `electron-vite` 2.x (Vite 5) con `@vitejs/plugin-react`.
- **Empaquetado:** `electron-builder` 25.x (instalador NSIS + portable, a fondo en Fase 10).
- **Lenguaje/UI:** TypeScript 5.6 estricto, React 18.
- **Lint:** ESLint 9 (flat config) + `typescript-eslint` 8 + `eslint-plugin-react-hooks`.
- **Tests:** Vitest 2.x.
- **Base de datos (Fase 2):** `better-sqlite3` (síncrono, ideal para main process).
- **Composición (Fase 6):** `sharp` (rápido, alta calidad, sin dependencia de navegador).
- **QR (Fase 6):** librería local `qrcode` (genera offline).
- El paquete raíz es **CommonJS** (sin `"type":"module"`): `electron-vite` emite main y
  preload en CJS y el preload con `sandbox:true` debe ser CJS. Configs ESM usan `.mjs`.

### Consecuencias

- Main/preload se compilan a CJS (`require`, `__dirname` válidos); renderer es ESM vía Vite.
- `better-sqlite3` y `sharp` son módulos nativos: se reconstruyen para Electron con
  `electron-builder install-app-deps` (se añade en Fase 2).
- Seguridad Electron: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`,
  `webSecurity:true`, CSP en producción y bloqueo de navegación externa.

---

## DEC-012 — Envoltura de resultado con error anidado

### Estado

Aceptada.

### Contexto

`docs/TECH_ARCHITECTURE.md` y `ERROR_HANDLING.md` describen un error plano
`{ ok:false, code, message, action }` de forma conceptual, además de un formato interno
más rico (`code, message, userMessage, action, severity, module, details, timestamp`).

### Decisión

Toda llamada IPC/servicio devuelve `Result<T> = { ok:true, data } | { ok:false, error }`,
donde `error` es el `AppErrorPayload` completo. Se prefiere el error **anidado** (no plano)
para discriminación de tipos limpia en TypeScript y para no perder `severity/module/details`.

### Consecuencias

- Un único contrato de error en toda la app; el renderer nunca ve stack traces.
- `AppError` (clase) se lanza en servicios; el wrapper IPC la convierte a `Result` `Err`.
- Cubre el QUÉ de `ERROR_HANDLING.md` (mismos campos), solo cambia la forma (CÓMO).

---

## DEC-013 — Selector de idioma no expuesto aún (anti-huérfano)

### Estado

Aceptada.

### Contexto

`PHASE_02` lista "idioma inicial" en Configuración, pero la app es solo en español
(multi-idioma está en backlog). Un selector que no cambia nada sería una función huérfana
(prohibido por `FLOW_COMPLETENESS.md`).

### Decisión

Se persiste `language='es'` por defecto en `settings` para el futuro, pero NO se expone un
selector de idioma en la UI hasta que exista i18n real que lo consuma.

### Consecuencias

- Configuración solo muestra controles con efecto real (data root, sonido, countdown, fullscreen).
- Cuando se agregue i18n, el setting ya existe y el selector se podrá exponer.

---

## DEC-014 — Migraciones embebidas como strings TS

### Estado

Aceptada.

### Contexto

`docs/DATABASE_SCHEMA.md` sugiere archivos `migrations/001_initial_schema.sql`. En un
build empaquetado (asar) la resolución de rutas a `.sql` es frágil.

### Decisión

Las migraciones se definen como strings en módulos TS (`migrations/001_initial_schema.ts`)
listados en `migrations/index.ts`. El runner usa `PRAGMA user_version` para idempotencia y
registra cada una en `schema_migrations`.

### Consecuencias

- Se empaquetan de forma confiable, sin lectura de archivos en runtime.
- Mismo QUÉ (esquema, versionado, idempotencia); cambia el formato de almacenamiento (CÓMO).

---

## DEC-015 — Abstracción de driver SQLite (`Db`) para testear sin ABI de Electron

### Estado

Aceptada.

### Contexto

`better-sqlite3` se compila para el ABI de Electron y no carga bajo el runtime Node de
Vitest. Aun así, `PHASE_02` exige "repos con tests unitarios verdes".

### Decisión

Repos y migraciones dependen de una interfaz mínima `Db` (exec/prepare/transaction/close).
Producción usa `openBetterSqlite`; los tests usan un adaptador `node:sqlite` (built-in de
Node 24). El mismo SQL corre en ambos. Todo SQL usa parámetros posicionales `?`.

### Consecuencias

- Tests reales de SQL/CRUD/migración/seed en Node, sin tocar el binario nativo.
- Instalación: `npm install --ignore-scripts && npm run rebuild` (better-sqlite3 no tiene
  prebuild para Node 24; se reconstruye para Electron con `electron-builder install-app-deps`).
- Data root por defecto: `Documents/PhotoBoothData`; override por `PBS_DATA_ROOT` (portable/tests).

---

## DEC-016 — Composición en Canvas (renderer), no sharp

### Estado

Aceptada.

### Contexto

`docs/TEMPLATE_ENGINE.md` permite "Canvas, Sharp o librería equivalente". `sharp` es un
módulo nativo (como better-sqlite3): añade complejidad de ABI/empaque y no carga en el
runtime de tests. El renderer ya usa Canvas para la captura.

### Decisión

La composición final se hace en el **renderer con Canvas** (`composeSession`): base + fotos
(con `computeDrawRect` por fit) + QR + textos, exportando PNG/JPG/miniatura. El main solo
**persiste** los bytes (`sessions.saveComposition`: archivos + `session_outputs` + paths).
El QR se genera en main con `qrcode` (puro JS) y se guarda + registra en `qr_links`.

### Consecuencias

- Sin dependencia nativa para imágenes; empaque más simple; offline total.
- La **matemática de fit** vive en `shared/lib/fit.ts` (pura, con tests unitarios).
- Reimpresión (Fase 8) usa el `final.png` ya guardado (no recompone).
- IPC: no hay `engine.compose` en main; el "engine" es el compositor del renderer + `saveComposition`.

---

## DEC-017 — Impresión: hoja en renderer, registro + adaptadores en main

### Estado

Aceptada.

### Contexto

La hoja de impresión (acomodo de tiras/sesiones) se arma con Canvas (como la composición),
pero registrar el trabajo y enviar a imprimir es responsabilidad del main. `migration_002`
añade a `print_jobs` las columnas `method`, `layout`, `orientation`, `sheet_sessions`.

### Decisión

- El renderer arma la **hoja** (`buildSheet` + `computeSheetCells` puro/testeado) y manda los
  bytes a `PrintService.print` (main), que **guarda la hoja ANTES de imprimir**, crea el
  `print_jobs` con TODAS las opciones, y ejecuta el adaptador.
- Adaptadores: `image` (exporta PNG a `exports/`, fiable y por defecto), `pdf` (printToPDF),
  `windows` (impresión del SO; requiere impresora). Inyectados en `PrintService` para poder
  testear el flujo de `print_jobs` sin Electron.
- Un fallo marca `status='failed'` (no borra archivos) y permite `retry`. Reimprimir = nuevo job.

### Consecuencias

- Anti-huérfano crítico cumplido: impresora/método/copias/papel/layout/orientación/sesiones
  quedan en `print_jobs` y se usan/ven (cola + reintento).
- `migration_002` corre idempotente sobre DBs v1 existentes (verificado live → v2).

---

## DEC-018 — Renderer en producción vía protocolo `app://` (no `file://`)

### Estado

Aceptada.

### Contexto

Con CSP estricta (`script-src 'self'`), un renderer cargado por `file://` tiene origen nulo
y el navegador NO hace match con `'self'` → bloquea los scripts del bundle → ventana en blanco
en la app **instalada** (`isPackaged=true`). El modo dev (servidor Vite) ocultaba el defecto.

### Decisión

La app empaquetada sirve el renderer desde un esquema propio `app://bundle/...`
(`registerSchemesAsPrivileged` + `protocol.handle` con `net.fetch`). Así `'self'` = `app://bundle`
y la CSP estricta (definida en las respuestas `app://`) permite scripts/estilos/fuentes del bundle.
Se eliminó la CSP por `onHeadersReceived` (no aplicaba a `app://`).

### Consecuencias

- La app empaquetada renderiza correctamente bajo CSP estricta (verificado: v1.0.0 + galería completa).
- `hardenNavigation` permite `app://` y la dev URL; bloquea el resto.
- BUG-008 (defecto que habría enviado ventana en blanco a usuarios instalados) corregido.

---

## DEC-019 — Bloqueo de entorno para construir el instalador (winCodeSign)

### Estado

Aceptada (bloqueo externo documentado, según `01_READ_FIRST §3`).

### Contexto

`electron-builder` (NSIS + portable) extrae `winCodeSign` con `7za -snld`, que requiere el
privilegio de **crear enlaces simbólicos** (los `.dylib` de macOS dentro del paquete). Esta
cuenta de Windows no es admin ni tiene "Modo desarrollador" → la extracción falla
("El cliente no dispone de un privilegio requerido"). Es un límite del entorno, no del código.

### Decisión

- La configuración `build` de electron-builder (NSIS + portable + icono + asarUnpack de
  better-sqlite3) queda **completa y lista**: `npm run package` genera instalador y portable en
  una máquina Windows con admin/Modo desarrollador (requisito estándar de electron-builder).
- Como prueba de ejecución sin entorno de desarrollo, se ensambló un **bundle portable**
  (Electron + `resources/app` + `node_modules` nativos) y se verificó que arranca a **v1.0.0**,
  crea su base de datos y renderiza (vía el runtime de Electron sobre su propio bundle, sin
  dependencias de desarrollo). El ejecutable renombrado copiado a mano presenta un comportamiento
  específico del sandbox (no reproducible por la vía soportada `electron-builder`).

### Consecuencias

- Criterio "instalable en Windows limpia": la app es empaquetable (config verificada) y el bundle
  corre standalone; la generación del .exe firmable está bloqueada por el privilegio de symlink del entorno.

---

## DEC-020 — Empaque verificado por ensamblado directo + instalador por usuario

Fecha: 2026-06-29

### Contexto

`electron-builder` no puede generar el instalador aquí porque la extracción de `winCodeSign`
(`7za -snld`) exige el privilegio de crear enlaces simbólicos (DEC-019). `@electron/packager`
tampoco funciona en este entorno: el sandbox interrumpe la descompresión en streaming del ZIP de
Electron (se detiene tras el primer archivo). Ambas vías chocan con límites del entorno, no del
producto.

### Decisión

Empaquetar por **ensamblado directo y determinista** desde el runtime ya extraído
(`node_modules/electron/dist`), sin descompresión de ZIP ni symlinks:

1. Copiar el runtime de Electron al destino (`fs.cpSync`, sin streaming-unzip).
2. Eliminar `default_app.asar` y crear `resources/app/` con `out/` + un `package.json` de runtime +
   el cierre de dependencias de producción del proceso main (better-sqlite3 nativo, adm-zip,
   image-size, qrcode y transitivos). Las dependencias del renderer ya van empacadas por Vite.
3. Renombrar `electron.exe` → `MH Photo Booth Studio.exe`.

Para la instalación se entrega un **instalador por usuario** (sin admin, modelo "User Installer"):
`Install.ps1` copia la app a `%LOCALAPPDATA%\Programs\MH Photo Booth Studio`, crea accesos directos
(Menú Inicio + Escritorio), registra la entrada de desinstalación en `HKCU` (aparece en
Configuración > Aplicaciones) y deja `Uninstall.ps1`. `Instalar.bat` lo lanza con doble clic.

### Verificación

- El `.exe` renombrado arranca **standalone** a v1.0.0 (smoke harness): footer v1.0.0, navegación a
  `/eventos`, y `events.list()` por IPC→SQLite devuelve `{ok:true}` → DB operativa.
- La app **instalada** arranca en `environment: production` (Electron 33.4.11); Diagnóstico detecta
  hardware real (2 impresoras, 18.5 GB libres, almacenamiento) y renderiza bajo CSP `app://`.
- Artefacto: `release/MH-Photo-Booth-Studio-1.0.0-win-x64-Installer.zip` (~130 MB) + carpeta
  portable `release/MH Photo Booth Studio-win32-x64/`.

### Consecuencias

- Criterio "1.0.0 instalable en Windows" **cumplido** por esta vía (instalador por usuario + portable,
  verificados y funcionales), sin requerir admin ni red.
- El instalador clásico `.exe` (NSIS, asistente + firma) sigue disponible vía `npm run package` en una
  máquina con admin/Modo desarrollador + red la primera vez (config lista, DEC-019). No es un bloqueo
  del producto.

---

## DEC-021 — Vista al público: ventana espejo con un solo motor de captura

Fecha: 2026-06-29

### Contexto

La vista al público (2º monitor) debe mostrar "la misma cámara en los dos lados" y permitir, en modo
automático, que el invitado inicie e imprima. Dos ventanas no pueden ser ambas el motor de captura
sin duplicar lógica y arriesgar doble captura del dispositivo.

### Decisión

- La ventana pública (`/publico`) es un **cliente de presentación + entrada**, no el motor.
- El **operador** (`SessionScreen`) sigue siendo el único motor de captura/compose/guardado/impresión
  (flujo intacto). Publica su estado en vivo (`live:state`) en cada cambio.
- La pública abre su **propia** vista de cámara (mismo dispositivo) para el reflejo y dibuja overlays
  según el estado recibido; en modo automático envía comandos (`live:command`: start/print/finalize)
  que el operador ejecuta con sus funciones existentes.
- Botonera = adaptador de **teclado** (Enter/Espacio = acción principal, P = imprimir), listo para
  hardware físico que emita esas teclas.
- Ventana gestionada en main (`publicWindow.ts`): se coloca en el monitor externo a pantalla completa
  si existe, con el mismo `webPreferences` seguro (contextIsolation/sandbox, sin nodeIntegration).

### Consecuencias

- Cero duplicación del flujo de captura; el operador ve en su pantalla lo mismo que el público.
- Si el dispositivo no permite dos lecturas simultáneas, la pública cae a cámara simulada pero los
  overlays de estado siguen funcionando.
- Las plantillas de impresión por evento (DEC-020) alimentan el acomodo de la hoja también en el
  flujo automático.
