# 10 — Redesign `group-card` + orquestrador `pages/groups.tsx`

## Objetivo

Atualizar o visual do `group-card` para o novo mockup, criar o card "Criar novo grupo" pontilhado, e refatorar `pages/groups.tsx` para orquestrador fino composto pelas seções criadas nos incrementos 8 e 9 + o grid de cards.

## Mockup de referência

`refactoring/groups-page.jpeg`.

**Card de grupo (novo visual):**

- Avatar grande circular (rosa claro com ícone do grupo) à esquerda do header
- Nome do grupo + count de membros à direita do avatar
- Badge "Criador" embaixo (vermelho/rosa quando dono)
- Kebab (3 pontos) no canto superior direito
- Linha "Próximo aniversário" (label cinza)
- Mini-card do membro com bolo + nome + data + badge "Em N dias/meses"
- Quando não há próxima data: "Próxima data — Nenhuma data próxima — Tudo em dia! 🎉"
- Rodapé com 2 botões: "Ver grupo >" (link) e "Convidar" (filled rosa com ícone)

**Card "Criar novo grupo":**

- Linha pontilhada cinza
- Ícone `+` em círculo rosa-claro à esquerda
- "Criar novo grupo" (título) / "Comece um novo grupo e convide pessoas para compartilhar datas importantes" (descrição)
- Largura total da grid (col-span-3) ou só uma coluna — verificar no mockup (parece full width abaixo da grid)

## Arquivos a modificar

- `components/group-card/group-card.tsx` — atualizar layout

## Arquivos a criar

- `components/groups-page/create-group-cta.tsx` — card pontilhado de criar grupo
- `pages/groups.tsx` — refatorar para orquestrador

## Reutilizar

- shadcn `Card`, `Button`, `Badge`
- `create-group-modal` e `group-detail-modal` (este último ainda existe até o incremento 11; "Ver grupo" deve apontar para `/groups/[id]` que será criado no 11 — usar `Link` desde já)
- Ícones: `Users`, `Plus`, `MoreVertical`, `Cake`
- Tokens: `bg-primary/10` para avatar do grupo, `gradient-warm` em badges urgentes
- Componentes criados nos incrementos 8 e 9 (`groups-stats`, `next-group-date-banner`)

## Estrutura do novo `pages/groups.tsx`

```tsx
export default function GroupsPage({ user, groups, stats, nextDate }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Layout user={user} variant="app">
      <GroupsPageHeader onCreateClick={() => setCreateOpen(true)} />
      <GroupsStats {...stats} />
      {nextDate && <NextGroupDateBanner {...nextDate} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>

      <CreateGroupCta onClick={() => setCreateOpen(true)} />

      <CreateGroupModal open={createOpen} onOpenChange={setCreateOpen} />
    </Layout>
  );
}
```

> Pode-se criar `components/groups-page/groups-page-header.tsx` se preferir extrair, igual fizemos no incremento 6 para datas. Mantém simetria entre as duas páginas.

## Props sugeridas

```ts
interface GroupCardProps {
  group: {
    id: string;
    name: string;
    memberCount: number;
    role: 'owner' | 'member';
    nextBirthday?: { name: string; date: string; daysUntil: number };
  };
  onInvite: (groupId: string) => void;
}

interface CreateGroupCtaProps {
  onClick: () => void;
}
```

## Critérios de aceite

- [ ] `group-card` reflete novo visual: avatar grande, badge Criador, mini-card de próxima data, dois botões de ação
- [ ] "Ver grupo >" navega para `/groups/[id]` (link funcional mesmo que a página final entre só no incremento 11 — pode renderizar fallback temporário)
- [ ] "Convidar" abre fluxo de convite (provavelmente um `Popover` com link de convite — verificar como o `group-detail-modal` atual já implementa)
- [ ] Card "Criar novo grupo" abre `create-group-modal`
- [ ] Empty state quando o usuário não tem grupos (`group-empty-state` reaproveitado)
- [ ] Tests de integração passam

## Verificação

1. `npm run lint` && `npm run build`
2. `npm test -- --runInBand`
3. Verificação visual pelo usuário no browser, desktop + mobile, comparando com `refactoring/groups-page.jpeg`

## Commit sugerido

`refactor: rebuild groups page with redesigned group-card and new sections`
