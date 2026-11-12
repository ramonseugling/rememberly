export function giftLink(origin: string, code: string): string {
  return `${origin}/gift-list?list=${code}`;
}

export function giftShareMessage(days: number | null, link: string): string {
  const intro =
    days === null
      ? 'Olha a minha lista de presentes no Rememberly!'
      : days === 0
        ? 'Hoje é o meu aniversário! 🎉 Veja a minha lista de presentes no Rememberly.'
        : days === 1
          ? 'Falta 1 dia para o meu aniversário! 🎂 Veja a minha lista de presentes no Rememberly.'
          : `Faltam ${days} dias para o meu aniversário! 🎂 Veja a minha lista de presentes no Rememberly.`;
  return `${intro} Entra aqui: ${link}`;
}

export function whatsappUrl(
  link: string,
  days: number | null = null,
): { app: string; web: string } {
  const text = encodeURIComponent(giftShareMessage(days, link));
  return {
    app: `whatsapp://send?text=${text}`,
    web: `https://wa.me/?text=${text}`,
  };
}
