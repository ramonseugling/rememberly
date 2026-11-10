export type OnboardingStepId =
  | 'welcome'
  | 'events'
  | 'groups'
  | 'gifts'
  | 'profile';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  description: string;
  action: string;
  skippable: boolean;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Lembre das datas. Fortaleça conexões.',
    description:
      'O Rememberly avisa você dos aniversários e datas importantes de família, amigos e colegas.',
    action: 'Vamos lá',
    skippable: true,
  },
  {
    id: 'events',
    title: 'Seus eventos',
    description:
      'Crie, visualize e edite eventos para nunca mais esquecer uma data importante.',
    action: 'Avançar',
    skippable: true,
  },
  {
    id: 'groups',
    title: 'Celebre em grupo',
    description:
      'Crie grupos com amigos e família: os aniversários são compartilhados e todos recebem a notificação.',
    action: 'Avançar',
    skippable: true,
  },
  {
    id: 'gifts',
    title: 'Sua lista de presentes',
    description:
      'Monte sua lista, compartilhe com seus grupos e deixe os amigos reservarem um presente em segredo.',
    action: 'Avançar',
    skippable: true,
  },
  {
    id: 'profile',
    title: 'Seu perfil',
    description:
      'Edite seus dados, sua foto e escolha como quer receber as notificações.',
    action: 'Começar',
    skippable: false,
  },
];

export function isLastStep(index: number): boolean {
  return index >= ONBOARDING_STEPS.length - 1;
}

export function nextStepIndex(index: number): number {
  return Math.min(index + 1, ONBOARDING_STEPS.length - 1);
}

export function onboardingStorageKey(
  environment: string,
  origin: string,
  userId: string,
): string {
  const suffix = Array.from(origin)
    .map((character) => character.charCodeAt(0).toString(16))
    .join('');
  const user = userId.replace(/[^a-zA-Z0-9._-]/g, '');
  return `rememberly.onboarding.${environment}.${suffix}.${user}`;
}

export function parseOnboardingSeen(raw: string | null): boolean {
  return raw === '1';
}
