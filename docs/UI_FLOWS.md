# UI_FLOWS.md — Flujos de Interfaz

## Principio

Durante evento real, la app debe ser simple. Las pantallas complejas deben quedar fuera del flujo de sesión.

---

## Modos principales

### 1. Modo administración

Para preparar eventos, plantillas y configuración.

### 2. Modo operador

Para operar durante el evento.

### 3. Modo invitado

Pantalla grande, visual, limpia y guiada.

---

## Navegación principal

Pantallas:

- Dashboard
- Eventos
- Plantillas
- Sesión
- Historial
- Impresión
- Configuración
- Diagnóstico

---

## Flujo: crear evento

1. Entrar a Eventos.
2. Clic en “Nuevo evento”.
3. Capturar:
   - nombre,
   - tipo,
   - fecha,
   - plantilla,
   - número de fotos,
   - copias por defecto,
   - QR opcional.
4. Guardar.
5. Crear carpeta local.
6. Seleccionar como evento activo.

---

## Flujo: configurar plantilla

1. Entrar a Plantillas.
2. Clic en “Nueva plantilla”.
3. Subir PNG/JPG.
4. Definir tamaño/final.
5. Dibujar slots:
   - foto 1,
   - foto 2,
   - foto 3,
   - foto 4 si aplica,
   - QR opcional.
6. Validar plantilla.
7. Previsualizar.
8. Guardar.

---

## Flujo: sesión de fotos

### Pantalla del operador

1. Confirmar evento activo.
2. Confirmar cámara.
3. Confirmar plantilla.
4. Elegir número de copias si cambia.
5. Clic en “Iniciar sesión”.

### Pantalla del invitado

1. “Prepárense”.
2. Mostrar pose sugerida.
3. Countdown.
4. Flash.
5. Foto tomada.
6. Repetir hasta completar fotos.
7. “Preparando tu foto”.
8. Preview final.

### Pantalla del operador después de captura

Opciones:

- Imprimir.
- Cambiar copias.
- Repetir sesión.
- Repetir última foto.
- Guardar sin imprimir.
- Siguiente grupo.

---

## Flujo: reimpresión

1. Entrar a Historial.
2. Seleccionar evento.
3. Buscar sesión.
4. Abrir preview.
5. Elegir copias.
6. Imprimir.
7. Registrar nuevo print job.

---

## Flujo: Print Sheet Builder

1. Entrar a Impresión.
2. Seleccionar formato de papel.
3. Agregar sesiones o copias.
4. Acomodar automáticamente.
5. Ajustar orden si es necesario.
6. Preview.
7. Imprimir.

---

## Flujo: diagnóstico pre-evento

1. Abrir Diagnóstico.
2. Revisar:
   - cámara,
   - impresora,
   - plantilla,
   - carpeta de datos,
   - espacio en disco,
   - QR,
   - internet si aplica.
3. Ejecutar prueba de captura.
4. Ejecutar prueba de impresión.
5. Marcar evento como listo.

---

## Estados visuales importantes

- Listo.
- Capturando.
- Componiendo.
- Guardando.
- Imprimiendo.
- Error.
- Reintentando.
- Sesión completada.

---

## Reglas UX

- Botones grandes en modo evento.
- Evitar texto técnico.
- Confirmar antes de borrar.
- No mostrar stack traces.
- Mensajes claros:
  - qué pasó,
  - por qué importa,
  - qué hacer.
- Mantener siempre visible el evento activo.
- Mostrar estado de cámara antes de iniciar.
- Mostrar si la impresión está lista o no.

---

## Vista al público + modo automático (Fase 14)

- **Apertura:** botón "Vista al público" en Sesión, o automáticamente al entrar a "Modo evento".
  Abre una ventana de Electron en el 2º monitor (`/publico`), fullscreen, sin controles de admin.
- **Reflejo (modo automático apagado):** la ventana pública muestra la cámara en vivo y refleja el
  estado de la sesión que dirige el operador (pose, conteo, flash, foto final). El operador inicia,
  repite e imprime desde su pantalla; el flujo del operador no cambia.
- **Interactivo (modo automático encendido):** el público inicia e imprime desde la pantalla pública
  (toque o botonera mapeada a Enter/Espacio = acción principal, P = imprimir). Los comandos viajan al
  operador, que ejecuta el mismo flujo de captura/compose/guardado/impresión.
- **Privacidad de UI:** la vista pública nunca muestra nombre de evento ni controles técnicos; sí
  muestra "fotos por sesión" y el nombre del venue.

### Detalles visuales de la vista pública (Fase 15)
- **Contador:** número grande en la **esquina superior derecha**, aparece/desaparece con animación
  (no mueve el layout). El encabezado (venue + "fotos por sesión") va a la izquierda para no chocar.
- **"¡Listo!":** grande y centrado durante el flash de captura.
- **Marco dorado** de latón alrededor de toda la pantalla (detalle decorativo).
- **Guía de encuadre (imaginaria, exacta):** SIN borde visible — solo se **atenúa** (sutil) lo que
  queda fuera de la región que la foto realmente conserva. Tamaño = recorte real: la captura toma el
  **cuadro completo** de la cámara y la composición lo mete al slot con `cover`, así que la región
  conservada = recorte centrado del cuadro al **aspecto del slot** de la foto actual. Se calcula con
  `frameAspect` (cámara), `slotAspect` (plantilla) y `stageAspect` (pantalla); la cámara pública usa
  `object-fit: contain` (cuadro completo visible). No hay mensaje central (pose) en la vista pública.
- **Estado en vivo al abrir:** main cachea el último estado publicado por el operador y lo reenvía a la
  ventana pública al cargar, para que el modo (automático/manual) y la fase se muestren de inmediato.
- **Nota:** el modo automático requiere que el operador esté en la pantalla de Sesión (o Modo evento),
  el único motor de captura (DEC-021). La cámara pública usa `object-fit: cover`.
