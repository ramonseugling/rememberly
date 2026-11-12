import { log } from 'next-axiom';
import database from 'infra/database';
import photo, { MAX_PHOTO_BYTES } from 'models/photo';

const DOWNLOAD_TIMEOUT_MS = 5000;

// Only Google's own image host is fetched, over HTTPS, so a profile value
// can never point the server at another address.
export function googlePictureUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      !(
        url.hostname === 'googleusercontent.com' ||
        url.hostname.endsWith('.googleusercontent.com')
      )
    )
      return null;
    // Google serves 96 px by default; ask for the size we store.
    return url.toString().replace(/=s\d+(-c)?$/, '=s512-c');
  } catch {
    return null;
  }
}

async function download(url: string): Promise<Buffer | null> {
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) return null;
  const type = response.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.length > 0 && bytes.length <= MAX_PHOTO_BYTES ? bytes : null;
}

// Best effort: a missing or failing picture never blocks the login, and a
// photo the person uploaded is never replaced.
async function importIfMissing(userId: string, picture: unknown) {
  const url = googlePictureUrl(picture);
  if (!url) return;
  try {
    const current = await database.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [userId],
    );
    if (!current.rows[0] || current.rows[0].avatar_url) return;
    const bytes = await download(url);
    if (!bytes) return;
    await photo.setUserAvatarIfEmpty(userId, bytes);
  } catch (error) {
    log.warn('google_avatar_import_failed', { userId, error: String(error) });
  }
}

const googleAvatar = { importIfMissing };

export default googleAvatar;
