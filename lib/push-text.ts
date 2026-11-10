export type DailyPushItem =
  | { kind: 'group_birthday'; name: string }
  | { kind: 'event'; title: string; type: string; days: number }
  | { kind: 'commemorative'; label: string };

const SUMMARY_LABEL_LIMIT = 28;
const SINGLE_LABEL_LIMIT = 60;
const COMMEMORATIVE_LEAD_DAYS = 7;

function truncate(value: string, limit: number) {
  const text = value.trim().replace(/\s+/g, ' ');
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}

function daysLeft(days: number) {
  return days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`;
}

function daysOf(item: DailyPushItem) {
  if (item.kind === 'group_birthday') return 0;
  return item.kind === 'event' ? item.days : COMMEMORATIVE_LEAD_DAYS;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? '';
}

// A birthday event is named after a person, so only the first word is used.
function eventTitle(item: Extract<DailyPushItem, { kind: 'event' }>) {
  return item.type === 'birthday' ? firstName(item.title) : item.title;
}

function summaryLabel(item: DailyPushItem) {
  const raw =
    item.kind === 'group_birthday'
      ? firstName(item.name)
      : item.kind === 'event'
        ? eventTitle(item)
        : item.label;
  return truncate(raw, SUMMARY_LABEL_LIMIT);
}

function singleText(item: DailyPushItem) {
  if (item.kind === 'group_birthday')
    return `Hoje é aniversário de ${truncate(firstName(item.name), SINGLE_LABEL_LIMIT)}! 🎉`;
  if (item.kind === 'commemorative')
    return `${daysLeft(COMMEMORATIVE_LEAD_DAYS)} para ${truncate(item.label, SINGLE_LABEL_LIMIT)}`;
  const title = truncate(eventTitle(item), SINGLE_LABEL_LIMIT);
  if (item.days === 0)
    return item.type === 'birthday'
      ? `Hoje é aniversário de ${title}! 🎉`
      : `Hoje: ${title}`;
  return item.type === 'birthday'
    ? `${daysLeft(item.days)} para o aniversário de ${title}`
    : `${daysLeft(item.days)} para ${title}`;
}

function isBirthday(item: DailyPushItem) {
  return (
    item.kind === 'group_birthday' ||
    (item.kind === 'event' && item.type === 'birthday')
  );
}

/** Builds the body of the one daily push; `total` may exceed `items.length` when refs were capped. */
export function dailyPushText(items: DailyPushItem[], total = items.length) {
  const count = Math.max(total, items.length);
  if (count === 1 && items.length === 1) return singleText(items[0]);
  const labels = items.slice(0, 2).map(summaryLabel);
  const rest = count - labels.length;
  const list =
    rest <= 0 ? labels.join(' e ') : `${labels.join(', ')} e mais ${rest}`;
  const onlyBirthdaysToday =
    items.length === count &&
    items.every((item) => isBirthday(item) && daysOf(item) === 0);
  if (onlyBirthdaysToday) return `Hoje é aniversário de ${list} 🎉`;
  const hasToday = items.some((item) => daysOf(item) === 0);
  return `${count} eventos${hasToday ? ' hoje' : ''}: ${list}`;
}
