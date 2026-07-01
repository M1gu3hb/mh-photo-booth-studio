# ERROR_HANDLING.md — Manejo de Errores y Diagnóstico

## Objetivo

Evitar que errores técnicos rompan la operación durante eventos.

---

## Principio

El operador no necesita ver errores técnicos crudos.

Cada error debe responder:

1. Qué pasó.
2. Qué significa.
3. Qué hacer.

---

## Formato interno de error

```txt
code
message
userMessage
action
severity
module
details
timestamp
```

---

## Severidades

- critical: impide seguir operando.
- high: bloquea una función clave.
- medium: hay alternativa.
- low: detalle no crítico.

---

## Errores de cámara

### CAMERA_NOT_FOUND

Mensaje:
“No se encontró la cámara seleccionada.”

Acción:
“Conecta la cámara o selecciona otra desde Configuración.”

### CAMERA_BUSY

Mensaje:
“La cámara está siendo usada por otro programa.”

Acción:
“Cierra otras apps que usen cámara y reintenta.”

### CAPTURE_FAILED

Mensaje:
“No se pudo tomar la foto.”

Acción:
“Reintenta la foto o revisa la cámara.”

---

## Errores de plantilla

### TEMPLATE_FILE_MISSING

Mensaje:
“No se encontró el archivo de plantilla.”

Acción:
“Vuelve a cargar la plantilla o selecciona otra.”

### TEMPLATE_INVALID

Mensaje:
“La plantilla está incompleta.”

Acción:
“Revisa que tenga suficientes espacios para fotos.”

### SLOT_COUNT_MISMATCH

Mensaje:
“La plantilla no tiene suficientes espacios para esta sesión.”

Acción:
“Cambia el número de fotos o usa otra plantilla.”

---

## Errores de impresión

### PRINTER_NOT_SELECTED

Mensaje:
“No hay impresora seleccionada.”

Acción:
“Selecciona una impresora en Configuración.”

### PRINT_FAILED

Mensaje:
“No se pudo imprimir.”

Acción:
“La foto ya quedó guardada. Puedes reintentar desde Historial.”

### PRINT_SHEET_FAILED

Mensaje:
“No se pudo preparar la hoja de impresión.”

Acción:
“Revisa el tamaño de papel o imprime una tira individual.”

---

## Errores de archivos

### STORAGE_FULL

Mensaje:
“No hay espacio suficiente para guardar fotos.”

Acción:
“Libera espacio o cambia la carpeta de almacenamiento.”

### FILE_WRITE_FAILED

Mensaje:
“No se pudo guardar el archivo.”

Acción:
“Revisa permisos o cambia la carpeta de datos.”

---

## Logs

Guardar logs en:

```txt
PhotoBoothData/logs/
```

Archivos:

- app.log
- errors.log
- print.log
- camera.log

---

## Diagnóstico exportable

La app debe poder exportar:

- versión,
- sistema operativo,
- cámara seleccionada,
- impresora seleccionada,
- evento activo,
- rutas de datos,
- últimos errores,
- espacio en disco.

---

## Reglas

- No cerrar app por error recuperable.
- No borrar sesión por error de impresión.
- No ocultar errores críticos.
- No mostrar stack trace en modo evento.
- Sí guardar detalles técnicos en logs.
