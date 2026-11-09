import { ApiError } from '../../data/client.ts';
import type { GiftItem } from './model.ts';

export type Availability = 'available' | 'reserved' | 'purchased';

export interface MemberGiftItem extends GiftItem {
  availability: Availability;
  reserved_by_me: boolean;
}

export interface MemberList {
  owner: {
    id: string;
    name: string;
    avatar_url: string | null;
    birth_day: number | null;
    birth_month: number | null;
  };
  items: MemberGiftItem[];
}

export interface VisibleOwners {
  owners: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    item_count: number;
  }[];
}

export type ReserveAction = 'reserve' | 'purchase' | 'cancel';

export function reserveActions(item: MemberGiftItem): ReserveAction[] {
  if (item.availability === 'available') return ['reserve', 'purchase'];
  if (!item.reserved_by_me) return [];
  return item.availability === 'reserved' ? ['purchase', 'cancel'] : ['cancel'];
}

export function availabilityLabel(item: MemberGiftItem): string | null {
  if (item.availability === 'available') return null;
  if (item.availability === 'reserved')
    return item.reserved_by_me ? 'Reservado por você' : 'Reservado';
  return item.reserved_by_me ? 'Você comprou' : 'Comprado';
}

export function reserveRequest(
  itemId: string,
  action: ReserveAction,
): { path: string; method: 'PUT' | 'DELETE'; body?: { status: string } } {
  const path = `/api/v1/gifts/${itemId}/reservation`;
  if (action === 'cancel') return { path, method: 'DELETE' };
  return {
    path,
    method: 'PUT',
    body: { status: action === 'reserve' ? 'reserved' : 'purchased' },
  };
}

export function reserveError(error: unknown): string {
  if (error instanceof ApiError && error.status === 409)
    return 'Outra pessoa acabou de reservar este presente.';
  if (error instanceof ApiError && error.status === 404)
    return 'Este presente não está mais disponível.';
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível concluir. Tente novamente.';
}

export function isWebLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

export function ownerFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
