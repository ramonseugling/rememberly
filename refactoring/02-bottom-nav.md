# 02 — Bottom nav (mobile)

## Objetivo

Criar a barra de navegação fixa no rodapé para mobile, com 5 slots e FAB central contextual por rota. Componente é presentational + hooks de roteamento. Integração no layout fica no incremento 4.

## Mockup de referência

`refactoring/dates.jpeg` (canto direito mobile) e `refactoring/groups-page.jpeg` (canto direito mobile) — bottom nav igual.

Estrutura (esquerda → direita):

1. Datas (calendário) → `/dates`
2. Grupos (pessoas) → `/groups`
3. **FAB central** circular `gradient-warm` com ícone `+` — comportamento contextual:
   - Em `/dates` → abre `add-event-modal`
   - Em `/groups` → abre `create-group-modal`
   - Em outras rotas → oculto ou disabled (decidir pelo encaixe visual)
4. Lembretes (sino) — **link inativo** (rota não existe ainda)
5. Perfil (usuário) → `/perfil` (rota existe)

Itens com active state (rosa) quando rota atual.

## Arquivos a criar

- `components/bottom-nav/bottom-nav.tsx` — barra com 5 slots e FAB

## Arquivos a modificar

Nenhum — a integração entra no incremento 4.

## Reutilizar

- `lucide-react`: `Calendar`, `Users`, `Plus`, `Bell`, `User`
- `add-event-modal` e `create-group-modal` (já existem, abrir via state)
- `useRouter` para active state e contexto do FAB
- Tokens: `gradient-warm` no FAB, `shadow-float` para destacar
- `cn()` para active state

## Props sugeridas

```ts
interface BottomNavProps {
  onAddEventClick: () => void;
  onCreateGroupClick: () => void;
}
```

> Os modais ficam no `Layout` (incremento 4) — o bottom-nav só dispara callbacks. Mantém o componente puro.

## Critérios de aceite

- [ ] Renderiza fixed no rodapé com 5 slots
- [ ] FAB central elevado (negative margin-top) com `gradient-warm` e `shadow-float`
- [ ] FAB chama `onAddEventClick` quando rota é `/dates`, `onCreateGroupClick` quando `/groups`
- [ ] FAB oculto (ou inativo) em outras rotas
- [ ] "Lembretes" renderiza mas não é clicável (sem href ou `disabled`)
- [ ] Active state visual no item da rota atual
- [ ] `lg:hidden` — não aparece em desktop
- [ ] Safe area inset bottom respeitada (`pb-safe` ou `pb-[env(safe-area-inset-bottom)]`)

## Verificação

1. `npm run lint` e `npm run build`
2. Verificação visual chega no incremento 4

## Commit sugerido

`feat: add mobile bottom nav with contextual FAB`
