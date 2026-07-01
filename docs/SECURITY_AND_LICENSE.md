# SECURITY_AND_LICENSE.md — Seguridad y Licenciamiento

## Objetivo

Preparar el proyecto para uso real y futura comercialización sin complicar el MVP.

---

## Seguridad local

La app guardará datos localmente.

Debe cuidar:

- rutas de archivos,
- permisos,
- no exponer Node al renderer sin control,
- no guardar secretos en texto plano,
- no ejecutar archivos externos sin validar.

---

## Electron

Reglas:

- Usar preload seguro.
- No habilitar Node integration en renderer salvo justificación fuerte.
- Validar inputs que llegan por IPC.
- No permitir acceso libre al sistema de archivos desde UI.
- Usar APIs controladas.

---

## Datos

La app puede guardar:

- eventos,
- plantillas,
- sesiones,
- fotos,
- resultados,
- logs,
- QR links.

No guardar información innecesaria.

---

## Licenciamiento futuro

No implementar licenciamiento complejo en MVP.

Fases posibles:

### Fase 1 — Sin licencia

Uso interno/desarrollo.

### Fase 2 — Licencia local simple

Archivo de licencia local con:
- nombre de instalación,
- fecha,
- features activas,
- firma.

### Fase 3 — Activación online opcional

Solo si se decide vender masivamente.

---

## Reglas de licencia

- Nunca bloquear un evento en curso de forma agresiva.
- Si hay expiración, avisar antes.
- Permitir modo emergencia si la licencia falla durante evento.
- No depender de internet para abrir el software en evento si ya está activado.

---

## Privacidad

- No subir fotos automáticamente.
- No publicar galerías sin acción del operador.
- Mostrar claramente si se exportan fotos.
- Evitar datos personales en logs.

---

## Backups

Futuro:

- exportar evento,
- exportar plantillas,
- backup de base,
- restauración.

---

## Criterios de éxito

- La app no expone permisos innecesarios.
- No hay secretos en repo.
- No hay rutas privadas hardcodeadas.
- La app puede evolucionar a software vendible.
