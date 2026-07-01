# PHASE_05_CAMERA_SESSION.md — Cámara & Sesión de Captura

## Objetivo
Flujo de captura robusto y agnóstico de hardware: una sesión completa de 2/3/4 fotos.

## Depende de
Fases 0-4. Lee antes: `docs/CAMERA_CAPTURE.md`, `docs/HARDWARE.md`,
`docs/POSE_SYSTEM.md`, `docs/UI_FLOWS.md §sesión`, `docs/ERROR_HANDLING.md (cámara)`.

## En alcance
- **CameraService** + **interfaz de adaptador** común
  (`listAvailableCameras/selectCamera/startPreview/stopPreview/capturePhoto/getStatus`).
- Adaptadores: **WebcamAdapter** (USB/getUserMedia) como primero y funcional;
  **WatchFolderAdapter** funcional (carpeta vigilada); **CaptureCardAdapter** (vía
  webcam) y **DSLRAdapter** como stubs con interfaz lista + **mock realista** etiquetado
  (`docs/HARDWARE.md`). No acoplar a un modelo.
- Listar / seleccionar / **probar** cámara (desde Configuración o diagnóstico).
- **Preview en vivo** (`CameraPreview` con marco de lente skeuo).
- **Countdown** configurable (3/5/custom), número gigante (`CountdownDisplay`).
- **Poses** del pack según `event_type` antes de cada foto (`PoseCard`).
- Capturar **2/3/4** según el evento; **guardar cada original de inmediato** (no esperar
  al final) en `originals/session_<id>/` + registrar `session_photos`.
- **Repetir** última foto, foto específica y sesión completa.
- Crear/actualizar `sessions` (status preparando→capturando→…); hooks de **sonido**
  (beep/shutter, respetan setting), **flash** visual.
- **Errores** `CAMERA_NOT_FOUND/CAMERA_BUSY/CAPTURE_FAILED/PREVIEW_FAILED` con
  mensaje+acción; nunca cerrar la app.

## Fuera de alcance
Composición final (Fase 6) e impresión (Fase 7). Aquí termina en "fotos capturadas y guardadas".

## Datos & IPC
`sessions`, `session_photos`. IPC: `camera.list/select/test/startPreview/capture/status`,
`sessions.start/savePhoto/retake/complete`. Validación + errores estructurados.

## Pantallas / Componentes
Sesión (vista operador: confirmar evento/cámara/plantilla/copias + Iniciar) y vista de
captura (countdown/pose/flash). `CameraPreview`, `CountdownDisplay`, `PoseCard` reales.

## Notas de diseño
Modo captura limpio y emocionante (lado invitado): pose grande, countdown gigante, flash;
operador con botones grandes (Repetir foto/sesión). Sin texto técnico.

## Flujo completo (anti-huérfano)
- Cada foto capturada **se guarda** al instante y **se referencia** en `session_photos`,
  y **alimenta** la composición (Fase 6). 
- La **pose** mostrada viene del pack del `event_type` (Fase 3) — conexión real.
- "Repetir foto" reemplaza el original correcto; "Repetir sesión" reinicia limpio.
- El **setting de sonido** (Fase 2) realmente activa/silencia beep/shutter aquí.
- Selección/test de cámara persiste y se ve en Diagnóstico (Fase 8).

## Skills
`emil-design-eng` (countdown/flash/microinteracción), `review`, `design:accessibility-review`.

## Criterio de salida (checklist)
- [ ] Completar sesiones de 2, 3 y 4 fotos.
- [ ] Originales guardados **al instante** en disco + DB.
- [ ] Repetir foto / repetir sesión funcionan.
- [ ] Desconectar cámara muestra error con acción y NO cierra la app.
- [ ] 20 capturas seguidas estables (con cámara real o mock).

## Audit Gate 5 (fase grande → verificación reforzada)
20 capturas estables; errores forzados con mock; anti-huérfano (foto→DB→engine).
Segunda pasada de revisión (`review`). Registrar en `AUDIT_LOG.md`.
