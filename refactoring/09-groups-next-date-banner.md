# 09 — Banner de próxima data dos grupos

## Objetivo

Criar o banner gradiente laranja/rosa que aparece abaixo das stats na página de Grupos, mostrando a próxima data de aniversário entre todos os grupos do usuário.

## Mockup de referência

`refactoring/groups-page.jpeg` — banner abaixo das stats:

- Fundo `gradient-warm` (laranja → rosa)
- Texto branco: "Próxima data em 6 dias!" (título) / "Lucas Pereira Feliciano faz aniversário em 3 de Maio no grupo Treinasso" (descrição)
- Ilustração de festa/confete à direita
- Botão branco "Ver detalhes" (fundo branco, texto rosa, navega para `/groups/[id]`)

Mobile: banner empilhado, texto quebra, botão abaixo.

## Arquivos a criar

- `components/groups-page/next-group-date-banner.tsx`

## Reutilizar

- Token `gradient-warm` em `globals.css`
- Imagem/ilustração de festa — ver se já existe asset (`public/`); se não, usar emoji 🎉 estilizado grande
- shadcn `Button` (variant outline ou customizado branco)
- `Link` de `next/link` para navegar a `/groups/[id]`
- `lucide-react`: `PartyPopper`, `ArrowRight`

## Props sugeridas

```ts
interface NextGroupDateBannerProps {
  daysUntil: number; // 6
  memberName: string; // "Lucas Pereira Feliciano"
  date: string; // "3 de Maio"
  groupName: string; // "Treinasso"
  groupId: string; // para o link "Ver detalhes"
}
```

## Critérios de aceite

- [ ] Renderiza só quando há próxima data (incremento 10 decide quando passar props)
- [ ] Cores e gradiente alinhados ao mockup
- [ ] Botão "Ver detalhes" navega para `/groups/[id]` (rota criada no incremento 11; até lá fica funcionando ou apontando para fallback)
- [ ] Mobile responsivo (stack vertical)

## Verificação

1. `npm run lint` && `npm run build`
2. Verificação visual no incremento 10

## Commit sugerido

`feat: add next group date banner component`
