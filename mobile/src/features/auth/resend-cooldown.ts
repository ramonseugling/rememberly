import { useEffect, useState } from 'react';

export const RESEND_SECONDS = 60;

export function resendLabel(cooldown: number): string {
  return cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar';
}

export function useResendCooldown() {
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  return {
    cooldown,
    start: () => setCooldown(RESEND_SECONDS),
    label: resendLabel(cooldown),
  };
}
