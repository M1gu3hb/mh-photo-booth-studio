# CAMERA_CAPTURE.md — Captura de Cámara

## Objetivo

Diseñar un sistema de captura robusto y adaptable a distintos tipos de cámara.

---

## Estado del hardware

Modelo exacto de cámara pendiente.

El sistema debe soportar inicialmente una fuente genérica y preparar adaptadores para más opciones.

---

## Abstracción

Crear un servicio central:

```txt
CameraService
```

Interfaz conceptual:

```txt
listAvailableCameras()
selectCamera(cameraId)
startPreview()
stopPreview()
capturePhoto()
getStatus()
```

---

## Adaptadores posibles

### WebcamAdapter

Para cámaras USB o dispositivos detectados por el sistema.

### CaptureCardAdapter

Para cámaras conectadas por HDMI a capturadora, vista como webcam.

### DSLRAdapter

Para integración futura con cámara profesional por USB/SDK.

### WatchFolderAdapter

Para flujo donde otro software toma la foto y la app detecta el archivo nuevo en una carpeta.

---

## Flujo de captura

1. Validar cámara.
2. Mostrar preview.
3. Mostrar pose.
4. Iniciar countdown.
5. Flash visual.
6. Capturar foto.
7. Guardar original.
8. Confirmar foto.
9. Repetir hasta completar sesión.
10. Enviar fotos al motor de composición.

---

## Número de fotos

La app debe soportar:

- 2 fotos,
- 3 fotos,
- 4 fotos.

No hardcodear solo 3.

---

## Countdown

Configurable:

- 3 segundos,
- 5 segundos,
- personalizado.

Debe mostrar número grande y claro.

---

## Poses

Antes de cada foto, mostrar pose sugerida.

La pose puede depender de:

- tipo de evento,
- número de foto,
- pose pack seleccionado,
- configuración del evento.

---

## Guardado

Cada foto original debe guardarse inmediatamente después de captura.

No esperar hasta terminar toda la sesión para guardar.

---

## Retake

Soportar:

- repetir última foto,
- repetir foto específica,
- repetir sesión completa.

---

## Errores esperados

### CAMERA_NOT_FOUND

No se detectó la cámara seleccionada.

Acción:
- conectar cámara,
- elegir otra cámara,
- abrir diagnóstico.

### CAMERA_BUSY

La cámara está siendo usada por otro programa.

Acción:
- cerrar otras apps,
- reintentar.

### CAPTURE_FAILED

Falló la captura.

Acción:
- reintentar foto,
- revisar cámara,
- guardar log.

### PREVIEW_FAILED

No se pudo iniciar preview.

Acción:
- elegir otra cámara,
- revisar permisos.

---

## Criterios de éxito

- Preview estable.
- Captura consistente.
- Fotos guardadas.
- Retake funcional.
- Error de cámara no cierra la app.
- Sesión no se pierde por error de impresión.

---

## Futuro

- Integración DSLR por SDK.
- Control de exposición si el hardware lo permite.
- Disparo remoto.
- Ajuste de orientación.
- Live view mejorado.
- Filtros básicos.
