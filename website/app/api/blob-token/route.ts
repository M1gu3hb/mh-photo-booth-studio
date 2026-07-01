import { NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const runtime = 'nodejs';

/**
 * Issues short-lived client tokens so the desktop app uploads large media
 * DIRECTLY to Vercel Blob (bypasses the ~4.5 MB serverless body limit; supports
 * multipart under the hood). Auth: the API key travels in clientPayload and
 * must match UPLOAD_API_KEY. After uploading, the desktop registers the media
 * via /api/register-media to get its folio.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const expected = process.env.UPLOAD_API_KEY;
        let provided = '';
        try {
          provided = (JSON.parse(clientPayload ?? '{}') as { apiKey?: string }).apiKey ?? '';
        } catch {
          provided = '';
        }
        if (expected && provided !== expected) {
          throw new Error('unauthorized');
        }
        if (!pathname.startsWith('media/')) {
          throw new Error('invalid pathname');
        }
        return {
          allowedContentTypes: ['video/webm', 'video/mp4', 'video/quicktime', 'image/png', 'image/jpeg'],
          addRandomSuffix: false,
          maximumSizeInBytes: 500 * 1024 * 1024,
          tokenPayload: ''
        };
      },
      // Registration happens explicitly from the desktop (register-media),
      // so the completion webhook has nothing extra to do.
      onUploadCompleted: async () => undefined
    });
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'token failed' },
      { status: err instanceof Error && err.message === 'unauthorized' ? 401 : 400 }
    );
  }
}
