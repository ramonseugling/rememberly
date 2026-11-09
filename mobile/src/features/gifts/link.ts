export function giftLink(origin: string, userId: string): string {
  return `${origin}/gift-list?user=${userId}`;
}

export function whatsappUrl(link: string): { app: string; web: string } {
  const text = encodeURIComponent(
    `Veja a minha lista de presentes no Rememberly: ${link}`,
  );
  return {
    app: `whatsapp://send?text=${text}`,
    web: `https://wa.me/?text=${text}`,
  };
}
