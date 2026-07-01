# FILE_STORAGE.md — Estructura de Archivos Locales

## Objetivo

Guardar fotos, plantillas, resultados e impresiones de forma organizada, portable y recuperable.

---

## Data root

La app debe tener una carpeta raíz de datos configurable.

Ejemplo conceptual:

```txt
PhotoBoothData/
```

No hardcodear rutas absolutas de una máquina específica.

---

## Estructura sugerida

```txt
PhotoBoothData/
  database/
    app.sqlite
    migrations/
  templates/
    template_<id>/
      template.png
      template.json
      preview.png
      thumbnail.png
  events/
    event_<id>/
      event.json
      originals/
        session_<id>/
          photo_01.jpg
          photo_02.jpg
          photo_03.jpg
      outputs/
        session_<id>/
          final.png
          final.jpg
          thumbnail.jpg
      print_sheets/
        print_sheet_<id>.png
      qr/
        event_qr.png
      exports/
  logs/
    app.log
    errors.log
  backups/
```

---

## Naming conventions

Usar nombres legibles y seguros:

```txt
event_2026-06-28_xv_ana_pau
session_2026-06-28_21-34-12
photo_01.jpg
final_strip.png
print_sheet_001.png
```

También guardar IDs internos para evitar colisiones.

---

## Originales

Las fotos originales deben conservarse.

Reglas:

- No sobrescribir originales.
- Guardar con índice.
- Guardar metadatos en base.
- Si hay procesamiento, guardar versión procesada aparte.

---

## Resultados finales

Cada sesión debe tener al menos:

- imagen final de alta calidad,
- miniatura,
- referencia en base de datos.

---

## Plantillas

Cada plantilla debe incluir:

- imagen base,
- JSON de configuración,
- preview,
- miniatura.

Ejemplo:

```txt
template.json
{
  "id": "template_xv_vertical_01",
  "name": "XV Vertical Elegant",
  "widthPx": 1200,
  "heightPx": 3600,
  "slots": [...]
}
```

---

## Escritura segura

Cuando se genere un archivo importante:

1. Escribir a archivo temporal.
2. Verificar que existe y tiene tamaño válido.
3. Renombrar a destino final.
4. Registrar en base de datos.

Esto reduce riesgo de archivos corruptos.

---

## Exportación

El sistema debe permitir exportar:

- evento completo,
- sesiones seleccionadas,
- plantillas,
- logs de diagnóstico.

Formato recomendado:

```txt
event_export_<event_name>_<date>.zip
```

---

## Backup

Futuro:

- backup manual,
- backup automático al cerrar evento,
- backup a unidad externa,
- backup a nube opcional.

---

## Reglas

- No borrar originales automáticamente.
- No depender de internet para acceder a archivos.
- No guardar archivos en carpetas temporales como almacenamiento permanente.
- No mezclar eventos distintos.
- Mantener estructura simple para que un humano pueda encontrar fotos.
