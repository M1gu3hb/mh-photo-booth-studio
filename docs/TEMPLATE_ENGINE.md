# TEMPLATE_ENGINE.md — Motor de Plantillas

## Objetivo

Componer automáticamente las fotos capturadas en una plantilla final personalizada.

---

## Tipos de salida

### Tira vertical

Formato similar a cabina fotográfica.

Puede tener:

- 2 fotos,
- 3 fotos,
- 4 fotos,
- texto,
- QR,
- logo,
- decoración.

### Formato postal

Formato tipo 4x6 o similar.

Puede tener:

- una foto grande,
- collage,
- QR,
- diseño del evento.

### Hoja de impresión

Composición que acomoda una o varias tiras/fotos para impresión eficiente.

---

## Modelo de plantilla

Una plantilla se compone de:

1. Imagen base.
2. Slots.
3. Capas opcionales.
4. Configuración de salida.

Archivo sugerido:

```txt
template.png
template.json
```

---

## Ejemplo conceptual de `template.json`

```json
{
  "id": "template_xv_vertical_01",
  "name": "XV Vertical 3 Photos",
  "widthPx": 1200,
  "heightPx": 3600,
  "format": "vertical_strip",
  "slots": [
    {
      "id": "photo_1",
      "type": "photo",
      "x": 120,
      "y": 220,
      "width": 960,
      "height": 720,
      "fit": "cover",
      "rotation": 0,
      "zIndex": 10
    },
    {
      "id": "qr_1",
      "type": "qr",
      "x": 860,
      "y": 3200,
      "width": 180,
      "height": 180,
      "zIndex": 20
    }
  ]
}
```

---

## Sistema de coordenadas

Usar coordenadas en pixeles relativas al tamaño final de la plantilla.

Campos mínimos:

- x
- y
- width
- height
- rotation
- zIndex

---

## Fit modes

### cover

La foto llena el slot y puede recortarse.

### contain

La foto cabe completa dentro del slot y puede dejar bordes.

### stretch

La foto se estira al slot. Usar con cuidado.

---

## Pipeline de composición

1. Cargar plantilla base.
2. Cargar configuración JSON.
3. Cargar fotos originales.
4. Generar QR si aplica.
5. Crear canvas del tamaño final.
6. Pintar fondo.
7. Procesar cada slot.
8. Insertar fotos.
9. Insertar QR.
10. Insertar textos.
11. Exportar resultado.
12. Generar miniatura.
13. Registrar archivos en base.

---

## QR

El QR debe insertarse solo si:

- evento tiene QR habilitado,
- plantilla tiene slot QR,
- existe link válido.

Si falta slot QR, mostrar advertencia pero no bloquear composición si QR es opcional.

---

## Textos dinámicos

Futuro o básico inicial:

- nombre del evento,
- fecha,
- tipo de evento,
- mensaje personalizado.

---

## Validaciones

Antes de usar una plantilla:

- imagen base existe,
- JSON válido,
- dimensiones válidas,
- cantidad de slots de foto suficiente,
- slots dentro de límites,
- QR opcional correctamente definido.

---

## Calidad

Exportar en alta resolución.

No degradar innecesariamente las fotos.

Permitir elegir:

- PNG,
- JPG alta calidad.

---

## Criterios de éxito

- La imagen final se genera correctamente.
- Las fotos quedan alineadas.
- Los recortes son razonables.
- El QR se ve legible.
- El resultado se guarda antes de imprimir.
- Se genera miniatura para historial.
