# Refatoração — Telas de Datas e Grupos

Pasta com o plano completo do refactoring das telas autenticadas (Datas e Grupos), seguindo os mockups em `refactoring/`.

## Como usar esta pasta

- `00-overview.md` — contexto, princípios, tokens do design system, padrões herdados da landing
- `01-...` a `11-...` — um arquivo **auto-suficiente por incremento**

Quando começarmos a desenvolver um incremento, **carregue apenas o arquivo dele + `00-overview.md`**. Cada arquivo de incremento foi escrito para conter tudo que a sessão precisa (objetivo, mockup, arquivos a criar/modificar, reutilizações, critérios de aceite, verificação) sem precisar do contexto dos outros blocos.

## Ordem de execução

| #   | Bloco                                                   | Arquivo                                                          |
| --- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | Sidebar lateral (desktop)                               | [`01-app-sidebar.md`](01-app-sidebar.md)                         |
| 2   | Bottom nav (mobile)                                     | [`02-bottom-nav.md`](02-bottom-nav.md)                           |
| 3   | App header (busca/sino/avatar)                          | [`03-app-header.md`](03-app-header.md)                           |
| 4   | Layout integrando sidebar + bottom-nav + header         | [`04-layout-integration.md`](04-layout-integration.md)           |
| 5   | Redesign do `date-card`                                 | [`05-date-card-redesign.md`](05-date-card-redesign.md)           |
| 6   | Seções da página de Datas                               | [`06-dates-page-sections.md`](06-dates-page-sections.md)         |
| 7   | Orquestrador de `pages/dates.tsx`                       | [`07-dates-page-orchestrator.md`](07-dates-page-orchestrator.md) |
| 8   | Stats da página de Grupos                               | [`08-groups-stats.md`](08-groups-stats.md)                       |
| 9   | Banner de próxima data dos grupos                       | [`09-groups-next-date-banner.md`](09-groups-next-date-banner.md) |
| 10  | Redesign `group-card` + orquestrador `pages/groups.tsx` | [`10-group-card-and-page.md`](10-group-card-and-page.md)         |
| 11  | Página `/groups/[id]` (migra modal de detalhes)         | [`11-group-detail-page.md`](11-group-detail-page.md)             |

## Princípios

1. **Um incremento = um PR mergeável.**
2. **Visual antes de comportamento.** Componentes nascem presentational, só depois plugam em dados reais.
3. **Reutilizar > criar.** Cards, modais e tokens já existem.
4. **Validação visual a cada passo** pelo usuário (não rodo dev server / browser).
5. **Branch única para todo o refactor** (criada pelo usuário).
