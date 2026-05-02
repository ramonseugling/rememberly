# 08 — Stats row na página de Grupos

## Objetivo

Criar a row de 3 cards com estatísticas no topo da página de Grupos, presentational, plugada no incremento 10 (orquestrador da página de grupos).

## Mockup de referência

`refactoring/groups-page.jpeg` — abaixo do título "Meus grupos", row com 3 cards:

1. **Grupos ativos** — ícone pessoas rosa-claro + número grande "3" + label
2. **Pessoas conectadas** — ícone pessoas laranja-claro + "23" + label
3. **Datas chegando** — ícone calendário rosa-claro + "4" + label

Mobile: mesma row, cards menores em `grid-cols-3` compactado.

## Arquivos a criar

- `components/groups-page/groups-stats.tsx` — row com 3 stat cards
- (Opcional, se reutilizar) `components/groups-page/stat-card.tsx` — card individual com ícone + número + label

## Reutilizar

- shadcn `Card`
- Ícones `lucide-react`: `Users`, `UsersRound`, `Calendar`
- Tokens: `bg-primary/10`, `bg-accent/10` para fundos do ícone

## Props sugeridas

```ts
interface GroupsStatsProps {
  groupsCount: number;
  membersCount: number; // soma de membros únicos em todos os grupos do usuário
  upcomingDatesCount: number; // datas dos grupos nos próximos 30 dias
}
```

## Cálculo dos valores

Os valores são calculados em `pages/groups.tsx` (no `getServerSideProps`) a partir dos dados já consultados:

- `groupsCount` — `groups.length`
- `membersCount` — Set de `user_id` único somando todos os `group_members` de todos os grupos do usuário
- `upcomingDatesCount` — quantas datas dos grupos caem em ≤30 dias

Se isso ficar caro, considerar consulta SQL agregada no `models/group.ts`.

## Critérios de aceite

- [ ] Renderiza 3 cards lado a lado (`grid-cols-3` desktop e mobile, com gap responsivo)
- [ ] Cada card: ícone colorido em círculo, número grande (font-heading), label
- [ ] Aceita zeros sem quebrar visual
- [ ] Animação `animate-fade-in` opcional na entrada

## Verificação

1. `npm run lint` && `npm run build`
2. Verificação visual no incremento 10

## Commit sugerido

`feat: add groups stats row component`
