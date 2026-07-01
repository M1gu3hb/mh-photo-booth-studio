# TEMPLATE_EDITOR.md — Editor de Plantillas

## Objetivo

Permitir crear y configurar plantillas personalizadas dentro de la app.

---

## Enfoque por fases

### V1 — Editor de slots sobre PNG/JPG

Prioridad inicial.

Permite:

- subir imagen de fondo,
- dibujar recuadros de foto,
- dibujar recuadro de QR,
- ajustar posición y tamaño,
- guardar configuración.

### V2 — Editor de capas

Futuro.

Permite:

- textos,
- logos,
- stickers,
- fondos,
- marcos,
- capas,
- bloqueo,
- guías,
- grid,
- duplicación.

---

## Flujo V1

1. Crear plantilla.
2. Subir PNG/JPG.
3. Definir nombre.
4. Definir formato:
   - tira vertical,
   - postal,
   - hoja personalizada.
5. Dibujar slots de fotos.
6. Asignar orden:
   - foto 1,
   - foto 2,
   - foto 3,
   - foto 4.
7. Dibujar slot de QR opcional.
8. Probar con fotos demo.
9. Guardar.

---

## Herramientas del editor

### Herramientas iniciales

- Seleccionar.
- Crear slot de foto.
- Crear slot de QR.
- Mover.
- Redimensionar.
- Eliminar.
- Duplicar.
- Ordenar.
- Zoom.
- Grid opcional.

### Herramientas futuras

- Crear texto.
- Subir logo.
- Capas.
- Bloquear capa.
- Alinear.
- Distribuir.
- Snap.
- Rotar.

---

## Propiedades de slot

Cada slot debe tener:

- id,
- tipo,
- nombre visible,
- x,
- y,
- width,
- height,
- rotation,
- zIndex,
- fit mode,
- locked.

---

## Validaciones

Antes de guardar:

- nombre obligatorio,
- imagen base obligatoria,
- al menos 2 slots de foto,
- slots no pueden tener tamaño 0,
- slots deben estar dentro del canvas,
- no duplicar claves críticas,
- QR es opcional.

---

## Preview

El editor debe permitir previsualizar con:

- fotos de prueba,
- QR de prueba,
- textos de prueba.

---

## UX del editor

- Mostrar medidas.
- Permitir arrastrar con mouse.
- Permitir ajuste fino con teclado.
- Mostrar guías.
- Botón claro de guardar.
- Botón de cancelar.
- Advertencias no destructivas.

---

## Export/import

Una plantilla exportada debe incluir:

- imagen base,
- JSON,
- preview,
- miniatura.

Formato recomendado:

```txt
template_export_<name>.zip
```

---

## Criterios de éxito V1

- Un usuario puede subir una plantilla hecha en Canva/Photoshop.
- Puede marcar dónde van las fotos.
- Puede marcar dónde va el QR.
- Puede guardar y usar esa plantilla en una sesión real.
