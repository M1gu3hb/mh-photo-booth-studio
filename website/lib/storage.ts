import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Binary + text storage abstraction.
 * - Production (Vercel): uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
 * - Dev / no token: writes under ./.data (local filesystem) and serves media
 *   from /api/file/<key>. Local storage is NOT persistent on serverless — for
 *   production always configure a Blob store.
 */

const LOCAL_ROOT = path.join(process.cwd(), '.data');
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function ensureDir(file: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
}

function localPath(key: string): string {
  // Prevent path traversal; keys are app-generated but be safe.
  const safe = key.replace(/\.\.+/g, '').replace(/^\/+/, '');
  return path.join(LOCAL_ROOT, safe);
}

export interface StoredMedia {
  key: string;
  url: string;
}

/** Store a binary and return a public URL. */
export async function putBinary(key: string, data: Buffer, contentType: string): Promise<StoredMedia> {
  if (useBlob) {
    const { put } = await import('@vercel/blob');
    const res = await put(key, data, { access: 'public', contentType, addRandomSuffix: false });
    return { key, url: res.url };
  }
  const file = localPath(key);
  await ensureDir(file);
  await fs.writeFile(file, data);
  return { key, url: `/api/file/${key}` };
}

export async function getBinary(key: string): Promise<Buffer | null> {
  if (useBlob) {
    // In prod, media is served by its Blob URL directly; this path is dev-only.
    return null;
  }
  try {
    return await fs.readFile(localPath(key));
  } catch {
    return null;
  }
}

export async function putText(key: string, text: string): Promise<void> {
  if (useBlob) {
    const { put } = await import('@vercel/blob');
    await put(key, text, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false
    });
    return;
  }
  const file = localPath(key);
  await ensureDir(file);
  await fs.writeFile(file, text, 'utf-8');
}

export async function getText(key: string): Promise<string | null> {
  if (useBlob) {
    const base = process.env.BLOB_PUBLIC_BASE_URL;
    if (!base) return null;
    try {
      const res = await fetch(`${base}/${key}`, { cache: 'no-store' });
      return res.ok ? await res.text() : null;
    } catch {
      return null;
    }
  }
  try {
    return await fs.readFile(localPath(key), 'utf-8');
  } catch {
    return null;
  }
}

export const storageMode = useBlob ? 'blob' : 'local';
