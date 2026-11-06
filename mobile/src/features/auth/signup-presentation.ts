export function otpCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6);
}
