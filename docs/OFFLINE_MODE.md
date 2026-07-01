# OFFLINE_MODE.md — Modo Offline

## Objetivo

Garantizar que el flujo principal funcione sin internet.

---

## Debe funcionar offline

- Abrir app.
- Crear/abrir evento existente.
- Usar plantillas locales.
- Generar QR ya configurado.
- Ver preview de cámara.
- Capturar fotos.
- Guardar originales.
- Componer imagen final.
- Guardar resultado.
- Imprimir.
- Reimprimir.
- Ver historial.
- Exportar evento local.

---

## Puede requerir internet en fases futuras

- Subir galería.
- Crear links online.
- Sincronizar con nube.
- Validar licencia online.
- Descargar plantillas.
- Compartir por WhatsApp/email.

Nada de eso debe bloquear el flujo principal.

---

## Diseño offline-first

La app debe guardar todo localmente primero.

Luego, si hay internet y una función online está configurada, puede sincronizar o subir.

---

## Estados de conectividad

La UI puede mostrar:

- Online.
- Offline.
- Sincronización pendiente.
- Error de subida.

Pero el modo evento no debe asustar al operador si la sesión no necesita internet.

---

## Cola de sincronización futura

Para funciones online futuras:

- guardar pendientes,
- reintentar,
- mostrar estado,
- no duplicar subidas,
- permitir cancelar.

---

## QR offline

Si el QR usa link manual, no se necesita internet para imprimirlo.

La URL puede no verificarse en tiempo real.

---

## Riesgos

- Dependencia accidental de APIs online.
- Licencia online bloqueando evento.
- Plantillas descargadas no disponibles localmente.
- Galería obligatoria.

Evitar todos estos riesgos.

---

## Criterios de éxito

- La app completa una sesión sin internet.
- La app imprime sin internet.
- La app reabre historial sin internet.
- La app no muestra errores falsos solo por estar offline.
