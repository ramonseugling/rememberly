import { type DailyPushItem, dailyPushText } from '@/lib/push-text';

const event = (title: string, days = 0, type = 'custom'): DailyPushItem => ({
  kind: 'event',
  title,
  type,
  days,
});
const group = (name: string): DailyPushItem => ({
  kind: 'group_birthday',
  name,
});
const commemorative = (label: string): DailyPushItem => ({
  kind: 'commemorative',
  label,
});

describe('single item', () => {
  test.each<[DailyPushItem, string]>([
    [group('Marina Souza'), 'Hoje é aniversário de Marina! 🎉'],
    [event('Pedro', 0, 'birthday'), 'Hoje é aniversário de Pedro! 🎉'],
    [event('Namoro com Ana', 0, 'dating_anniversary'), 'Hoje: Namoro com Ana'],
    [
      event('Pedro', 3, 'birthday'),
      'Faltam 3 dias para o aniversário de Pedro',
    ],
    [event('Pedro', 1, 'birthday'), 'Falta 1 dia para o aniversário de Pedro'],
    [
      event('Casamento', 7, 'wedding_anniversary'),
      'Faltam 7 dias para Casamento',
    ],
    [
      event('Casamento', 1, 'wedding_anniversary'),
      'Falta 1 dia para Casamento',
    ],
    [commemorative('Dia das Mães'), 'Faltam 7 dias para Dia das Mães'],
  ])('%j', (item, expected) => {
    expect(dailyPushText([item])).toBe(expected);
  });

  test('very long titles are truncated', () => {
    expect(dailyPushText([event('x'.repeat(200))]).length).toBeLessThan(80);
  });
});

describe('several items', () => {
  test('two items list both labels', () => {
    expect(dailyPushText([group('Marina Souza'), event('Jantar')])).toBe(
      '2 eventos hoje: Marina e Jantar',
    );
  });

  test('three or more items show two labels and the remainder', () => {
    expect(
      dailyPushText([event('A'), event('B'), event('C'), event('D')]),
    ).toBe('4 eventos hoje: A, B e mais 2');
  });

  test('items that are all in the future use the plain header', () => {
    expect(dailyPushText([event('Ana', 3), commemorative('Natal')])).toBe(
      '2 eventos: Ana e Natal',
    );
    expect(
      dailyPushText([event('Ana', 3), commemorative('Natal'), event('B', 7)]),
    ).toBe('3 eventos: Ana, Natal e mais 1');
  });

  test('one item today is enough for the "para hoje" header', () => {
    expect(dailyPushText([event('Ana', 3), event('Jantar')])).toBe(
      '2 eventos hoje: Ana e Jantar',
    );
  });

  test('labels are truncated to 28 characters and the body stays short', () => {
    const body = dailyPushText([
      event('a'.repeat(50)),
      event('b'.repeat(50)),
      event('c'),
    ]);
    expect(body).toBe(
      `3 eventos hoje: ${'a'.repeat(27)}…, ${'b'.repeat(27)}… e mais 1`,
    );
    expect(body.length).toBeLessThan(140);
  });

  test('a total above the stored items is honoured', () => {
    expect(dailyPushText([event('A'), event('B'), event('C')], 14)).toBe(
      '14 eventos hoje: A, B e mais 12',
    );
  });
});

describe('first word of a person name', () => {
  test('birthday events use only the first word, alone or in a summary', () => {
    expect(
      dailyPushText([event('Pedro Henrique da Silva', 0, 'birthday')]),
    ).toBe('Hoje é aniversário de Pedro! 🎉');
    expect(
      dailyPushText([event('Pedro Henrique da Silva', 3, 'birthday')]),
    ).toBe('Faltam 3 dias para o aniversário de Pedro');
    expect(
      dailyPushText([
        event('Ana Clara Souza', 0, 'birthday'),
        group('Marina Souza'),
      ]),
    ).toBe('Hoje é aniversário de Ana e Marina 🎉');
  });

  test('other event types keep the whole title', () => {
    expect(dailyPushText([event('Jantar com a família')])).toBe(
      'Hoje: Jantar com a família',
    );
    expect(
      dailyPushText([event('Jantar com a família'), event('Casamento')]),
    ).toBe('2 eventos hoje: Jantar com a família e Casamento');
  });
});

describe('only birthdays today', () => {
  test('use the birthday sentence instead of a count', () => {
    expect(dailyPushText([group('Ana Souza'), group('Bruno Lima')])).toBe(
      'Hoje é aniversário de Ana e Bruno 🎉',
    );
    expect(dailyPushText([group('Ana'), group('Bruno'), group('Carla')])).toBe(
      'Hoje é aniversário de Ana, Bruno e mais 1 🎉',
    );
  });

  test('a birthday in the future, or any other event, falls back to the count', () => {
    expect(dailyPushText([group('Ana'), event('Bruno', 3, 'birthday')])).toBe(
      '2 eventos hoje: Ana e Bruno',
    );
    expect(dailyPushText([group('Ana'), event('Jantar')])).toBe(
      '2 eventos hoje: Ana e Jantar',
    );
  });

  test('a capped list never claims every item is a birthday', () => {
    expect(dailyPushText([group('Ana'), group('Bruno')], 12)).toBe(
      '12 eventos hoje: Ana, Bruno e mais 10',
    );
  });
});
