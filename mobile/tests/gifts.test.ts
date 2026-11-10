import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../src/data/client.ts';
import {
  birthdayCard,
  birthdayCountdown,
  firstName,
  formForGift,
  giftConflict,
  giftHost,
  giftPayload,
} from '../src/features/gifts/model.ts';

test('requires a name and trims every field', () => {
  assert.equal(
    giftPayload({ title: '  ', link: '', description: '' }).error,
    'Informe o nome do presente.',
  );
  assert.deepEqual(
    giftPayload({ title: ' Fone ', link: ' ', description: ' Preto ' }).payload,
    { title: 'Fone', link: null, description: 'Preto' },
  );
});

test('validates sizes and only accepts plain http(s) links', () => {
  const base = { title: 'Fone', link: '', description: '' };
  assert.match(
    giftPayload({ ...base, title: 'a'.repeat(101) }).error ?? '',
    /no máximo 100/,
  );
  assert.match(
    giftPayload({ ...base, description: 'a'.repeat(501) }).error ?? '',
    /no máximo 500/,
  );
  for (const link of [
    'javascript:alert(1)',
    'ftp://x.com',
    'loja',
    'https://user:pw@x.com',
  ])
    assert.match(giftPayload({ ...base, link }).error ?? '', /http/);
  assert.equal(
    giftPayload({ ...base, link: 'https://loja.com/fone' }).error,
    null,
  );
});

test('clears optional fields by sending null when editing', () => {
  const item = {
    id: '1',
    title: 'Fone',
    link: 'https://loja.com',
    description: 'Preto',
    created_at: '',
    updated_at: '',
  };
  const form = { ...formForGift(item), link: '', description: '' };
  assert.deepEqual(giftPayload(form).payload, {
    title: 'Fone',
    link: null,
    description: null,
  });
});

test('counts the days until the next birthday', () => {
  const today = new Date(2026, 10, 9);
  assert.equal(birthdayCountdown(null, 5, today), null);
  assert.deepEqual(birthdayCountdown(9, 11, today), {
    days: 0,
    label: 'Hoje é o seu aniversário! 🎉',
  });
  assert.equal(
    birthdayCountdown(10, 11, today)?.label,
    'Falta 1 dia para o seu aniversário',
  );
  assert.equal(birthdayCountdown(8, 11, today)?.days, 364);
  assert.equal(
    birthdayCountdown(25, 12, today)?.label,
    'Faltam 46 dias para o seu aniversário',
  );
});

test('tells reserved and purchased conflicts apart', () => {
  assert.equal(giftConflict(new ApiError('http', 409, 'reserved')), 'reserved');
  assert.equal(
    giftConflict(new ApiError('http', 409, 'purchased')),
    'purchased',
  );
  assert.equal(giftConflict(new ApiError('http', 409)), null);
  assert.equal(giftConflict(new ApiError('http', 400, 'reserved')), null);
  assert.equal(giftConflict(new Error('x')), null);
});

test('shows the host of a link', () => {
  assert.equal(giftHost('https://www.loja.com.br/p/1?x=2'), 'loja.com.br');
  assert.equal(giftHost('não é link'), 'não é link');
});

test('builds the birthday card with date and age', () => {
  const today = new Date(2026, 10, 9);
  assert.deepEqual(birthdayCard(14, 3, 1995, today), {
    days: 125,
    dateLabel: '14 de março',
    age: 32,
  });
  assert.equal(birthdayCard(9, 11, 1995, today)?.age, 31);
  assert.equal(birthdayCard(9, 11, 1995, today)?.days, 0);
  assert.equal(birthdayCard(14, 3, null, today)?.age, null);
  assert.equal(birthdayCard(null, 3, 1995, today), null);
  assert.equal(firstName('  Ana Maria '), 'Ana');
});

test('builds the shareable gift list link and the WhatsApp message', async () => {
  const { giftLink, whatsappUrl } =
    await import('../src/features/gifts/link.ts');
  const id = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
  const link = giftLink('https://rememberly.com.br', id);
  assert.equal(link, `https://rememberly.com.br/gift-list?user=${id}`);
  const urls = whatsappUrl(link);
  assert.ok(urls.app.startsWith('whatsapp://send?text='));
  assert.ok(urls.web.startsWith('https://wa.me/?text='));
  assert.ok(decodeURIComponent(urls.web).includes(link));
});

test('writes the birthday page headline and group chip', async () => {
  const { birthdayHeadline, groupsLabel } =
    await import('../src/features/gifts/birthday-copy.ts');
  assert.equal(birthdayHeadline('Marina', 0), 'Hoje é o dia de Marina! 🎉');
  assert.equal(
    birthdayHeadline('Rafael', 1),
    'O aniversário de Rafael é amanhã',
  );
  assert.equal(
    birthdayHeadline('Rafael', 7),
    'O aniversário de Rafael é em 7 dias',
  );
  assert.equal(birthdayHeadline('Rafael', null), 'Aniversário de Rafael');
  assert.equal(groupsLabel([]), '');
  assert.equal(groupsLabel(['Amigos']), 'Amigos');
  assert.equal(groupsLabel(['Amigos', 'Time']), 'Amigos e mais 1 grupo');
  assert.equal(groupsLabel(['A', 'B', 'C']), 'A e mais 2 grupos');
});

test('giftFieldsChanged ignores identical text and normalises empty values', async () => {
  const { giftFieldsChanged } = await import('../src/features/gifts/model.ts');
  const item = {
    id: '1',
    title: 'Fone',
    link: null,
    description: null,
    created_at: '',
    updated_at: '',
  };
  assert.equal(
    giftFieldsChanged(item, { title: 'Fone', link: null, description: null }),
    false,
  );
  assert.equal(
    giftFieldsChanged(item, { title: 'Fone 2', link: null, description: null }),
    true,
  );
  assert.equal(
    giftFieldsChanged(item, {
      title: 'Fone',
      link: 'https://a.com',
      description: null,
    }),
    true,
  );
});
