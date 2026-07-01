# DESIGN_SYSTEM.md — Sistema de Diseño

## Objetivo

Crear una interfaz moderna, premium y fácil de operar durante eventos.

---

## Personalidad visual

La app debe sentirse:

- elegante,
- confiable,
- moderna,
- clara,
- rápida,
- de evento premium.

No debe verse como herramienta técnica ni panel administrativo viejo.

---

## Principios UI

1. Menos ruido visual.
2. Botones grandes.
3. Jerarquía clara.
4. Estados evidentes.
5. Contraste suficiente.
6. Pantallas de evento con estética más visual.
7. Administración con estructura clara.
8. No esconder acciones críticas.

---

## Layout general

### Dashboard

Debe mostrar:

- evento activo,
- estado de cámara,
- estado de impresión,
- sesiones de hoy,
- botón grande “Iniciar sesión”,
- accesos rápidos.

### Modo evento

Debe usar:

- pantalla completa,
- texto grande,
- countdown grande,
- animación simple,
- pose sugerida,
- flash visual,
- instrucciones mínimas.

### Modo administración

Puede tener:

- sidebar,
- tablas,
- cards,
- formularios,
- previews.

---

## Componentes base

- Button
- PrimaryButton
- DangerButton
- Card
- Modal
- Toast
- StatusBadge
- CameraPreview
- CountdownDisplay
- PoseCard
- TemplatePreview
- PrintPreview
- SessionThumbnail
- EmptyState
- ErrorState
- Stepper
- Toggle
- Input
- Select

---

## Botones críticos

En modo evento:

- Iniciar sesión
- Repetir foto
- Repetir sesión
- Imprimir
- Reimprimir
- Siguiente grupo
- Salir de pantalla completa

Estos botones deben ser grandes y fáciles de encontrar.

---

## Estados

### Cámara

- Lista
- No detectada
- En uso
- Error
- Probando

### Impresión

- Lista
- Sin impresora
- Imprimiendo
- Error
- Pendiente

### Sesión

- Preparando
- Capturando
- Procesando
- Lista para imprimir
- Completada
- Error

---

## Animaciones

Usar animaciones suaves y útiles:

- transición de pantallas,
- countdown,
- flash,
- carga de preview,
- impresión en proceso.

No usar animaciones que retrasen el flujo.

---

## Sonido

Sonidos opcionales:

- beep countdown,
- shutter,
- éxito,
- error suave.

Debe poder desactivarse.

---

## Accesibilidad

- Contraste alto.
- Texto grande en modo evento.
- Botones con labels claros.
- Evitar depender solo de color.
- Soporte para pantalla táctil si aplica.

---

## Branding

El branding debe ser configurable:

- nombre visible del producto,
- logo,
- color principal,
- texto de bienvenida,
- marca del evento o venue.

No hardcodear nombres comerciales salvo en configuración.
