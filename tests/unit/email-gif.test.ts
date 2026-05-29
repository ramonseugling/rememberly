import { eventGifUrl } from 'models/email';

const APP_URL = process.env.APP_URL ?? 'https://www.rememberly.com.br';

describe('eventGifUrl', () => {
  it('builds the URL with a two-digit month for anniversary types', () => {
    expect(eventGifUrl('birthday', 6)).toBe(
      `${APP_URL}/images/email/gifs/birthday/06.gif`,
    );
    expect(eventGifUrl('dating_anniversary', 12)).toBe(
      `${APP_URL}/images/email/gifs/dating_anniversary/12.gif`,
    );
    expect(eventGifUrl('wedding_anniversary', 1)).toBe(
      `${APP_URL}/images/email/gifs/wedding_anniversary/01.gif`,
    );
  });

  it('returns null for types without a GIF', () => {
    expect(eventGifUrl('celebration', 6)).toBeNull();
    expect(eventGifUrl('custom', 6)).toBeNull();
    expect(eventGifUrl('desconhecido', 6)).toBeNull();
  });
});
