# DESIGN_BRAND.md — Identidad Visual y Sistema Skeuomórfico

> Fuente de verdad **visual** del proyecto. Cualquier pantalla, componente o icono
> debe cumplir este documento. Complementa (no reemplaza) `docs/DESIGN_SYSTEM.md`.
> Si hay conflicto: `docs/DESIGN_SYSTEM.md` define **qué** componentes existen y su
> comportamiento; este archivo define **cómo se ven y se sienten**.

---

## 1. Concepto de marca

Primer uso objetivo: **Jardines Club Hípico** — un salón de eventos premium
(bodas, XV, corporativos) en Xochimilco, CDMX. La tarjeta de presentación define
una estética **verde esmeralda profundo + oro metálico**, serif clásico, ornamentos
de laurel y acabado de lujo.

La app NO debe verse como un panel técnico. Debe sentirse como un **objeto físico
premium**: una cabina fotográfica de lujo, con controles tangibles de latón sobre
fieltro/terciopelo verde. Esa es la dirección: **Neo-Skeuomorphic Luxe**.

Palabras clave: elegante · tangible · cálido · confiable · ceremonial · claro.
Anti-palabras: plano-genérico · neón · cyber · brutalist · material-design-plano · SaaS-aburrido.

---

## 2. Marca configurable (importante)

`docs/DESIGN_SYSTEM.md` exige branding configurable y `DEC-010` pide no hardcodear
nombres comerciales. Por eso:

- El tema **"Esmeralda & Oro" (Jardines)** es el **tema por defecto** y el que se
  pule a nivel pixel en este proyecto.
- TODOS los colores, fuentes, logo, nombre visible y texto de bienvenida se leen de
  **design tokens + tabla `settings`/branding**, nunca de literales dispersos.
- Reskinear a otro cliente = cambiar tokens y assets, sin tocar componentes.
- Resultado: se ve 100% Jardines hoy, pero es comercializable mañana.

---

## 3. Tokens de color (CSS variables / theme object)

Definir en un único archivo de tema (`renderer/styles/theme.ts` + variables CSS).
No usar hex sueltos en componentes.

### Verde esmeralda (superficies, "fieltro")
```
--green-950: #04110B;  /* viñeta / borde de pantalla */
--green-900: #061711;  /* fondo base modo evento */
--green-800: #0B2418;  /* fondo base admin */
--green-700: #0E2F20;  /* superficie / panel */
--green-600: #123D2A;  /* superficie elevada (card) */
--green-500: #18543A;  /* acento verde / hover */
--green-400: #1F6B49;  /* acento brillante / éxito-verde */
```

### Oro metálico (controles, texto display, hairlines)
```
--gold-800: #6E521C;  /* sombra inferior de bisel */
--gold-700: #8A6A24;  /* borde profundo */
--gold-600: #A8812F;  /* oro base sombra */
--gold-500: #C9A24A;  /* ORO PRINCIPAL (acción) */
--gold-400: #D9BC6A;  /* oro claro */
--gold-300: #E8CE84;  /* brillo */
--gold-100: #F6EAC2;  /* champagne / highlight superior */
```

### Neutros / texto
```
--cream:     #F4EFE2;  /* texto principal sobre verde */
--cream-dim: #CFC6AD;  /* texto secundario */
--ink:       #08130D;  /* texto sobre superficies oro */
--overlay:   rgba(4,17,11,.66); /* modales */
```

### Semánticos (tonos que respetan el lujo, sin colores "de sistema" chillones)
```
--success: #2FAE6B;   --success-fg:#04110B;
--warning: #E0A93B;   --warning-fg:#08130D;
--danger:  #B4452F;   --danger-fg:#F4EFE2;
--info:    #5C9A86;
```
> Nunca depender solo del color para comunicar estado (accesibilidad): acompañar
> SIEMPRE con icono + texto. Ver `docs/DESIGN_SYSTEM.md` §Accesibilidad.

---

## 4. Tipografía

Empaquetar las fuentes **localmente** (la app es offline-first; prohibido depender de
Google Fonts en runtime).

- **Display / títulos:** serif romano tipo Trajan → usar **Cinzel** (o equivalente
  libre). Mayúsculas, tracking amplio. Para H1/H2, nombre del producto, encabezados
  ceremoniales y pantalla de invitado.
- **Cuerpo / UI operativa:** sans humanista legible → **Inter** (o Mona Sans).
  Para botones, formularios, tablas, labels, mensajes. Prioriza legibilidad a
  distancia (operador) y en pantalla grande (invitado).
- **Acento script (uso MUY medido):** **Pinyon Script** / **Tangerine** solo para
  toques ceremoniales cara-al-invitado (p. ej. "¡Sonrían!", bienvenida). Nunca para
  UI funcional ni datos.

Escala (modo admin): 12 / 14 / 16 / 20 / 24 / 32. 
Escala (modo evento/invitado): 24 / 32 / 48 / 96+ (countdown gigante).

---

## 5. Recetas skeuomórficas (el corazón visual)

El skeuomorphism aquí = **luz, profundidad y material**, con moderación (legible, no
recargado). Tres materiales:

### A) Fieltro/terciopelo verde (superficies y paneles)
- Fondo: degradado radial `--green-700 → --green-900` + textura de ruido sutil (2–4% opacidad).
- Borde: hairline de 1px `--gold-700` con highlight interno 1px `rgba(246,234,194,.15)`.
- Sombra interior suave para sensación de hundido cuando es contenedor.

### B) Latón/oro pulido (botones de acción, controles, marcos)
- Relleno: degradado vertical `--gold-300 → --gold-600`.
- Borde superior 1px `--gold-100` (highlight), borde inferior 1px `--gold-800` (sombra).
- Sombra externa: `0 6px 14px rgba(0,0,0,.45)` + sombra de contacto corta.
- Estados: **hover** sube brillo (+6%); **active/pressed** invierte el degradado
  (`--gold-600 → --gold-300`) + sombra interior (se "hunde"); **disabled** desatura a
  gris-oro mate, sin sombra, cursor not-allowed.
- Texto sobre oro: `--ink`, peso medio.

### C) Vidrio/lente (preview de cámara, badges de estado)
- Marco metálico oro alrededor del preview (anillo tipo lente).
- Esquinas redondeadas 12–16px; reflejo diagonal sutil en la esquina superior.

### Reglas de profundidad
- Máx. 2 niveles de elevación visibles a la vez (evitar "cards dentro de cards dentro de cards").
- Sombras siempre coherentes con una sola fuente de luz: **arriba-izquierda**.
- Animación de "press" obligatoria en botones críticos (translateY 1px + cambio de sombra) para sensación táctil.
- Bordes redondeados base: 10px (controles), 16px (cards), 22px (modales).

---

## 6. Iconografía (deben entenderse al instante)

- Estilo: **línea dorada** de grosor consistente, esquinas suaves; los iconos de
  acción crítica pueden ir **embossed** (relieve oro) sobre el botón.
- Set base recomendado: Lucide (re-coloreado a oro) para cobertura; pero los iconos
  clave deben ser **inequívocos**:
  - Cámara/obturador = acción "Iniciar/Tomar foto".
  - Impresora = imprimir; flecha-circular sobre impresora = reimprimir.
  - QR = cuadro QR real (no genérico).
  - Engrane = configuración; Reloj/historial = historial; Plantilla = marco con esquinas.
  - Rayo/diagnóstico, tijera/ahorro papel en Print Sheet, etc.
- Cada icono SIEMPRE acompañado de label de texto en UI operativa (no iconos solos
  ambiguos). El usuario debe entender qué hace un control sin adivinar.

---

## 7. Modos de pantalla (estética por modo)

- **Admin (Dashboard, Eventos, Plantillas, Config, Diagnóstico):** estructura clara,
  sidebar de latón sobre fieltro, cards verdes elevadas, formularios skeuo legibles.
  Densidad media. Aquí vive la complejidad.
- **Operador (durante evento):** botones GRANDES de latón, pocas opciones, estado de
  cámara/impresora siempre visible, cero texto técnico.
- **Invitado (fullscreen):** máxima emoción y claridad: serif/script, countdown
  gigante, flash visual, pose grande, fondo ceremonial. Ninguna acción de admin visible.

---

## 8. Movimiento

- Transiciones de pantalla: 200–300ms ease-out, suaves (considerar View Transitions).
- Countdown: escala+desvanecido por número; "flash" = overlay blanco 120ms.
- Press táctil en botones (ver §5B). 
- Nunca animar de forma que retrase el flujo del evento (`docs/DESIGN_SYSTEM.md`).
- Respetar `prefers-reduced-motion`.

---

## 9. Checklist de conformidad visual (se audita cada fase con UI)

- [ ] Cero hex sueltos: todo color viene de tokens.
- [ ] Fuentes cargadas localmente; jerarquía serif/sans/script respetada.
- [ ] Botones críticos tienen estados hover/active/disabled táctiles.
- [ ] Una sola fuente de luz; sombras coherentes; máx. 2 elevaciones.
- [ ] Iconos inequívocos + label de texto en UI operativa.
- [ ] Estado (cámara/impresión/sesión) = color + icono + texto.
- [ ] Contraste AA (texto crema sobre verde, ink sobre oro) verificado.
- [ ] Modo invitado sin controles de admin; modo evento sin pantallas técnicas.
- [ ] Branding leído de tokens/settings, no hardcodeado.
- [ ] Se ve premium, tangible y "Jardines", no genérico de IA.
