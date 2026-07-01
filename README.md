# MH Photo Booth Studio — Context Pack

Este paquete contiene los documentos base para iniciar el desarrollo de **MH Photo Booth Studio** con Claude Code u otro asistente de programación.

El objetivo es construir una aplicación profesional de cabina fotográfica para Windows, pensada para eventos como XV años, bodas, bautizos, graduaciones, fiestas privadas y eventos corporativos.

Primer uso objetivo: **Jardines Club Hípico**.  
Project owner: **Miguel**.

---

## Cómo usar este paquete

1. Crear un nuevo repositorio/proyecto.
2. Copiar `CLAUDE.md` en la raíz del proyecto.
3. Copiar la carpeta `docs/` en la raíz.
4. Abrir el proyecto en Claude Code.
5. Pedirle a Claude que lea primero:
   - `CLAUDE.md`
   - `docs/PROJECT_BRIEF.md`
   - `docs/PRD.md`
   - `docs/TECH_ARCHITECTURE.md`
   - `docs/ROADMAP.md`
   - `docs/TASKS.md`

---

## Estructura

```txt
CLAUDE.md
README.md
docs/
  PROJECT_BRIEF.md
  PRD.md
  ROADMAP.md
  TASKS.md
  DECISIONS.md
  BUGS.md
  CHANGELOG.md
  TESTING_CHECKLIST.md
  HARDWARE.md
  TECH_ARCHITECTURE.md
  DATABASE_SCHEMA.md
  FILE_STORAGE.md
  UI_FLOWS.md
  DESIGN_SYSTEM.md
  CAMERA_CAPTURE.md
  TEMPLATE_ENGINE.md
  TEMPLATE_EDITOR.md
  PRINT_PIPELINE.md
  QR_GALLERY.md
  POSE_SYSTEM.md
  OFFLINE_MODE.md
  ERROR_HANDLING.md
  SECURITY_AND_LICENSE.md
  RELEASE_PACKAGING.md
```

---

## Visión resumida

La app debe permitir:

- Crear eventos.
- Cargar o diseñar plantillas.
- Configurar número de fotos: 2, 3 o 4.
- Mostrar instrucciones y poses.
- Tomar fotos con cuenta regresiva.
- Armar automáticamente una tira o composición final.
- Guardar originales y resultado.
- Imprimir al momento.
- Reimprimir sesiones anteriores.
- Agregar QR opcional.
- Funcionar offline.

---

## Regla de privacidad

No agregar contexto personal innecesario en la documentación, código, commits, logs o datos semilla. Usar únicamente la información operativa necesaria del proyecto.
