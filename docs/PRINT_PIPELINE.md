# PRINT_PIPELINE.md — Impresión y Print Sheet Builder

## Objetivo

Imprimir resultados al momento de forma controlada, con preview, copias y ahorro de papel.

---

## Principios

- Guardar antes de imprimir.
- Previsualizar antes de imprimir.
- No perder sesión si falla impresión.
- Permitir reimpresión.
- Permitir varias tiras por hoja.
- Permitir varias sesiones en una misma hoja.

---

## Flujo básico de impresión

1. Sesión genera imagen final.
2. Sistema guarda imagen final.
3. Operador elige copias.
4. Sistema genera print sheet si aplica.
5. Operador revisa preview.
6. Se manda a imprimir.
7. Se registra print job.
8. Si falla, permite reintentar.

---

## Print Sheet Builder

Módulo para acomodar composiciones en una hoja.

Debe soportar:

- 1 tira por hoja.
- 2 tiras por hoja.
- 3 tiras por hoja.
- 4 tiras por hoja.
- varias copias de la misma sesión.
- varias sesiones diferentes en la misma hoja.
- orientación vertical/horizontal.
- márgenes configurables.
- separación entre tiras.

---

## Casos de uso

### Varias copias de la misma sesión

Ejemplo:

Una sesión final debe imprimirse 2 veces. Si caben 2 tiras en una hoja, el sistema genera una hoja con dos copias.

### Varias sesiones en una hoja

Ejemplo:

El operador acumula 4 sesiones y las imprime juntas para ahorrar papel.

### Reimpresión

El operador busca una sesión y genera nuevas copias.

---

## Configuración de impresión

Campos:

- impresora,
- tamaño de papel,
- orientación,
- margen,
- calidad,
- número de copias,
- layout,
- modo de escalado.

---

## Estados de print job

- pending
- rendering
- ready
- sent
- completed
- failed
- canceled

---

## Errores esperados

### PRINTER_NOT_SELECTED

No hay impresora seleccionada.

### PRINT_RENDER_FAILED

Falló la generación de hoja de impresión.

### PRINT_SEND_FAILED

No se pudo mandar a imprimir.

### PAPER_SIZE_MISMATCH

El tamaño configurado no coincide con el esperado.

---

## Preview

El preview debe mostrar:

- hoja completa,
- tamaño,
- tiras acomodadas,
- márgenes,
- número de copias,
- sesiones incluidas.

---

## Ahorro de papel

No imprimir automáticamente una hoja por cada tira si el operador eligió agrupar.

Opciones:

- imprimir inmediato,
- agregar a lote,
- imprimir lote.

---

## Criterios de éxito

- Se imprime el resultado correcto.
- Se puede reimprimir.
- El operador ve preview.
- Se pueden acomodar varias tiras.
- El fallo de impresora no borra archivos.
- El print job queda registrado.

---

## Acomodo compacto + plantillas de impresión (Fases 12–13)

- **Acomodo compacto:** `computeStripGrid` empaca las tiras en la rejilla rows×cols que más llena la
  hoja según el aspecto de la tira (ej. 8 = 4×2), con márgenes/gaps mínimos. `SHEET_LAYOUTS` llega a 12.
- **Plantillas de impresión (por evento):** entidad `print_templates` (+ slots normalizados) ligada a
  un evento. Modos: `grid` (auto-acomodo por tiras/hoja), `custom` (slots manuales arrastrables),
  `full` (una tira por hoja). `computePrintCells` resuelve el modo a celdas px; `buildSheet` las usa.
- **Al imprimir:** se elige la plantilla de impresión del evento (o "Manual"); define papel,
  orientación y acomodo, con vista previa en vivo. Las plantillas de foto siguen siendo universales.
