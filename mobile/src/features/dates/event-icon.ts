import { Cake, Gift, Heart, PartyPopper } from 'lucide-react-native';
import type { AgendaItem } from './model';

export function eventIcon(type: AgendaItem['type']) {
  if (type === 'birthday') return Cake;
  if (type.includes('anniversary')) return Heart;
  if (type === 'celebration') return PartyPopper;
  return Gift;
}
