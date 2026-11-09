import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import broadcast from 'models/broadcast';
import {
  preferences,
  setEmailMarketing,
} from 'models/notification-preferences';
import user from 'models/user';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('notification preferences', () => {
  it('creates a default row when a user signs up, honoring the marketing consent', async () => {
    const consenting = await user.create({
      name: 'Ana',
      email: 'ana-prefs@example.com',
      password: 'safe-password-1',
      birth_day: 1,
      birth_month: 1,
      birth_year: 2000,
      marketing_consent: true,
    });
    const declining = await user.create({
      name: 'Bia',
      email: 'bia-prefs@example.com',
      password: 'safe-password-1',
      birth_day: 2,
      birth_month: 2,
      birth_year: 2000,
      marketing_consent: false,
    });

    expect(await preferences(consenting.id)).toMatchObject({
      push_enabled: false,
      email_events: true,
      email_marketing: true,
    });
    expect(await preferences(declining.id)).toMatchObject({
      push_enabled: false,
      email_events: true,
      email_marketing: false,
    });
  });

  it('updates only the provided preferences', async () => {
    const created = await orchestrator.createUser();

    expect(
      await preferences(created.id, { email_events: false }),
    ).toMatchObject({
      push_enabled: false,
      email_events: false,
      email_marketing: true,
    });
    expect(await preferences(created.id, { push_enabled: true })).toMatchObject(
      {
        push_enabled: true,
        email_events: false,
      },
    );
  });

  it('keeps unsubscribed users out of broadcasts, including users without a preference row', async () => {
    const withRow = await orchestrator.createUser();
    const optedOut = await orchestrator.createUser();
    const legacyOptOut = await orchestrator.createUser({
      marketing_consent: false,
    });
    await setEmailMarketing(optedOut.id, false);

    const recipients = await database.query(
      `SELECT u.id FROM users u
       LEFT JOIN notification_preferences np ON np.user_id = u.id
       WHERE COALESCE(np.email_marketing, u.marketing_consent)`,
    );
    const ids = recipients.rows.map((row: { id: string }) => row.id);

    expect(ids).toContain(withRow.id);
    expect(ids).not.toContain(optedOut.id);
    expect(ids).not.toContain(legacyOptOut.id);
    expect(await broadcast.countRecipients('test-announcement')).toBe(
      ids.length,
    );
  });
});
