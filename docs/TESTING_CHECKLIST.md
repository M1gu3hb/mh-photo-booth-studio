# TESTING_CHECKLIST.md — Checklist de Pruebas

## Objetivo

Garantizar que la app pueda usarse en un evento real sin fallos críticos.

---

## Checklist general antes de evento

- [ ] La app abre sin errores.
- [ ] La app funciona sin internet.
- [ ] El evento correcto está seleccionado.
- [ ] La plantilla correcta está seleccionada.
- [ ] El número de fotos por sesión es correcto.
- [ ] El número de copias por defecto es correcto.
- [ ] El QR está activado/desactivado correctamente.
- [ ] La cámara muestra preview.
- [ ] La impresora está configurada.
- [ ] Se hizo prueba de impresión.
- [ ] Las carpetas de guardado existen.
- [ ] Hay espacio suficiente en disco.
- [ ] El operador sabe iniciar, repetir e imprimir.

---

## Pruebas de cámara

- [ ] Listar cámaras disponibles.
- [ ] Seleccionar cámara.
- [ ] Ver preview estable durante 5 minutos.
- [ ] Capturar foto individual.
- [ ] Capturar sesión de 2 fotos.
- [ ] Capturar sesión de 3 fotos.
- [ ] Capturar sesión de 4 fotos.
- [ ] Repetir foto individual.
- [ ] Repetir sesión completa.
- [ ] Manejar cámara desconectada.
- [ ] Recuperarse al reconectar cámara si es posible.

---

## Pruebas de plantillas

- [ ] Importar plantilla PNG.
- [ ] Importar plantilla JPG.
- [ ] Crear slots de 2 fotos.
- [ ] Crear slots de 3 fotos.
- [ ] Crear slots de 4 fotos.
- [ ] Crear slot de QR.
- [ ] Guardar plantilla.
- [ ] Cerrar y reabrir app.
- [ ] Confirmar que plantilla persiste.
- [ ] Previsualizar con fotos de prueba.
- [ ] Validar que no se puede usar plantilla incompleta.

---

## Pruebas de composición

- [ ] Insertar fotos en slots.
- [ ] Recortar foto vertical.
- [ ] Recortar foto horizontal.
- [ ] Mantener calidad visual.
- [ ] Generar PNG final.
- [ ] Generar JPG final.
- [ ] Generar miniatura.
- [ ] Insertar QR.
- [ ] Desactivar QR.
- [ ] Insertar textos dinámicos si aplica.
- [ ] Generar 20 resultados seguidos.

---

## Pruebas de impresión

- [ ] Seleccionar impresora.
- [ ] Seleccionar tamaño de papel.
- [ ] Preview antes de imprimir.
- [ ] Imprimir 1 copia.
- [ ] Imprimir 2 copias.
- [ ] Imprimir varias copias de una sesión.
- [ ] Imprimir varias sesiones en una hoja.
- [ ] Reimprimir desde historial.
- [ ] Manejar impresora desconectada.
- [ ] Manejar cancelación de impresión.
- [ ] Confirmar que la sesión queda guardada aunque falle impresión.

---

## Pruebas de historial

- [ ] Ver sesiones del evento.
- [ ] Ver miniaturas.
- [ ] Abrir resultado final.
- [ ] Abrir originales.
- [ ] Reimprimir.
- [ ] Exportar sesión.
- [ ] Confirmar orden por fecha/hora.
- [ ] Reiniciar app y confirmar persistencia.

---

## Prueba de evento simulado

Simular operación real:

- [ ] Crear evento.
- [ ] Seleccionar plantilla.
- [ ] Hacer 30 sesiones seguidas.
- [ ] Imprimir algunas sesiones.
- [ ] Reimprimir 5 sesiones.
- [ ] Desconectar internet.
- [ ] Reiniciar app.
- [ ] Confirmar que no se perdieron datos.
- [ ] Exportar evento completo.

---

## Pruebas de empaque

- [ ] Build exitoso.
- [ ] Instalador generado.
- [ ] App portable generada.
- [ ] Instalar en computadora limpia.
- [ ] Abrir sin entorno de desarrollo.
- [ ] Confirmar rutas de datos.
- [ ] Confirmar permisos de archivos.
- [ ] Confirmar impresión.
