# 11 — Página `/groups/[id]` (migra modal de detalhes)

## Objetivo

Migrar o conteúdo de `components/group-detail-modal/group-detail-modal.tsx` para uma página dedicada `/groups/[id]`, alinhada ao mockup `group-details.jpeg`. Após a migração, **remover o modal antigo** e atualizar todos os pontos que o abriam para navegarem para a nova rota.

## Mockup de referência

`refactoring/group-details.jpeg`.

**Estrutura da página:**

1. Link "← Voltar para grupos"
2. **Header do grupo** (card branco):
   - Avatar grande à esquerda
   - Nome do grupo + "14 membros • Criado por você"
   - Descrição
   - Badge "Criado em 12 de Janeiro de 2024"
   - Botões à direita: "Convidar" (outline rosa) e "Configurações" (outline cinza) e kebab (3 pontos)
3. **Tabs** logo abaixo (dentro do card):
   - "Datas" (ativa, com underline rosa)
   - "Membros"
   - "Configurações"
4. **Card "Próxima data"** + **Quadradinho "Aniversários neste mês: 2 pessoas 🎉"**
5. **Lista "Próximos aniversários"** — itens em linha (não cards): avatar pequeno + nome (+ badge "Criador" se for) + data + badge "Em N dias/semanas/meses" + chevron
6. Botão "Ver todas as datas ⌄"

**Mobile:**

- Header empilhado
- Tabs horizontais com scroll se preciso
- Lista igual desktop, layout vertical

## Arquivos a criar

- `pages/groups/[id].tsx` — página com `getServerSideProps` (auth + fetch grupo + permissões)
- `components/group-detail-page/group-header.tsx`
- `components/group-detail-page/group-tabs.tsx` — tabs Datas/Membros/Configurações (controled via state ou via querystring `?tab=`)
- `components/group-detail-page/next-birthday-highlight.tsx`
- `components/group-detail-page/month-birthdays-count.tsx`
- `components/group-detail-page/birthdays-list.tsx`
- `components/group-detail-page/birthdays-list-item.tsx`
- `components/group-detail-page/back-to-groups-link.tsx`
- (Tabs Membros e Configurações) `components/group-detail-page/members-tab.tsx`, `configurations-tab.tsx` — conteúdo migrado do modal antigo

## Arquivos a modificar / remover

- `pages/api/v1/groups/[id]/...` — verificar se já há endpoint para fetch detalhado; se não, criar
- `components/group-card/group-card.tsx` (do incremento 10) — botão "Ver grupo" passa a usar `next/link` para `/groups/[id]`
- `components/groups-page/next-group-date-banner.tsx` (do incremento 9) — botão "Ver detalhes" idem
- **REMOVER** `components/group-detail-modal/group-detail-modal.tsx` e suas referências em `pages/groups.tsx` (e qualquer outro lugar)

## Reutilizar

- Toda a lógica de queries, validação de permissões e ações (gerar invite, remover membro, editar grupo) que existe em `group-detail-modal.tsx` — mover para os componentes de tab correspondentes
- shadcn `Tabs` (`@radix-ui/react-tabs` — instalar via shadcn CLI se não houver)
- `models/group.ts`, `models/group-member.ts` — já têm os métodos necessários
- `withAuth` no `getServerSideProps`
- Ícones: `ArrowLeft`, `Share2`, `Settings`, `MoreVertical`, `Cake`, `Crown` (badge Criador)

## getServerSideProps sugerido

```ts
export const getServerSideProps = withAuth(async (ctx, user) => {
  const group = await groupModel.findById(ctx.query.id, user.id);
  if (!group) return { notFound: true };

  const members = await groupMemberModel.findAllByGroupId(group.id);
  const upcomingBirthdays = await groupMemberModel.findUpcomingBirthdays(
    group.id,
  );

  return { props: { user, group, members, upcomingBirthdays } };
});
```

## Critérios de aceite

- [ ] Rota `/groups/[id]` renderiza para grupos do qual o usuário é membro/owner
- [ ] Retorna 404 se usuário não tem acesso ao grupo
- [ ] Tabs Datas/Membros/Configurações alternam conteúdo (com active state e — opcional — sincronia via `?tab=` querystring)
- [ ] "Voltar para grupos" navega para `/groups`
- [ ] Próxima data destacada aparece quando há próximo aniversário
- [ ] Lista de aniversários ordenada por proximidade
- [ ] Funcionalidades do modal antigo (gerar invite, remover membro, editar grupo, sair do grupo) migram para a tab Configurações ou Membros conforme apropriado
- [ ] Modal `group-detail-modal` é **removido** do código junto com este incremento
- [ ] Tests de integração passam (`tests/integration/api/v1/groups/...`)

## Verificação

1. `npm run lint` && `npm run build`
2. `npm test -- --runInBand`
3. Verificação visual pelo usuário no browser, desktop + mobile, comparando com `refactoring/group-details.jpeg`
4. Testar fluxos:
   - Acessar `/groups/[id]` de um grupo que sou membro: ok
   - De um grupo que não sou: 404
   - Trocar tabs
   - Convidar (gerar link), copiar
   - Editar nome/descrição (se for owner)
   - Remover membro (se for owner)
   - Sair do grupo (se for member)

## Commit sugerido

`feat: migrate group detail modal to dedicated /groups/[id] page`
