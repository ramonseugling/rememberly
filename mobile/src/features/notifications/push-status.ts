export type PushStatus = 'on' | 'off' | 'denied' | 'unsupported';

export interface PermissionSnapshot {
  granted: boolean;
  canAskAgain: boolean;
}

export function pushStatus(input: {
  pushEnabled: boolean;
  permission: PermissionSnapshot | null;
  unsupported: boolean;
}): PushStatus {
  if (input.unsupported) return 'unsupported';
  const blocked =
    !!input.permission &&
    !input.permission.granted &&
    !input.permission.canAskAgain;
  if (blocked) return 'denied';
  return input.pushEnabled ? 'on' : 'off';
}

export function pushStatusCopy(status: PushStatus): {
  title: string;
  description: string;
} {
  switch (status) {
    case 'on':
      return {
        title: 'Push neste aparelho',
        description: 'Ativadas. Gerencie nas configurações do aparelho.',
      };
    case 'denied':
      return {
        title: 'Push bloqueado neste aparelho',
        description:
          'O acesso às notificações está bloqueado. Libere nas configurações do aparelho.',
      };
    case 'unsupported':
      return {
        title: 'Push indisponível neste ambiente',
        description:
          'Use uma versão instalada do app em um aparelho físico para receber push.',
      };
    default:
      return {
        title: 'Push desativado neste aparelho',
        description: 'Ative para receber os lembretes mesmo com o app fechado.',
      };
  }
}
