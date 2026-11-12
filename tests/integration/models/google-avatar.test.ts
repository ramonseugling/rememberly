import sharp from 'sharp';
import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import googleAvatar from 'models/google-avatar';
import photo from 'models/photo';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

async function png() {
  return sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: '#E53565',
    },
  })
    .png()
    .toBuffer();
}

async function avatarOf(userId: string) {
  const result = await database.query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [userId],
  );
  return result.rows[0].avatar_url as string | null;
}

describe('Google profile photo', () => {
  it('fills an empty avatar', async () => {
    const user = await orchestrator.createUser();

    const url = await photo.setUserAvatarIfEmpty(user.id, await png());

    expect(url).toBeTruthy();
    expect(await avatarOf(user.id)).toBe(url);

    await photo.removeUserAvatar(user.id);
  });

  it('never replaces a photo the person already has', async () => {
    const user = await orchestrator.createUser();
    const own = await photo.setUserAvatar(user.id, await png());

    const result = await photo.setUserAvatarIfEmpty(user.id, await png());

    expect(result).toBeNull();
    expect(await avatarOf(user.id)).toBe(own.avatar_url);

    await photo.removeUserAvatar(user.id);
  });

  it('ignores pictures that are not on Google image hosts', async () => {
    const user = await orchestrator.createUser();

    await googleAvatar.importIfMissing(user.id, 'https://evil.com/photo.png');
    await googleAvatar.importIfMissing(user.id, undefined);

    expect(await avatarOf(user.id)).toBeNull();
  });

  it('does not fail the login when the picture cannot be downloaded', async () => {
    const user = await orchestrator.createUser();

    await expect(
      googleAvatar.importIfMissing(
        user.id,
        'https://lh3.googleusercontent.com/a/this-picture-does-not-exist',
      ),
    ).resolves.toBeUndefined();
    expect(await avatarOf(user.id)).toBeNull();
  });
});
