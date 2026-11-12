export interface PersonName {
  first_name: string;
  last_name: string | null;
  name: string;
}

export function splitName(fullName: string): PersonName {
  const name = fullName.trim().replace(/\s+/g, ' ');
  const [first = '', ...rest] = name.split(' ');
  return {
    first_name: first,
    last_name: rest.length ? rest.join(' ') : null,
    name,
  };
}

export function joinName(firstName: string, lastName?: string | null) {
  return [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

export function resolveName(input: {
  name?: string;
  first_name?: string;
  last_name?: string | null;
}): PersonName | null {
  if (input.first_name !== undefined) {
    const first = input.first_name.trim();
    const last = input.last_name?.trim() || null;
    return { first_name: first, last_name: last, name: joinName(first, last) };
  }
  return input.name !== undefined ? splitName(input.name) : null;
}
