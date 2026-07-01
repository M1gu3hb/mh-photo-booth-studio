/** Loads an image (data URL or path) into a decoded HTMLImageElement. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
    img.src = src;
  });
}

export async function canvasBytes(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<ArrayBuffer> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
  if (!blob) throw new Error('No se pudo exportar la imagen.');
  return blob.arrayBuffer();
}
