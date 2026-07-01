# MH Photo Booth · Web (folios)

Página web para que los invitados de un evento **descarguen su foto/video** con un **número de folio**
(o QR). Proyecto **separado pero conectado** al software de escritorio *MH Photo Booth Studio*.

> Lee `CONTEXT.md` (y `docs/`) antes de trabajar — es el documento de transferencia de esta web.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Vercel · Vercel Blob (medios).

## Desarrollo local
```bash
npm install
npm run dev      # http://localhost:3000
```
Sin `BLOB_READ_WRITE_TOKEN`, los medios se guardan en `./.data` (solo local).

## Rutas
- `/` — ingresar folio.
- `/f/[folio]` — galería + descarga (folio de evento = todo; folio individual = solo ese).
- `/admin` — panel básico del anfitrión.
- `POST /api/event` — crea evento (software) → `{ eventFolio }`.
- `POST /api/upload` — sube medio (software, multipart: file, eventFolio, type, name) → `{ folio, url, page }`.
- `GET /api/media/[folio]` — JSON de medios por folio.

## Deploy a Vercel
1. `vercel login` o importa este repo en el dashboard de Vercel.
2. Crea un **Blob Store** (genera `BLOB_READ_WRITE_TOKEN`) y define `UPLOAD_API_KEY`.
3. Deploy (`vercel --prod` o push a `main`). Copia la URL y configúrala en el software.

## Variables de entorno
Ver `.env.example`.

## Estado
Fundación v0.1: folio + descarga + API de subida + almacenamiento (local/Blob). Pendiente: KV/Postgres
para el índice en alta concurrencia, panel admin completo, superposiciones de video. Ver `CONTEXT.md`.
