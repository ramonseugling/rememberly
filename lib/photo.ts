export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const FORMAT_ERROR = 'Formato inválido. Envie uma imagem JPEG, PNG ou WebP.';
const SIZE_ERROR = 'A imagem é muito grande. O tamanho máximo é 2 MB.';
const NETWORK_ERROR =
  'Não foi possível conectar. Verifique sua internet e tente novamente.';

// Mirrors the server rules for fast feedback; the server remains the authority.
export function validatePhotoFile(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) return FORMAT_ERROR;
  if (file.size > MAX_PHOTO_BYTES) return SIZE_ERROR;
  return null;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data.message === 'string' ? data.message : fallback;
  } catch {
    return response.status === 413 ? SIZE_ERROR : fallback;
  }
}

export async function uploadPhoto(
  endpoint: string,
  file: File,
  responseKey: 'avatar_url' | 'photo_url',
): Promise<{ url: string } | { error: string }> {
  try {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!response.ok) {
      return {
        error: await readError(response, 'Não foi possível enviar a foto.'),
      };
    }
    const data = await response.json();
    return { url: data[responseKey] as string };
  } catch {
    return { error: NETWORK_ERROR };
  }
}

export async function deletePhoto(
  endpoint: string,
): Promise<{ error: string } | null> {
  try {
    const response = await fetch(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      return {
        error: await readError(response, 'Não foi possível remover a foto.'),
      };
    }
    return null;
  } catch {
    return { error: NETWORK_ERROR };
  }
}
