# CONTEXT.md — MH Photo Booth · Página Web (folios)

> **Documento principal de transferencia de la PÁGINA WEB.** Este es un proyecto **separado** del
> software de escritorio, pero **conectado** a él. Cualquier sesión/IA nueva que trabaje en la web debe
> leer este archivo primero. Mantener siempre actualizado, claro y accionable. NO copiar los MDs del
> software: la web tiene los suyos propios.

---

## 1. Objetivo

Página web pública y **elegante** donde los invitados de un evento **descargan su foto/video** con un
**número de folio** (y/o un **QR**). Cada evento tiene su propio folio maestro; cada foto/video final
tiene su folio individual. El anfitrión, con el folio del evento, ve **todo** lo del evento; el invitado,
con su folio individual, ve **solo lo suyo**.

Fuente de los medios: el **software de escritorio MH Photo Booth Studio** (cabina de fotos + modo
videos 360°) sube las fotos finales y los videos aquí vía API, por evento y con folios.

## 2. Estado actual

**Fundación v0.1 (en construcción).** Next.js (App Router) + TypeScript + Tailwind, desplegable a Vercel.
- Home: ingresar folio.
- `/f/[folio]`: galería + descarga (invitado = su medio; evento = todos).
- `/admin`: panel simple (folio de evento → todo).
- API: `POST /api/upload` (software → web), `GET /api/media/[folio]`.
- **Almacenamiento:** abstracción `lib/storage` (local en dev, Vercel Blob en prod) + índice de folios
  (`lib/db`, JSON local en dev / Vercel KV o Postgres en prod). _Wiring de nube pendiente de credenciales._

**Pendiente:** almacenamiento en nube real (Vercel Blob/KV), autenticación admin, superposiciones de
video, panel admin completo, integración final con el software.

## 3. Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · Vercel (hosting) · Vercel Blob
(medios, prod) · almacén de folios (KV/Postgres en prod; JSON en dev). Sin backend propio: todo en
Next API routes + storage de Vercel.

## 4. Arquitectura

- `app/` — rutas (home, `/f/[folio]`, `/admin`) + `app/api/*` (upload, media).
- `lib/storage.ts` — guardar/leer binarios (local FS ↔ Vercel Blob según `BLOB_READ_WRITE_TOKEN`).
- `lib/db.ts` — índice folio→medios y evento→folios (JSON en dev; KV/Postgres en prod).
- `lib/folio.ts` — generación de folios legibles y únicos.
- `components/` — UI elegante (verde/oro, acorde a la marca).
- Auth: la subida desde el software usa `UPLOAD_API_KEY`; las páginas de folio son de solo lectura por folio.

## 5. Flujos

1. **Subida (software → web):** el software hace `POST /api/upload` (con `x-api-key`) con el binario +
   metadatos (eventFolio, tipo foto/video, nombre). La web guarda el medio, genera folio individual y
   lo asocia al evento. Responde `{ folio, url, qrUrl }`.
2. **Invitado:** entra a la web (o escanea QR) → pone su folio → ve/descarga su medio.
3. **Anfitrión/Admin:** pone el folio del evento → ve todos los medios del evento.

## 6. Folios

- **Folio de evento:** corto, memorable (ej. `MH-7Q2K`). Uno por evento.
- **Folio individual:** derivado del de evento + secuencia/hash (ej. `MH-7Q2K-0007`).
- QR = URL directa a `/f/<folioIndividual>` (o al de evento para el anfitrión).

## 7. Conexión con el software

El software (repo `mh-photo-booth-studio`) sube medios por API. La URL base de la web y la `UPLOAD_API_KEY`
se configuran en el software (sección "Página web / Nube"). Este repo es independiente y se despliega solo.

## 8. Variables de entorno (Vercel)

- `UPLOAD_API_KEY` — clave que el software usa para subir (obligatoria en prod).
- `BLOB_READ_WRITE_TOKEN` — token de Vercel Blob (medios en prod). Sin él, usa disco local (solo dev).
- (Opcional) `KV_*` / `POSTGRES_*` — índice de folios en prod.
- `NEXT_PUBLIC_SITE_URL` — URL pública del sitio (para armar QR/enlaces).

## 9. Cómo desplegar a Vercel

1. `vercel login` (o importar este repo desde el dashboard de Vercel).
2. En el proyecto de Vercel: agregar **Blob Store** (crea `BLOB_READ_WRITE_TOKEN`) y definir `UPLOAD_API_KEY`.
3. `vercel --prod` (o deploy automático al hacer push a `main`).
4. Copiar la URL pública → configurarla en el software.

## 10. No romper

- Un invitado **nunca** debe ver medios de otro (aislar por folio).
- Sin PII innecesaria; sin credenciales en el repo (usar env vars).
- Las páginas de folio son de solo lectura; subir requiere `UPLOAD_API_KEY`.
- Diseño elegante (no genérico): verde/oro, tipografía con carácter.

## 11. Última actualización

**2026-06-30** — Creación de la fundación de la web (Next.js + MDs de contexto). Sin nube conectada aún.
