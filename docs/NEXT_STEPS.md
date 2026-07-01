# NEXT_STEPS.md

> Acciones siguientes priorizadas. Actualizar cuando cambien prioridades.

## Urgente
- **Configurar la conexión web en la app instalada:** sección "Página web" → URL
  `https://website-flame-rho-35.vercel.app` + la clave API (el owner la tiene; también está en el
  proyecto de Vercel como `UPLOAD_API_KEY`). Probar conexión.
- **Subir el repo del software** (`mh-photo-booth-studio`) cuando el owner lo pida — los cambios de
  Fase 17 están solo en local por instrucción del owner.

## Importante
1. **Validar en evento real con hardware definitivo:** cámara (¿DSLR/webcam?) e impresora
   (¿sublimación?). Confirmar tamaños de hoja reales vs `PAPER_SIZES` y ajustar.
2. **Instalador NSIS firmado:** correr `npm run package` en una máquina Windows con admin/Modo
   desarrollador + red la primera vez para emitir el `.exe` con asistente (LIM-1 / DEC-019).
3. **Probar vista al público en 2 monitores físicos** y validar el modo automático con la botonera
   real (teclas Enter/Espacio/P). Confirmar el caso de cámara dual (LIM-2 / DEC-021).
4. **Validar impresión compacta en papel real** (8-up = 4×2, plantillas de impresión por evento) y
   afinar márgenes/gaps según la impresora.

## Después
1. Vincular "crear plantilla de impresión" al alta/edición de evento (hoy se crea desde `/impresion`).
2. QR por sesión (no solo por evento).
3. Mensajería/recordatorios de mantenimiento del data root (espacio, backups).
4. Consolidar docs de diseño antiguos como "histórico" para evitar duplicidad con los de transferencia.

## Ideas futuras (post-base, ver CLAUDE.md "No hacer en la primera etapa")
- Galería online / subida a nube opcional.
- IA de poses, filtros, editor avanzado de capas.
- Multi-idioma, branding multi-cliente más rico, pantalla secundaria avanzada.

## Cómo continuar (mecánica)
1. Leer `CLAUDE.md` + `PROJECT_CONTEXT.md` + docs de transferencia.
2. `npm install` (si node_modules falta) y verificar gate: `npm run typecheck && npm run lint && npm test && npm run build`.
3. Hacer el cambio (pequeño y verificable) + actualizar docs vivos.
4. Para ver el cambio en la app instalada: reconstruir el paquete + reinstalar (ver `docs/PROMPTS.md`).
