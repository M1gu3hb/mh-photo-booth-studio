# ROADMAP.md — Plan por Fases

## Enfoque

El proyecto debe construirse como producto profesional desde el inicio, pero por fases controladas.

No construir todo al mismo tiempo. La arquitectura debe estar lista para crecer, pero cada fase debe dejar algo usable y probado.

---

## Fase 0 — Planeación y base documental

### Objetivo

Tener contexto, alcance y arquitectura claros antes de escribir código grande.

### Entregables

- `CLAUDE.md`
- Documentos en `docs/`
- Decisiones técnicas iniciales
- Roadmap
- Checklist de pruebas

### Criterio de salida

Claude Code entiende el producto, sus módulos y las restricciones.

---

## Fase 1 — App shell profesional

### Objetivo

Crear la base de la app Windows.

### Entregables

- Electron + React + TypeScript
- Estructura de carpetas
- Navegación base
- Dashboard
- Layout profesional
- Configuración local inicial
- Persistencia básica

### Criterio de salida

La app abre, navega entre pantallas y tiene base visual limpia.

---

## Fase 2 — Eventos y almacenamiento local

### Objetivo

Permitir crear y administrar eventos.

### Entregables

- SQLite configurado
- Tabla de eventos
- Carpeta por evento
- Crear/editar/seleccionar evento
- Configuración por evento
- Historial inicial

### Criterio de salida

Se puede crear un evento y queda guardado localmente.

---

## Fase 3 — Plantillas V1

### Objetivo

Permitir usar plantillas PNG/JPG con slots configurables.

### Entregables

- Importar plantilla
- Editor básico de slots
- Slots para 2/3/4 fotos
- Slot opcional para QR
- Guardar `template.json`
- Preview con imágenes de prueba

### Criterio de salida

Se puede configurar una plantilla y previsualizar dónde van las fotos.

---

## Fase 4 — Cámara y sesión

### Objetivo

Crear el flujo de captura.

### Entregables

- Selección de cámara
- Preview en vivo
- Countdown
- Poses sugeridas
- Captura de 2/3/4 fotos
- Guardado de originales
- Repetir foto
- Repetir sesión

### Criterio de salida

Se puede completar una sesión de fotos sin impresión.

---

## Fase 5 — Template Engine

### Objetivo

Generar imagen final profesional.

### Entregables

- Motor de composición
- Recorte/fill de fotos en slots
- QR opcional
- Textos dinámicos básicos
- Export PNG/JPG
- Miniatura
- Historial visual

### Criterio de salida

Cada sesión genera una tira o composición final guardada correctamente.

---

## Fase 6 — Impresión y Print Sheet Builder

### Objetivo

Imprimir de forma controlada y ahorrar papel.

### Entregables

- Configuración de impresora
- Tamaño de papel
- Número de copias
- Preview de impresión
- Imprimir sesión
- Reimprimir sesión
- Acomodar varias tiras en una hoja
- Cola de impresión local

### Criterio de salida

Se puede imprimir una o varias tiras con control de copias y reimpresión.

---

## Fase 7 — Modo evento real

### Objetivo

Dejar la app lista para operar en evento.

### Entregables

- Modo pantalla completa
- Modo operador
- Modo invitado
- Botones grandes
- Mensajes amigables
- Sonidos
- Flash visual
- Diagnóstico pre-evento
- Checklist integrado o visible

### Criterio de salida

Un operador puede usar la app sin entrar a pantallas técnicas durante el evento.

---

## Fase 8 — Producto vendible

### Objetivo

Preparar la app como software distribuible.

### Entregables

- Instalador Windows
- App portable
- Import/export de plantillas
- Export de eventos
- Sistema básico de licencia local
- Branding configurable
- Documentación de usuario
- Logs/diagnóstico exportable

### Criterio de salida

La app puede instalarse y usarse en otra computadora con documentación básica.

---

## Fase 9 — Funciones avanzadas

### Posibles mejoras

- Galería online.
- QR por sesión.
- Subida automática a Drive/nube.
- Editor de plantillas avanzado.
- IA para sugerir poses.
- Filtros.
- Integración DSLR específica.
- Modo doble pantalla avanzado.
- App complementaria para descargar fotos.
