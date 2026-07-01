# CLAUDE.md — MH Photo Booth Studio

## Propósito

Instrucciones permanentes para cualquier sesión de Claude Code o IA que trabaje en este proyecto.
Este archivo + `PROJECT_CONTEXT.md` son el punto de entrada obligatorio.

El proyecto es una app de escritorio **Windows** de cabina fotográfica (photo booth) para eventos.
Owner: **Miguel**. Primer uso objetivo: **Jardines Club Hípico** (branding configurable).
No incluir contexto personal innecesario en código, docs, commits, comentarios, logs, pruebas ni seeds.

---

## Regla crítica — leer SIEMPRE antes de tocar código

1. `PROJECT_CONTEXT.md` (fuente principal de transferencia)
2. `docs/ARCHITECTURE.md`
3. `docs/DATABASE.md`
4. `docs/FILE_MAP.md`
5. `docs/DECISIONS.md`
6. `docs/BUGS_PENDING.md`
7. `docs/NEXT_STEPS.md`
8. `docs/CHANGELOG.md`

Luego inspeccionar el estado real del código y detectar si la documentación quedó desactualizada o
contradice al código. Si está desactualizada, **actualizarla antes** de hacer cambios importantes.

> Docs de diseño original (referencia, no son la fuente viva): `docs/PROJECT_BRIEF.md`, `docs/PRD.md`,
> `docs/TECH_ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/ROADMAP.md`, `docs/TASKS.md`,
> y los `.md` por módulo (CAMERA_CAPTURE, TEMPLATE_ENGINE, TEMPLATE_EDITOR, PRINT_PIPELINE,
> QR_GALLERY, DESIGN_SYSTEM, UI_FLOWS, HARDWARE, RELEASE_PACKAGING, OFFLINE_MODE, ERROR_HANDLING,
> SECURITY_AND_LICENSE, POSE_SYSTEM, FILE_STORAGE, TESTING_CHECKLIST, USER_GUIDE).

---

## Documentación viva

Después de **cada cambio significativo**, actualizar la documentación correspondiente. Un cambio
significativo incluye:
- Crear, borrar o modificar archivos importantes.
- Cambiar arquitectura.
- Cambiar entidades, tablas, modelos, schemas o migraciones.
- Cambiar rutas, canales IPC, servicios o componentes principales.
- Resolver un bug / detectar un bug nuevo.
- Cambiar reglas de negocio o flujo de usuario.
- Cambiar configuración, variables de entorno o scripts.
- Agregar dependencias.
- Cambiar permisos, roles o seguridad.

Mapeo de actualización:
| Si cambió… | Actualiza |
|---|---|
| Cualquier cambio relevante | `PROJECT_CONTEXT.md` + `docs/CHANGELOG.md` |
| Arquitectura | `docs/ARCHITECTURE.md` |
| Entidades / tablas / migraciones | `docs/DATABASE.md` |
| Estructura/archivos importantes | `docs/FILE_MAP.md` |
| Decisión técnica/producto | `docs/DECISIONS.md` |
| Bug nuevo o resuelto | `docs/BUGS_PENDING.md` |
| Prioridades | `docs/NEXT_STEPS.md` |
| Un prompt funcionó bien | `docs/PROMPTS.md` |

---

## Regla de transferencia

`PROJECT_CONTEXT.md` es la fuente principal para transferir el proyecto a otra sesión, cuenta o IA.
Debe estar siempre actualizado, claro y accionable. No documentación decorativa: documentación útil
para que otra IA continúe sin pedir contexto.

## Regla anti-documentación muerta

No dejar documentación vieja. Si algo cambió, actualízalo. Si ya no aplica, márcalo como obsoleto o
elimínalo. La fuente viva es el set de transferencia (este archivo, `PROJECT_CONTEXT.md`, y los
`docs/{ARCHITECTURE,DATABASE,FILE_MAP,DECISIONS,BUGS_PENDING,NEXT_STEPS,CHANGELOG,PROMPTS}.md`).

## Regla de cierre

Antes de terminar cualquier sesión, responder con: **Cambios hechos · Archivos modificados ·
Documentación actualizada · Bugs pendientes · Próximo paso recomendado**, y el bloque "Estado de
documentación".

---

## Principios obligatorios (no romper)

1. **Local-first / offline-first.** Capturar, componer, guardar, imprimir y reimprimir SIN internet.
   Lo online es opcional. **Guardar SIEMPRE antes de imprimir.**
2. **Diseño profesional skeuomórfico** (fieltro verde + latón oro). Botones grandes; modo invitado sin
   controles de admin; modo evento sin pantallas técnicas. **Cero hex sueltos** → todo por tokens en
   `src/renderer/styles/tokens.css`.
3. **Arquitectura modular.** Separar cámara, plantillas, impresión, QR, almacenamiento, eventos,
   sesiones. No mezclar UI con motores centrales.
4. **Tolerancia a errores.** Errores traducidos a mensaje + acción concreta (`AppError` → `Result<T>`).
   No ocultar errores.
5. **Seguridad Electron.** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, IPC
   tipado, nav-guard, permisos solo media, renderer de producción por **`app://`** (no `file://`).
   Toda ventana nueva usa el mismo `webPreferences` seguro.
6. **Hardware por adaptadores.** Cámara e impresora vía adaptadores (mock si falta hardware). No
   acoplar a un modelo (DSLR/impresora) hasta confirmarlo.
7. **Rutas relativas al data root.** Sin rutas absolutas en código, sin credenciales, sin PII.
8. **Cambios pequeños y verificables.** Archivos no gigantes; TypeScript con tipos claros; servicios
   desacoplados; compatibilidad Windows.

---

## Stack

Electron 33 + electron-vite + Vite 5 · React 18 + TypeScript 5.6 (strict) · CommonJS · SQLite
(better-sqlite3; `node:sqlite` en tests) · Canvas para composición · `qrcode`/`adm-zip`/`image-size`
· ESLint 9 + Vitest 2. Detalle en `PROJECT_CONTEXT.md` §3 y `docs/ARCHITECTURE.md`.

---

## Verificación / empaque (cómo ver y validar cambios)

- **Gate por cambio:** `npm run typecheck && npm run lint && npm test && npm run build` (todos deben
  dar 0). Estado actual: 54 tests verdes.
- **Para que el cambio se VEA en la app instalada:** reconstruir el paquete y reinstalar — la app que
  abre el owner es el snapshot en `%LOCALAPPDATA%\Programs\MH Photo Booth Studio`, no el código fuente.
  Ver `docs/PROMPTS.md` y `docs/RELEASE_PACKAGING.md`.
- **Verificación headless:** smoke harness con `PBS_SMOKE_EXIT/PBS_SMOKE_SHOT/PBS_SMOKE_ROUTE/PBS_SMOKE_EVAL`
  + data root aislado con `PBS_DATA_ROOT` (no tocar los datos reales del owner).

---

## MVP profesional (referencia de alcance)

Crear/seleccionar evento → tipo de evento → fotos por sesión (2/3/4) → cargar plantilla PNG/JPG →
slots de foto + QR opcional → preview de cámara → instrucciones/poses → countdown → captura → tira/
diseño final → guardar originales y resultado → copias → imprimir → reimprimir desde historial →
funcionar offline. **Todo esto ya está implementado (v1.0.0).**

## No hacer en la primera etapa (post-base)

IA generativa de poses, nube obligatoria, reconocimiento facial, filtros avanzados, edición tipo
Photoshop, licenciamiento agresivo, pagos integrados, WhatsApp automático, dependencia de una DSLR
específica. Solo después de estabilizar y validar el producto base en evento real.

---

## Prioridad estratégica

Flujo confiable de evento real primero:
**Evento → Plantilla → Cámara → Countdown → Fotos → Composición → Guardado → Impresión → Reimpresión.**
Todo lo demás es secundario.
