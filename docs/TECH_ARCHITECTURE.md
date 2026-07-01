# TECH_ARCHITECTURE.md — Arquitectura Técnica

## Objetivo

Definir una arquitectura modular, mantenible y preparada para crecer.

---

## Stack base

- Electron
- React
- TypeScript
- SQLite
- Node.js para servicios locales
- Canvas/Sharp o equivalente para composición
- Librería local para QR
- Sistema de archivos local

---

## Arquitectura general

```txt
Electron App
│
├── Main Process
│   ├── App lifecycle
│   ├── File system
│   ├── SQLite
│   ├── Print service
│   ├── Native integrations
│   └── IPC handlers
│
├── Preload
│   ├── Safe API bridge
│   └── Typed IPC exposure
│
└── Renderer
    ├── React UI
    ├── Screens
    ├── Components
    ├── State management
    └── User flows
```

---

## Módulos principales

```txt
src/
  main/
    index.ts
    ipc/
    services/
      database/
      events/
      templates/
      camera/
      print/
      qr/
      storage/
      diagnostics/
  preload/
    index.ts
  renderer/
    App.tsx
    routes/
    screens/
    components/
    hooks/
    state/
    styles/
  shared/
    types/
    constants/
    schemas/
    utils/
```

---

## Servicios centrales

### EventService

Responsable de:

- crear eventos,
- actualizar eventos,
- seleccionar evento activo,
- consultar historial,
- resolver rutas de evento.

### TemplateService

Responsable de:

- importar plantillas,
- guardar metadatos,
- cargar `template.json`,
- validar slots,
- duplicar/exportar/importar plantillas.

### TemplateEngine

Responsable de:

- componer imagen final,
- aplicar slots,
- insertar fotos,
- insertar QR,
- exportar PNG/JPG,
- generar miniaturas.

### CameraService

Responsable de:

- listar cámaras,
- seleccionar cámara,
- iniciar preview,
- capturar foto,
- manejar adaptadores.

### PrintService

Responsable de:

- listar impresoras si es posible,
- configurar impresión,
- crear trabajos,
- mandar a imprimir,
- reintentar,
- registrar estado.

### PrintSheetBuilder

Responsable de:

- acomodar tiras en una hoja,
- duplicar copias,
- combinar varias sesiones,
- generar preview imprimible.

### QRService

Responsable de:

- validar links,
- generar QR,
- guardar QR por evento,
- preparar futura generación por sesión.

### StorageService

Responsable de:

- carpetas locales,
- nombres de archivo,
- escrituras seguras,
- exportación,
- backups.

### DiagnosticsService

Responsable de:

- estado de cámara,
- estado de almacenamiento,
- estado de impresora si es posible,
- logs,
- reporte exportable.

---

## Patrón de datos

La base SQLite guarda metadatos.

Los archivos reales se guardan en disco:

- fotos originales,
- imágenes finales,
- miniaturas,
- plantillas,
- exports.

La base no debe guardar archivos pesados como blob salvo caso excepcional.

---

## IPC en Electron

Evitar exponer Node directamente al renderer.

Usar preload con API segura:

```txt
window.photoBooth.events.create(...)
window.photoBooth.templates.import(...)
window.photoBooth.sessions.start(...)
window.photoBooth.print.printJob(...)
```

Cada llamada debe tener:
- tipos,
- validación,
- manejo de errores,
- respuesta estructurada.

---

## Manejo de errores

Cada servicio debe devolver errores entendibles.

Ejemplo:

```txt
{
  ok: false,
  code: "CAMERA_NOT_FOUND",
  message: "No se encontró la cámara seleccionada.",
  action: "Conecta la cámara o selecciona otra desde Configuración."
}
```

---

## Estado de la UI

La UI debe diferenciar:

- modo configuración,
- modo evento,
- modo invitado,
- modo historial,
- modo diagnóstico.

Evitar que el modo evento dependa de pantallas complejas.

---

## Reglas de arquitectura

- No mezclar lógica de composición con componentes React.
- No mezclar impresión con UI.
- No guardar rutas absolutas rígidas.
- No depender de internet para flujo base.
- No acoplar cámara a un único proveedor.
- No acoplar impresión a un tamaño único.
- No permitir que un error de impresión borre una sesión.
