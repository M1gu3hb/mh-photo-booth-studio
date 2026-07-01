# QR_GALLERY.md — QR y Galería Digital

## Objetivo

Permitir agregar QR opcional a las fotos impresas, inicialmente con link manual y posteriormente con galería digital.

---

## Enfoque inicial

Usar QR por evento con link manual.

El operador o administrador pega un link y la app genera el QR.

Ejemplos de destino:

- Google Drive
- Google Photos
- Página web
- Galería del evento
- Instagram
- WhatsApp
- Formulario

---

## QR por evento

Todos los impresos del evento comparten el mismo QR.

Ventajas:

- simple,
- rápido,
- compatible offline una vez generado,
- no requiere servidor propio.

---

## QR por sesión

Fase avanzada.

Cada sesión tendría un QR único para descargar esa foto específica.

Requiere:

- galería online,
- subida automática,
- URLs únicas,
- control de privacidad,
- manejo de errores de subida.

No implementarlo como dependencia del MVP.

---

## Funcionalidad inicial

- Activar/desactivar QR por evento.
- Ingresar URL.
- Validar URL básica.
- Generar imagen QR.
- Guardar QR en carpeta del evento.
- Insertar QR en slot de plantilla.
- Previsualizar QR.
- Permitir actualizar link.

---

## Validaciones

- URL no vacía si QR está activado.
- URL con formato válido.
- Plantilla con slot QR si se desea imprimir.
- QR legible en tamaño final.

---

## Offline

Si ya se generó el QR, se puede imprimir offline.

La app no debe intentar verificar internet durante composición salvo que el usuario lo pida.

---

## Futuro: galería online

Posibles modos:

### Manual

El operador exporta fotos y las sube manualmente.

### Semi-automático

La app exporta carpeta lista para subir.

### Automático

La app sube a servicio externo y genera enlaces.

---

## Privacidad

No publicar fotos automáticamente sin acción del operador/administrador.

Mostrar claramente si una galería es pública o privada.

---

## Criterios de éxito inicial

- El operador pega un link.
- La app genera QR.
- El QR se ve en plantilla.
- El QR se imprime correctamente.
- La app no depende de internet para imprimir QR ya generado.
