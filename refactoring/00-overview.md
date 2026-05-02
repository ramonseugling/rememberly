# 00 — Visão geral e contexto

## Por que estamos fazendo isso

Os mockups em `refactoring/` (`dates.jpeg`, `groups-page.jpeg`, `group-details.jpeg`) reestruturam as duas telas autenticadas principais:

- **Sidebar lateral** no desktop com itens Minhas Datas / Grupos / Perfil + Configurações / Ajuda + card "Convide amigos"
- **Bottom nav** no mobile com FAB central
- **App header** com busca, sino de notificações e dropdown do avatar
- **Página de Datas** organizada por buckets temporais (Próximos 7 dias / Este mês / Mais pra frente), banner semanal e card destacado da próxima data
- **Página de Grupos** com row de stats, banner laranja da próxima data, cards redesenhados e CTA "Criar novo grupo"
- **Página de detalhes de grupo** (migrada de modal para rota `/groups/[id]`) com tabs Datas/Membros/Configurações

O refactoring anterior da landing page (commit `52d86de`) foi feito tudo de uma vez e gerou retrabalho — o resultado fugiu dos mockups por excesso de contexto na mesma sessão. **Este plano evita o erro fragmentando em 11 incrementos pequenos.**

## ⚠️ Sempre consultar o mockup correspondente

Cada incremento referencia a(s) imagem(ns) de mockup que servem de fonte da verdade visual. **Antes de começar a implementar, abrir e ler com o tool `Read` a imagem indicada** — é assim que conferimos cores, espaçamentos, ícones e proporções. As três imagens têm propósitos distintos:

| Imagem                           | Propósito                                                                                                          | Usada nos incrementos |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `refactoring/dates.jpeg`         | Tela de Datas (desktop + mobile) — sidebar, header, bottom-nav, banner semanal, seções por período, card destacado | 1, 2, 3, 4, 5, 6, 7   |
| `refactoring/groups-page.jpeg`   | Tela de Grupos (desktop + mobile) — stats row, banner laranja, cards de grupo, card "Criar novo grupo"             | 1, 2, 3, 4, 8, 9, 10  |
| `refactoring/group-details.jpeg` | Página de detalhes de um grupo — header rico, tabs, próxima data, lista de aniversários                            | 11                    |

Os incrementos 1–4 (casca de navegação) podem precisar das três imagens para conferir consistência da sidebar/header/bottom-nav entre as telas.

## Decisões de escopo já fechadas

- ✅ **Detalhes de grupo:** migrar para rota `/groups/[id]` (não manter como modal)
- ✅ **Busca e sino do header:** apenas placeholders visuais nesta rodada
- ✅ **Configurações e Ajuda da sidebar:** links inativos (renderizam mas sem `href`)
- ✅ **FAB do bottom-nav:** contextual por rota (`/dates` → add-event, `/groups` → create-group)
- ✅ **Card "Convide amigos":** placeholder visual, sem wireup
- ✅ **Branch:** única para todo o refactor, criada pelo usuário

## Stack e padrões a seguir

- **Next.js Pages Router** + **React 19** + **TypeScript strict**
- **Tailwind CSS v4** com `@theme` em `styles/globals.css`
- **shadcn/ui** em `components/ui/` (`button`, `card`, `badge`, `dialog`, `input`, `popover`, `select`)
- **Componente em diretório próprio**: `components/[nome]/[nome].tsx` (ex: `components/app-sidebar/app-sidebar.tsx`)
- **Pages**: `export default function NomeDaPagina()`
- **Componentes**: `export const NomeDoComponente = () => {}`
- **Props tipadas com `interface`**, sem `any`
- **Imports com alias `@/`**
- **Mensagens ao usuário em português**
- **Sem comentários óbvios**

## Tokens do design system (`styles/globals.css`)

**Cores (CSS vars):**

- `--primary` rosa/magenta `hsl(340 75% 68%)`
- `--secondary` roxo `hsl(280 65% 70%)`
- `--violet-accent` `hsl(310 65% 58%)`
- `--accent` laranja `hsl(25 85% 65%)`
- `--background` bege claro `hsl(20 55% 98%)`
- `--foreground` cinza escuro `hsl(230 45% 25%)`
- `--card` branco
- `--muted` `hsl(25 45% 94%)`
- `--border` `hsl(340 35% 92%)`

**Gradientes (classes utilitárias):**

- `.gradient-warm` — primary → accent (rosa → laranja). Usar em CTAs principais e FAB
- `.gradient-violet` — magenta → roxo. Identidade visual de grupos
- `.gradient-sunset` — vermelho → roxo
- `.gradient-soft` — fundo geral da app (bege → rosa claro)

**Sombras:**

- `.shadow-soft` (cards padrão)
- `.shadow-glow` (highlights)
- `.shadow-float` (elementos flutuantes — FAB)
- `.shadow-warm` (cards destacados)

**Animações:**

- `animate-fade-in`, `animate-scale-in`, `animate-float`

**Tipografia:**

- `--font-heading` Fredoka (`<h1>`–`<h6>` e `.font-heading`)
- `--font-body` Quicksand (corpo via herança)

**Radius padrão:** `--radius: 1rem`

## Padrão herdado da landing (referência)

A landing foi quebrada em `components/landing-page/*` com uma seção por componente, orquestradas por `landing-page.tsx`. Replicar o padrão para as telas autenticadas:

- `pages/dates.tsx` fica fino, só com `getServerSideProps`/`withAuth` + composição de seções de `components/dates-page/*`
- `pages/groups.tsx` mesma coisa com `components/groups-page/*`
- `pages/groups/[id].tsx` compõe `components/group-detail-page/*`

## Componentes que JÁ EXISTEM e devem ser reaproveitados

| Componente                     | Caminho                           | Uso                                                                      |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------ |
| date-card                      | `components/date-card/`           | Refinar visual no incremento 5                                           |
| next-year-date-card            | `components/next-year-date-card/` | Variação para ano que vem                                                |
| group-card                     | `components/group-card/`          | Refinar visual no incremento 10                                          |
| add-event-modal                | `components/add-event-modal/`     | Manter como está                                                         |
| update-event-modal             | `components/update-event-modal/`  | Manter como está                                                         |
| create-group-modal             | `components/create-group-modal/`  | Manter como está                                                         |
| group-detail-modal             | `components/group-detail-modal/`  | Migrar conteúdo para página no incremento 11, remover ao final           |
| empty-state, group-empty-state | `components/empty-state*`         | Reaproveitar                                                             |
| header (atual)                 | `components/header/header.tsx`    | Continua na landing; substituído por `app-header` nas rotas autenticadas |
| header-landing                 | `components/header-landing/`      | Mantém (landing)                                                         |
| layout                         | `components/layout/layout.tsx`    | Estender com `variant: 'app' \| 'landing'` no incremento 4               |

## Backend e modelos (sem mudança)

- `models/event.ts`, `models/group.ts`, `models/group-member.ts` — já têm tudo que precisamos
- `pages/api/v1/events/*`, `pages/api/v1/groups/*` — endpoints prontos
- `withAuth` middleware em `infra/controller.ts` — usar no `getServerSideProps`

## Verificação geral em cada incremento

1. `npm run lint` e `npm run build` (TypeScript + Next)
2. `npm test -- --runInBand` quando o incremento toca dados (5, 7, 9, 11)
3. **Usuário verifica no browser** (desktop + mobile responsive) e compara contra o mockup correspondente
4. Commit com Conventional Commits (`feat:` ou `refactor:`)
5. Abrir PR para a branch única do refactor

## Componentes legados que serão removidos durante o refactor

Quando totalmente substituídos pelo novo design, deletar (sem manter "por garantia"):

- `components/hello-card/` — saudação substituída pelo título "Próximas datas importantes"
- `components/urgent-date-card/` — substituído por `upcoming-week-banner` (incremento 6)
- `components/group-detail-modal/` — substituído pela página `/groups/[id]` (incremento 11)
- `components/header/header.tsx` em rotas autenticadas — substituído por `app-header` (mas mantido na landing)

A remoção acontece **dentro do incremento que torna o legado obsoleto**, não no final.
