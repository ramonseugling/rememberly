import orchestrator from 'tests/orchestrator';
import database from 'infra/database';
import gift, { MAX_GIFT_ITEMS, normalizeGiftItem } from 'models/gift';

beforeAll(async () => {
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('gift list persistence', () => {
  it('creates exactly one list per user, lazily and idempotently', async () => {
    const user = await orchestrator.createUser();

    const first = await gift.ensureList(user.id);
    const second = await gift.ensureList(user.id);

    expect(second.id).toBe(first.id);
    const rows = await database.query(
      'SELECT id FROM gift_lists WHERE user_id = $1',
      [user.id],
    );
    expect(rows.rows).toHaveLength(1);
  });

  it('stores items with optional link and description, newest first', async () => {
    const user = await orchestrator.createUser();

    await gift.createItem(user.id, { title: 'Livro de receitas' });
    await gift.createItem(user.id, {
      title: ' Fone de ouvido ',
      link: 'https://loja.example.com/fone',
      description: 'Na cor preta',
    });

    const items = await gift.findItemsByUserId(user.id);
    expect(items.map((item) => item.title)).toEqual([
      'Fone de ouvido',
      'Livro de receitas',
    ]);
    expect(items[0]).toMatchObject({
      link: 'https://loja.example.com/fone',
      description: 'Na cor preta',
    });
    expect(items[1]).toMatchObject({ link: null, description: null });
  });

  it('keeps each list private to its owner', async () => {
    const owner = await orchestrator.createUser();
    const other = await orchestrator.createUser();
    await gift.createItem(owner.id, { title: 'Presente do dono' });

    expect(await gift.findItemsByUserId(other.id)).toEqual([]);
    expect(await gift.findItemsByUserId(owner.id)).toHaveLength(1);
  });

  it('refuses the 51st item and still honors the limit under concurrency', async () => {
    const user = await orchestrator.createUser();
    for (let index = 0; index < MAX_GIFT_ITEMS - 2; index += 1)
      await gift.createItem(user.id, { title: `Item ${index}` });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, (_, index) =>
        gift.createItem(user.id, { title: `Concorrente ${index}` }),
      ),
    );

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(rejected).toHaveLength(3);
    expect(rejected[0]!.reason.message).toBe('Sua lista já tem 50 presentes.');
    expect(await gift.findItemsByUserId(user.id)).toHaveLength(MAX_GIFT_ITEMS);
  });

  it('removes the list and its items when the account is deleted', async () => {
    const user = await orchestrator.createUser();
    await gift.createItem(user.id, { title: 'Some com a conta' });

    await database.query('DELETE FROM users WHERE id = $1', [user.id]);

    const lists = await database.query(
      'SELECT id FROM gift_lists WHERE user_id = $1',
      [user.id],
    );
    expect(lists.rows).toHaveLength(0);
    const orphans = await database.query(
      `SELECT i.id FROM gift_items i
       LEFT JOIN gift_lists l ON l.id = i.list_id WHERE l.id IS NULL`,
    );
    expect(orphans.rows).toHaveLength(0);
  });
});

describe('gift item validation', () => {
  it('requires a name and limits sizes', () => {
    expect(() => normalizeGiftItem({ title: '   ' })).toThrow(
      'O nome do presente é obrigatório.',
    );
    expect(() => normalizeGiftItem({ title: 'a'.repeat(101) })).toThrow(
      /no máximo 100/,
    );
    expect(() =>
      normalizeGiftItem({ title: 'ok', description: 'a'.repeat(501) }),
    ).toThrow(/no máximo 500/);
  });

  it('accepts only plain http(s) links without credentials', () => {
    for (const link of [
      'javascript:alert(1)',
      'ftp://exemplo.com/arquivo',
      'not a url',
      'https://user:pass@exemplo.com',
      `https://exemplo.com/${'a'.repeat(2000)}`,
    ])
      expect(() => normalizeGiftItem({ title: 'ok', link })).toThrow(
        'O link do presente é inválido.',
      );
    expect(
      normalizeGiftItem({ title: 'ok', link: ' https://exemplo.com/x ' }).link,
    ).toBe('https://exemplo.com/x');
    expect(normalizeGiftItem({ title: 'ok', link: '  ' }).link).toBeNull();
  });
});
