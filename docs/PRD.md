# PRD.md — Product Requirements Document

## Producto

**MH Photo Booth Studio**

Aplicación de escritorio para Windows destinada a operar sesiones de cabina fotográfica en eventos.

---

## Objetivos del producto

1. Crear un software profesional de cabina fotográfica.
2. Permitir personalización visual por evento.
3. Automatizar captura, composición e impresión.
4. Funcionar localmente sin depender de internet.
5. Permitir reimpresión e historial.
6. Diseñarse con arquitectura vendible y extensible.

---

## Objetivos de negocio

- Convertir el set fotográfico en un producto más profesional.
- Reducir dependencia de software externo.
- Permitir crear plantillas personalizadas para diferentes eventos.
- Ofrecer impresión inmediata como servicio premium.
- Preparar el software para futura comercialización.

---

## Tipos de evento soportados

- XV años
- Bodas
- Bautizos
- Graduaciones
- Eventos empresariales
- Fiestas privadas
- Otro/personalizado

---

## Requerimientos funcionales

### 1. Gestión de eventos

El sistema debe permitir:

- Crear evento.
- Editar evento.
- Archivar evento.
- Seleccionar evento activo.
- Definir nombre del evento.
- Definir tipo de evento.
- Definir fecha.
- Definir cliente o referencia opcional.
- Elegir plantilla asociada.
- Elegir número de fotos por sesión.
- Elegir número de copias por defecto.
- Definir QR opcional.
- Definir carpeta de almacenamiento.

### 2. Gestión de plantillas

El sistema debe permitir:

- Importar plantilla PNG/JPG.
- Crear plantilla desde editor interno.
- Definir tamaño final.
- Definir slots de fotos.
- Definir slot de QR.
- Definir textos dinámicos opcionales.
- Previsualizar plantilla con fotos de prueba.
- Duplicar plantilla.
- Exportar plantilla.
- Importar plantilla.

### 3. Sesión fotográfica

El sistema debe permitir:

- Iniciar sesión.
- Mostrar preview de cámara.
- Mostrar instrucciones.
- Mostrar pose sugerida.
- Mostrar cuenta regresiva.
- Capturar 2, 3 o 4 fotos.
- Repetir foto individual si está mal.
- Repetir sesión completa.
- Confirmar resultado final.
- Guardar sesión.

### 4. Composición de imagen final

El sistema debe permitir:

- Insertar fotos en slots.
- Ajustar foto a slot con recorte inteligente.
- Aplicar fondo/plantilla.
- Insertar QR opcional.
- Insertar textos dinámicos.
- Exportar PNG/JPG final.
- Generar tira vertical.
- Generar formato postal/4x6.
- Generar hoja con múltiples tiras.

### 5. Impresión

El sistema debe permitir:

- Seleccionar impresora.
- Seleccionar tamaño de papel.
- Seleccionar orientación.
- Seleccionar número de copias.
- Ver preview antes de imprimir.
- Imprimir una sesión.
- Imprimir varias copias de una sesión.
- Imprimir varias sesiones en una hoja.
- Reimprimir desde historial.
- Ver estado básico de cola de impresión.

### 6. QR opcional

El sistema debe permitir:

- Agregar link manual por evento.
- Generar QR desde ese link.
- Mostrar preview del QR.
- Colocar QR en la plantilla.
- Activar/desactivar QR por evento.
- Dejar preparado QR por sesión para futuras fases.

### 7. Historial

El sistema debe permitir:

- Ver sesiones anteriores por evento.
- Ver miniaturas.
- Abrir foto final.
- Abrir originales.
- Reimprimir.
- Exportar sesión.
- Eliminar sesión con confirmación.

### 8. Configuración

El sistema debe permitir:

- Elegir cámara.
- Probar cámara.
- Elegir impresora.
- Probar impresión.
- Configurar carpeta de datos.
- Configurar sonido de countdown.
- Configurar idioma inicial.
- Configurar pantalla completa.

### 9. Diagnóstico

El sistema debe permitir:

- Ver estado de cámara.
- Ver estado de impresora si es posible.
- Ver rutas de almacenamiento.
- Ver logs.
- Exportar diagnóstico básico.

---

## Requerimientos no funcionales

### Estabilidad

- No debe perder fotos si falla la impresión.
- Debe guardar antes de imprimir.
- Debe manejar errores sin cerrar la app abruptamente.

### Rendimiento

- La composición debe ser suficientemente rápida para evento real.
- La app no debe congelarse durante captura o impresión.
- El historial debe cargar miniaturas optimizadas.

### Usabilidad

- Modo evento con botones grandes.
- Mensajes simples.
- Flujo corto.
- Reimpresión fácil.
- Configuraciones avanzadas separadas del modo evento.

### Offline

- Captura, composición, guardado e impresión deben funcionar offline.
- QR manual debe poder imprimirse aunque no haya internet.
- Subida a galería es opcional y posterior.

### Mantenibilidad

- Código modular.
- Servicios separados.
- Tipos claros.
- IPC ordenado en Electron.
- Documentación actualizada.

---

## Criterios de aceptación del MVP profesional

- Se puede crear un evento.
- Se puede cargar una plantilla.
- Se pueden dibujar slots de foto.
- Se puede capturar una sesión con 2/3/4 fotos.
- Se puede generar una imagen final.
- Se puede guardar todo en carpetas organizadas.
- Se puede imprimir al menos una copia.
- Se puede reimprimir desde historial.
- La app puede operar offline.
- Los errores principales tienen mensajes claros.

---

## Criterios de calidad antes de evento real

- Prueba de cámara completa.
- Prueba de impresora completa.
- Prueba de 20 sesiones seguidas.
- Prueba de reimpresión.
- Prueba de reiniciar app y recuperar historial.
- Prueba sin internet.
- Prueba con plantilla real.
- Prueba con operador no técnico.
