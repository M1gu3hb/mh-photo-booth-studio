# PHASE_07_PRINTING.md — Impresión & Print Sheet Builder

## Objetivo
Imprimir de forma controlada, con preview, copias, acomodo multi-tira y reimpresión, sin
perder nunca una sesión por un fallo de impresión.

## Depende de
Fases 0-6. Lee antes: `docs/PRINT_PIPELINE.md`, `docs/HARDWARE.md`,
`docs/DATABASE_SCHEMA.md (print_jobs)`, `docs/ERROR_HANDLING.md (impresión)`.

## En alcance
- **PrintService** + adaptadores: **WindowsPrintAdapter** (impresión del SO),
  **PdfExportAdapter**, **ImageExportAdapter** (`docs/HARDWARE.md`). Mock si no hay
  impresora real, etiquetado.
- Listar / seleccionar / **probar** impresora; configurar tamaño de papel, orientación,
  márgenes, calidad, **número de copias**, layout, modo de escalado.
- **PrintSheetBuilder**: 1–4 tiras por hoja, varias copias de una sesión, **varias
  sesiones distintas** en una hoja, separación/márgenes, orientación; genera hoja
  imprimible + **preview** real.
- **Preview de impresión** (`PrintPreview`): hoja completa, tamaño, tiras acomodadas,
  márgenes, copias, sesiones incluidas.
- Crear **`print_jobs`** con: impresora, **método/adapter**, copies, paper_size, layout,
  status (pending→rendering→ready→sent→completed/failed/canceled), error.
- **Reintento** ante fallo; **modo lote** (agregar a lote / imprimir lote) vs inmediato
  (ahorro de papel).
- **Reimpresión** desde una sesión/historial → **nuevo** `print_jobs`.
- Regla dura: **guardar antes de imprimir**; un fallo NO borra archivos.

## Fuera de alcance
Galería/QR por sesión. Drivers DSLR. Calibración avanzada de color.

## Datos & IPC
`print_jobs`. IPC: `print.listPrinters/select/test/preview/print/retry/cancel`,
`sheet.build`. Errores `PRINTER_NOT_SELECTED/PRINT_RENDER_FAILED/PRINT_SEND_FAILED/
PAPER_SIZE_MISMATCH`.

## Pantallas / Componentes
Impresión (config + Print Sheet Builder + preview), acciones de impresión en preview de
resultado (Fase 6) y en Historial (Fase 8).

## Notas de diseño
Botón "Imprimir" de latón grande; preview claro de la hoja; estados de cola visibles;
iconos inequívocos (impresora, reimprimir, tijera=ahorro). Operador sin tecnicismos.

## Flujo completo (anti-huérfano) — CRÍTICO en esta fase
- **Toda** opción elegida se **registra y se usa**: impresora→`print_jobs.printer_name`;
  método/adapter→`print_jobs`; copias→cuántas se imprimen y layout; layout multi-tira→
  hoja generada; status→visible en cola/historial. (El ejemplo "método de pago" aplica
  aquí literalmente: si das a elegir, se registra y se usa.)
- "Copias = N" imprime N (o acomoda N en hoja). 
- Reimprimir crea **otro** job ligado a la misma sesión (varios jobs por sesión).
- Fallo de impresión → sesión intacta + opción de reintentar desde historial.

## Skills
`impeccable`, `review`, `design:accessibility-review`.

## Criterio de salida (checklist)
- [ ] Imprimir 1/2/N copias de una sesión.
- [ ] Hoja con varias tiras / varias sesiones.
- [ ] Reimprimir desde una sesión genera nuevo `print_jobs`.
- [ ] Preview coincide con lo que se manda a imprimir.
- [ ] Fallo de impresora (mock) NO borra archivos y permite reintentar.
- [ ] Cada job queda en `print_jobs` con copias/método/layout/status.

## Audit Gate 7 (fase grande → verificación reforzada)
Anti-huérfano CRÍTICO (cada opción→registrada→usada→visible); fallo forzado con mock;
preview=salida. Segunda pasada `review`. Registrar en `AUDIT_LOG.md`.
