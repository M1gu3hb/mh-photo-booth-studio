# FLOW_COMPLETENESS.md — Regla Anti-Funciones-Huérfanas

**Principio:** ninguna función vive sola. Si existe, es porque (a) algo la **provoca**
(causa/upstream) y (b) **produce una consecuencia** que se **persiste** y/o se **muestra**
(downstream). Una función sin consecuencia trazable es un bug de diseño, no una feature.

### El ejemplo guía (del dueño del producto)
> "Si en un punto de venta puedes elegir método de pago, es porque ese método **se
> registra**: queda guardado cuál se usó. Si das a elegir método de pago pero en ningún
> lado queda registrado cuál fue, la función no sirve."

Aplica ese mismo razonamiento a CADA control de esta app.

---

## El contrato de 4 preguntas (úsalo en cada función)

Antes de marcar una función como terminada, todas deben tener respuesta concreta:

1. **Causa (upstream):** ¿qué pantalla/acción/estado la habilita o la dispara?
2. **Consumo (downstream):** ¿qué módulo usa su resultado?
3. **Persistencia:** ¿en qué tabla/archivo queda registrada (con qué campos)?
4. **Visibilidad:** ¿en qué pantalla el usuario vuelve a ver/usar esa consecuencia?

Si alguna queda en "ninguno/ningún lado", **el flujo está incompleto**: complétalo o
no expongas la función.

---

## Mapa de consecuencias (núcleo de la app)

| Función / Control | Causa (upstream) | Consecuencia / Consumo (downstream) | Persistencia | Se ve / reutiliza en |
|---|---|---|---|---|
| Elegir **tipo de evento** | Form crear evento | Selecciona pose pack y textos | `events.event_type` | Dashboard, sesión (poses), composición (texto) |
| **Número de fotos** (2/3/4) | Config evento | Define captura y validación de slots | `events.default_photo_count`, `sessions.photo_count` | Editor plantilla (mín. slots), sesión, engine |
| **Copias por defecto** | Config evento | Pre-llena copias en impresión | `events.default_copies`, `print_jobs.copies` | Pantalla impresión, print job |
| **Toggle QR + link** | Config evento | QRService genera QR; engine lo inserta | `events.qr_enabled/qr_link`, `qr_links` | Plantilla (slot QR), imagen final, impreso |
| **Plantilla asignada** | Config evento | Engine la usa para componer | `events.template_id` | Sesión, composición, preview |
| **Crear/mover slot** | Editor de plantilla | Define dónde van fotos/QR | `template_slots.*` | Preview, composición real (Fase 6) |
| **Fit mode** (cover/contain) | Editor de plantilla | Cómo recorta la foto en el slot | `template_slots.fit_mode` | Imagen final |
| **Capturar foto** | Sesión + countdown | Guarda original, alimenta engine | `session_photos.original_path` | Composición, historial (originales) |
| **Repetir foto/sesión** | Botón en sesión | Reemplaza original / reinicia | actualiza `session_photos`/`sessions` | Resultado final correcto |
| **Pose mostrada** | Antes de cada foto | Guía al invitado | `poses` (pack activo) | Pantalla invitado |
| **Componer final** | Fin de captura | Genera imagen + miniatura | `session_outputs`, `sessions.final_output_path/thumbnail_path` | Preview, impresión, historial |
| **Elegir impresora** | Pantalla impresión/config | Define a dónde se manda | `print_jobs.printer_name`, `settings` | Print job, diagnóstico |
| **Método/adapter de impresión** | Config impresión | Cómo se imprime (Windows/PDF/imagen) | `print_jobs` (método/estado) | Print job, reintento, diagnóstico |
| **Número de copias** | Pantalla impresión | Cuántas se imprimen / layout de hoja | `print_jobs.copies` | Print Sheet, historial |
| **Layout multi-tira** | Print Sheet Builder | Acomoda N tiras/sesiones por hoja | `print_jobs` (layout/sheet path) | Preview de hoja, impreso, ahorro papel |
| **Imprimir** | Botón imprimir | Crea job, manda a imprimir | `print_jobs.status` (pending→sent→completed/failed) | Historial, estado de cola |
| **Reimprimir** | Historial | Crea NUEVO print job | nuevo `print_jobs` ligado a la sesión | Historial (varios jobs por sesión) |
| **Borrar sesión** | Historial (con confirm) | Archiva/elimina con respaldo | `sessions.status`/archivo | Historial actualizado |
| **Exportar evento/sesión** | Historial/Config | Genera `.zip` portable | archivo en `exports/` | Sistema de archivos, soporte |
| **Diagnóstico pre-evento** | Pantalla diagnóstico | Verifica cámara/impresora/disco | log + estado "evento listo" | Dashboard (evento listo), export diagnóstico |
| **Cambiar data root** | Configuración | Mueve dónde se guarda todo | `settings` (data root) | Todas las rutas, diagnóstico |
| **Sonido on/off** | Configuración | Activa beep/shutter en sesión | `settings` | Sesión (modo invitado) |
| **Branding** (logo/nombre/tema) | Configuración (Fase 10) | Cambia identidad visible | `settings`/branding | Toda la UI, splash, impresos |

> Esta tabla es de referencia, no exhaustiva. Cualquier control nuevo que agregues
> debe poder añadirse a esta tabla con sus 4 respuestas llenas.

---

## Anti-patrones que serán rechazados en auditoría

- Selector de impresora que no se guarda ni se usa al imprimir.
- Toggle de QR que no produce QR ni cambia la imagen final.
- "Copias = 3" que imprime 1.
- Botón "Exportar" que no genera archivo.
- Historial que muestra miniaturas pero "Reimprimir" no crea un nuevo `print_jobs`.
- Configuración que no persiste tras reiniciar.
- Editor que deja marcar slots que la composición ignora.

## Verificación en cada Audit Gate

Para la fase en curso, toma cada control nuevo y llena el contrato de 4 preguntas en
`AUDIT_LOG.md`. Si alguno no cierra, es bug **high** y bloquea avanzar.
