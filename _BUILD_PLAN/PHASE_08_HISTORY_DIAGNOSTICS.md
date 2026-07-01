# PHASE_08_HISTORY_DIAGNOSTICS.md — Historial, Diagnóstico & Sistema de Errores

## Objetivo
Trazabilidad completa (historial + reimpresión), soporte (diagnóstico) y robustez
(sistema unificado de errores) en toda la app.

## Depende de
Fases 0-7. Lee antes: `docs/ERROR_HANDLING.md`, `docs/UI_FLOWS.md (reimpresión,
diagnóstico)`, `docs/OFFLINE_MODE.md`, `docs/PRD.md §7-9`.

## En alcance
- **Historial**: sesiones por evento (miniaturas), abrir resultado final, abrir
  originales, **reimprimir** (usa Fase 7), **exportar sesión** `.zip`, **borrar con
  confirmación**/archivar (no borrado físico sin confirmar). Orden por fecha/hora.
- **DiagnosticsService**: estado de cámara, impresora (si es posible), almacenamiento,
  espacio en disco, rutas de datos, QR, últimos errores; **exportar** `diagnostics_<date>.zip`
  (logs+versión+config+estado hardware+últimos errores; sin fotos salvo elección).
- **Sistema unificado de errores** (`docs/ERROR_HANDLING.md`): objeto
  `{code,message,userMessage,action,severity,module,details,timestamp}`; mapeo a UI
  amigable (qué pasó / qué significa / qué hacer); **logs** por módulo
  (`app.log/errors.log/print.log/camera.log`). Nunca stack traces en modo evento.
- **Diagnóstico pre-evento** (`docs/UI_FLOWS.md`): revisar cámara/impresora/plantilla/
  carpeta/disco/QR + prueba de captura + prueba de impresión + **marcar evento listo**.
- Badge de **conectividad** (online/offline) **no alarmante**.

## Fuera de alcance
Sincronización a nube / galería online (Fase 11+).

## Datos & IPC
Lectura de `sessions/session_*/print_jobs`; logs en `logs/`. IPC: `history.list/open/
export/delete`, `diagnostics.run/export`, `events.markReady`.

## Pantallas / Componentes
Historial, Diagnóstico. `SessionThumbnail`, `ErrorState` usados de verdad.

## Notas de diseño
Historial tipo galería premium; diagnóstico tipo "checklist de tablero" skeuo con luces
de estado (verde/ámbar/rojo) + icono + texto. Confirmaciones claras antes de borrar.

## Flujo completo (anti-huérfano)
- Cada sesión/print job creado en fases previas **aparece** aquí y es **reutilizable**
  (abrir/ reimprimir/ exportar). Reimprimir desde aquí crea nuevo `print_jobs` (Fase 7).
- "Marcar evento listo" deja un estado real que el Dashboard refleja.
- Cambiar data root (Fase 2) se ve reflejado en Diagnóstico (rutas reales).
- Cada error real de la app pasa por el sistema unificado y queda en logs.

## Skills
`security-review` (logs sin secretos/datos personales), `review`.

## Criterio de salida (checklist)
- [ ] Ver/abrir/reimprimir/exportar/borrar(confirm) sesiones.
- [ ] Reiniciar app y todo persiste (historial intacto).
- [ ] Export de diagnóstico genera `.zip` con lo indicado.
- [ ] Errores de cámara/plantilla/impresión/archivos muestran mensaje+acción.
- [ ] Offline total: sin falsos errores de red; flujo completo sin internet.

## Audit Gate 8
Errores forzados con mocks verificados; offline verificado; anti-huérfano (acciones de
historial usan datos reales); logs sin datos personales. Registrar en `AUDIT_LOG.md`.
