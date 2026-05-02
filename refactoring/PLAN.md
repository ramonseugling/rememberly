# Plano consolidado — Refactoring das telas de Datas e Grupos

> Este arquivo é a versão consolidada do plano para leitura humana. Para execução incremental, cada bloco tem seu próprio `.md` auto-suficiente neste mesmo diretório (ver `README.md`).

## Contexto

Os mockups em `refactoring/` (`dates.jpeg`, `groups-page.jpeg`, `group-details.jpeg`) propõem uma reestruturação significativa das duas telas autenticadas principais:

- **Sidebar lateral** no desktop (Minhas Datas / Grupos / Perfil + Configurações / Ajuda + card "Convide amigos")
- **Bottom nav** no mobile com FAB central contextual
- **App header** com busca, sino de notificações e dropdown do avatar
- **Página de Datas** com seções por período (Próximos 7 dias / Este mês / Mais pra frente), banner semanal e card destacado para a próxima data
- **Página de Grupos** com row de stats, banner laranja da próxima data, cards redesenhados e CTA "Criar novo grupo"
- **Página de detalhes de grupo** migrada de modal para rota `/groups/[id]` com tabs Datas/Membros/Configurações

O refactoring anterior da landing page (commit `52d86de`) foi feito tudo de uma vez e gerou retrabalho — o resultado fugiu dos mockups por excesso de contexto na mesma sessão. **Este plano evita o erro fragmentando em 11 incrementos pequenos, cada um mergeável independentemente.**

## Princípios do refactoring

1. **Um incremento = um PR.** Nada de bundle. Cada incremento entrega algo navegável e revisável isoladamente.
2. **Visual antes de comportamento.** Cada componente novo nasce presentational (props mockadas), depois é plugado em dados reais.
3. **Reutilizar > criar.** Cards (`date-card`, `group-card`), modais (`add-event-modal`, `update-event-modal`, `create-group-modal`, `group-detail-modal`), shadcn (`button`, `card`, `badge`, `dialog`), tokens em `globals.css` (`gradient-warm`, `gradient-violet`, `shadow-soft`).
4. **Padrão landing como referência.** Página orquestradora curta + uma seção por componente em diretório próprio (`components/dates-page/upcoming-week-section/...`), igual `components/landing-page/`.
5. **Validação visual a cada passo.** Usuário verifica no browser entre cada incremento.
6. **Componentes legados removidos dentro do incremento que os obsoleta**, não no final.
7. **Branch única para todo o refactor**, criada pelo usuário.

## Decisões de escopo fechadas

- ✅ Detalhes de grupo: migrar para rota `/groups/[id]` (não manter como modal)
- ✅ Busca e sino do header: apenas placeholders visuais nesta rodada
- ✅ Configurações e Ajuda da sidebar: links inativos (renderizam mas sem `href`)
- ✅ FAB do bottom-nav: contextual por rota (`/dates` → add-event, `/groups` → create-group)
- ✅ Card "Convide amigos": placeholder visual, sem wireup

## Os 11 incrementos

### Bloco A — Nova casca de navegação (fundação)

**1. Sidebar lateral (desktop)** — `components/app-sidebar/app-sidebar.tsx`
Itens primários (Minhas Datas / Grupos / Perfil) com active state, separador, itens secundários inativos (Configurações / Ajuda), card "Convide amigos" no rodapé. Hidden `< lg`. Sem dependência de dados — só `useRouter`.

**2. Bottom nav (mobile)** — `components/bottom-nav/bottom-nav.tsx`
5 slots: Datas / Grupos / FAB central / Lembretes (inativo) / Perfil. FAB com `gradient-warm` e `shadow-float` chama callback contextual: `onAddEventClick` em `/dates`, `onCreateGroupClick` em `/groups`. Hidden `≥ lg`. Safe area inset respeitada.

**3. App header autenticado** — `components/app-header/app-header.tsx` + `mobile-menu-sheet.tsx`
Logo, ícone de busca (visual), sino com badge `2` (visual), avatar com dropdown (Perfil / Sair). Mobile: hambúrguer abre Sheet com itens da sidebar. Substitui `header.tsx` em rotas autenticadas; landing mantém `header-landing`.

**4. Integração no Layout** — modificar `components/layout/layout.tsx`
Adicionar prop `variant: 'app' | 'landing'` (default `landing`). Quando `app`, renderiza `AppSidebar` + `BottomNav` + `AppHeader`. Modais do FAB sobem para o Layout. `pages/dates.tsx` e `pages/groups.tsx` passam `variant="app"`. Verificação completa no browser.

### Bloco B — Refactoring da página de Datas

**5. Redesign do `date-card`** — `components/date-card/date-card.tsx`
Avatar circular grande à esquerda, info no centro, data + badge "Em X dias/meses" à direita, kebab no canto superior direito (abre `update-event-modal`). Variante `featured` para o card grande destacado. Suporta tag de grupo. Cores conforme urgência. Atualizar `next-year-date-card` para mesmo padrão.

**6. Seções da página de Datas** — `components/dates-page/*`

- `dates-page-header.tsx` — título "Próximas datas importantes" + subtítulo + botão "+ Adicionar data"
- `upcoming-week-banner.tsx` — banner com count e seta (substitui `urgent-date-card`)
- `dates-section.tsx` — wrapper genérico (ícone + título + grid responsivo) usado pelas 3 seções
- `view-all-dates-button.tsx` — botão "Ver todas as datas ⌄"
- Remover `urgent-date-card` e `hello-card` se obsoletos

**7. Orquestrador `pages/dates.tsx`**
Reduzir para um arquivo fino: `getServerSideProps` + `withAuth` + cálculo de buckets (`withinWeek`, `thisMonth`, `later`) + composição das seções. Card destacado é o primeiro de "Próximos 7 dias". Manter `add-event-modal` e `update-event-modal`. Tests passam.

### Bloco C — Refactoring da página de Grupos

**8. Stats row** — `components/groups-page/groups-stats.tsx`
Row com 3 cards: Grupos ativos / Pessoas conectadas / Datas chegando. Ícone colorido + número grande + label. Cálculo no `getServerSideProps`.

**9. Banner de próxima data dos grupos** — `components/groups-page/next-group-date-banner.tsx`
Banner `gradient-warm` com "Próxima data em N dias!", descrição com nome+data+grupo, ilustração de festa, botão branco "Ver detalhes" navegando para `/groups/[id]`. Visível só se há próximo aniversário.

**10. Redesign `group-card` + orquestrador `pages/groups.tsx`**

- `group-card`: avatar grande, badge "Criador", mini-card de próxima data, botões "Ver grupo" (Link para `/groups/[id]`) e "Convidar"
- `create-group-cta.tsx` — card pontilhado "+ Criar novo grupo" abre modal
- `pages/groups.tsx` orquestrador fino: header + stats + banner + grid de cards + CTA + modal
- Tests passam

### Bloco D — Página de detalhes de grupo

**11. Página `/groups/[id]`** — `pages/groups/[id].tsx` + `components/group-detail-page/*`

- `group-header.tsx`, `group-tabs.tsx`, `next-birthday-highlight.tsx`, `month-birthdays-count.tsx`, `birthdays-list.tsx`, `birthdays-list-item.tsx`, `back-to-groups-link.tsx`
- Tabs Datas / Membros / Configurações
- Migrar lógica do `group-detail-modal` (queries, permissões, gerar invite, remover membro, editar grupo, sair) para as tabs apropriadas
- **Remover `group-detail-modal`** e referências em `pages/groups.tsx`
- Tests passam

## Componentes existentes a reaproveitar

| Componente                                                                 | Caminho                           | Uso                                           |
| -------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------- |
| `date-card`                                                                | `components/date-card/`           | Refinar visual (incremento 5)                 |
| `next-year-date-card`                                                      | `components/next-year-date-card/` | Variação ano que vem                          |
| `group-card`                                                               | `components/group-card/`          | Refinar visual (incremento 10)                |
| `add-event-modal`                                                          | `components/add-event-modal/`     | Sem mudanças                                  |
| `update-event-modal`                                                       | `components/update-event-modal/`  | Sem mudanças                                  |
| `create-group-modal`                                                       | `components/create-group-modal/`  | Sem mudanças                                  |
| `group-detail-modal`                                                       | `components/group-detail-modal/`  | Migrar conteúdo, remover (incremento 11)      |
| `empty-state`, `group-empty-state`                                         | `components/empty-state*/`        | Reaproveitar                                  |
| `header` (atual)                                                           | `components/header/`              | Mantém na landing; substituído nas rotas auth |
| `layout`                                                                   | `components/layout/`              | Estender com `variant` (incremento 4)         |
| shadcn (`button`, `card`, `badge`, `dialog`, `input`, `popover`, `select`) | `components/ui/`                  | Reaproveitar                                  |

## Componentes legados removidos durante o refactor

- `components/hello-card/` — substituído pelo título "Próximas datas importantes" (incremento 7)
- `components/urgent-date-card/` — substituído por `upcoming-week-banner` (incremento 6)
- `components/group-detail-modal/` — substituído pela página `/groups/[id]` (incremento 11)
- Uso de `header.tsx` em rotas autenticadas — substituído por `app-header` (incremento 4); mantido na landing

## Tokens do design system (referência rápida)

`styles/globals.css` — cores `--primary` (rosa), `--secondary` (roxo), `--violet-accent`, `--accent` (laranja), `--background` (bege), `--card` (branco). Gradientes `.gradient-warm`, `.gradient-violet`, `.gradient-sunset`, `.gradient-soft`. Sombras `.shadow-soft`, `.shadow-glow`, `.shadow-float`, `.shadow-warm`. Animações `animate-fade-in`, `animate-scale-in`, `animate-float`. Fontes Fredoka (heading) e Quicksand (body) via `next/font/google`. Radius `1rem`.

## Stack e padrões

- Next.js Pages Router + React 19 + TypeScript strict
- Tailwind CSS v4 com `@theme` em `styles/globals.css`
- shadcn/ui em `components/ui/`
- Componente em diretório próprio: `components/[nome]/[nome].tsx`
- Pages: `export default function NomeDaPagina()`
- Componentes: `export const NomeDoComponente = () => {}`
- Props com `interface`, sem `any`
- Imports com alias `@/`
- Mensagens ao usuário em português, sem comentários óbvios

## Verificação por incremento

1. `npm run lint` && `npm run build`
2. `npm test -- --runInBand` (incrementos 5, 7, 9/10, 11)
3. **Usuário verifica no browser** (desktop + mobile responsive) e compara contra o mockup
4. Commit Conventional Commits (`feat:` ou `refactor:`)
5. PR para a branch única do refactor

## Próximos passos

1. Usuário aprova este plano
2. Usuário cria a branch única do refactor
3. Começamos pelo incremento 1 carregando `refatoring/00-overview.md` + `refatoring/01-app-sidebar.md`
