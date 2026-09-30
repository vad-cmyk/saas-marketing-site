import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

async function resizeAndCompress(
  file: File,
  maxDimension: number,
  quality: number,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not create image blob'));
      },
      format,
      quality,
    );
  });
}

// Matches the mobile app's resize target (1600px wide, quality 0.7) so an
// item's photos look consistent regardless of which platform added them.
export async function uploadPhoto(file: File, itemId: string): Promise<string> {
  const blob = await resizeAndCompress(file, 1600, 0.7);
  const path = `${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from('inventory')
    .upload(path, blob, { contentType: 'image/jpeg' });

  if (error) throw error;
  return path;
}

// Smaller/lower-quality than uploadPhoto's output — this only feeds the AI
// vision suggestion call, not the catalogue photo itself, so keep the
// payload (and cost) down, matching the app's same tradeoff.
export async function getPhotoBase64ForSuggestion(file: File): Promise<string> {
  const blob = await resizeAndCompress(file, 600, 0.5);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix — the Edge Function
      // expects a bare base64 string, matching what the app already sends.
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Matches the mobile app's logo output (400px wide, PNG, quality 0.8) —
// PNG specifically, not JPEG: logos are routinely uploaded with a
// transparent background, and JPEG would flatten that to solid white or
// black.
export async function uploadLogo(file: File, orgId: string): Promise<string> {
  const blob = await resizeAndCompress(file, 400, 0.8, 'image/png');
  const path = `org-logos/${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;

  const { error } = await supabase.storage
    .from('inventory')
    .upload(path, blob, { contentType: 'image/png' });

  if (error) throw error;
  return path;
}
