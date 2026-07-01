# HARDWARE.md — Hardware y Compatibilidad

## Estado

El hardware exacto aún está pendiente de confirmación. Este documento debe actualizarse cuando se conozcan modelos exactos de cámara, impresora, papel y computadora.

---

## Hardware objetivo

### Computadora

- Sistema operativo: Windows.
- Recomendado: Windows 10/11.
- Debe tener puertos suficientes para cámara e impresora.
- Debe poder trabajar offline durante evento.
- Debe tener espacio suficiente para guardar originales y resultados.

### Cámara

Estado: modelo exacto pendiente.

Posibles modos de conexión:

1. Webcam USB.
2. Cámara con salida HDMI usando capturadora.
3. Cámara profesional por USB/tethering.
4. Cámara vía software externo.
5. Carpeta vigilada con fotos capturadas por otra herramienta.

### Impresora

Estado: modelo exacto pendiente.

Datos conocidos:
- Impresora de inyección de tinta o compatible con ese flujo.
- Debe imprimir fotografías/hojas/tiras según papel disponible.
- Se debe confirmar tamaño de papel soportado.

### Papel

Estado: por confirmar.

Formatos a considerar:
- 4x6 pulgadas.
- 2x6 pulgadas si aplica.
- Carta.
- A4.
- Tamaño personalizado.

---

## Riesgos de hardware

### Cámara

La cámara es el riesgo técnico más alto.

Si es webcam o capturadora HDMI, el acceso suele ser más simple con APIs estándar.

Si es DSLR por cable, puede requerir:
- drivers,
- SDK de marca,
- permisos,
- software puente,
- control externo de disparo.

### Impresora

La impresión es el segundo riesgo técnico.

Se debe validar:
- márgenes reales,
- orientación,
- tamaño final,
- recortes,
- escalado automático de Windows,
- velocidad,
- calidad,
- consumo de tinta/papel.

---

## Estrategia de compatibilidad

No acoplar la app a un hardware específico al inicio.

Usar abstracciones:

```txt
CameraService
  WebcamAdapter
  CaptureCardAdapter
  DSLRAdapter
  WatchFolderAdapter

PrintService
  WindowsPrintAdapter
  PdfExportAdapter
  ImageExportAdapter
```

---

## Datos que deben completarse

### Cámara final

- Marca:
- Modelo:
- Conexión:
- Resolución:
- Orientación:
- Requiere driver:
- Requiere SDK:
- Pruebas realizadas:

### Impresora final

- Marca:
- Modelo:
- Tipo:
- Tamaños de papel:
- Driver:
- Margen mínimo:
- Calidad recomendada:
- Pruebas realizadas:

### Papel final

- Tipo:
- Tamaño:
- Gramaje:
- Acabado:
- Cantidad de tiras por hoja:
- Notas de corte:

---

## Matriz de pruebas de hardware

| Hardware | Prueba | Resultado | Notas |
|---|---|---|---|
| Cámara TBD | Preview 5 min | Pendiente |  |
| Cámara TBD | Captura 30 sesiones | Pendiente |  |
| Impresora TBD | 1 tira | Pendiente |  |
| Impresora TBD | varias tiras por hoja | Pendiente |  |
| Impresora TBD | reimpresión | Pendiente |  |
| Papel TBD | margen/corte | Pendiente |  |

---

## Reglas para desarrollo

- No asumir modelo de cámara.
- No asumir tamaño de papel único.
- No asumir que impresión sin márgenes funciona.
- No asumir que Windows respeta medidas exactas sin pruebas.
- No bloquear el desarrollo si falta hardware: usar adaptadores y mocks.
