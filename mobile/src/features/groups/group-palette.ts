import { tokens } from '../../design-system/tokens.ts';

export function groupColors(groupId: string) {
  let sum = 0;
  for (const character of groupId) sum += character.charCodeAt(0);
  return tokens.groupPalette[sum % tokens.groupPalette.length]!;
}
