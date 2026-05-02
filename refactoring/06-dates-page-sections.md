# 06 — Seções da página de Datas

## Objetivo

Criar os componentes de seção da página de Datas como peças isoladas e presentational. A composição final em `pages/dates.tsx` acontece no incremento 7.

## Mockup de referência

`refactoring/dates.jpeg` — observar:

1. **Header da página** (título "Próximas datas importantes" + subtítulo "Maio • 3 eventos nos próximos 30 dias" + botão "+ Adicionar data")
2. **Banner semanal** ("🎉 Você tem 1 data nos próximos 7 dias — Prepare-se para celebrar!" com seta `>` à direita)
3. **Seção "Próximos 7 dias"** (ícone calendário rosa + título) — contém o card `featured`
4. **Seção "Este mês"** (ícone laranja + título) — grid 1/2/3 colunas
5. **Seção "Mais pra frente"** (ícone azul + título) — grid 1/2/3 colunas
6. **Botão "Ver todas as datas ⌄"** centralizado no rodapé

## Arquivos a criar

Todos em `components/dates-page/`:

- `dates-page-header.tsx` — título + subtítulo + botão "+ Adicionar data" (desktop only — no mobile o FAB cobre)
- `upcoming-week-banner.tsx` — banner com count, mensagem e seta clicável (substitui `urgent-date-card`)
- `dates-section.tsx` — wrapper genérico: recebe `title`, `icon`, `iconColor`, `children` (lista de cards). Usado pelas 3 seções
- `view-all-dates-button.tsx` — botão "Ver todas as datas ⌄" centralizado

## Arquivos a modificar

Nenhum nesta etapa — composição em `pages/dates.tsx` é incremento 7.

## Reutilizar

- `date-card` redesenhado no incremento 5 (variante `featured` para a próxima data, `default` para as demais)
- shadcn `Button` com `gradient-warm` para "+ Adicionar data"
- Ícones `lucide-react`: `Calendar`, `PartyPopper`, `ChevronRight`, `ChevronDown`
- Tokens: gradientes específicos para o banner (estudar mockup — provavelmente `bg-primary/5` com border rosa)

## Props sugeridas

```ts
interface DatesPageHeaderProps {
  monthName: string; // "Maio"
  upcomingCount: number; // 3
  onAddClick: () => void;
}

interface UpcomingWeekBannerProps {
  count: number; // 1
  onClick: () => void;
}

interface DatesSectionProps {
  title: string; // "Este mês"
  icon: LucideIcon;
  iconColor: string; // ex: "text-primary" / "text-orange-500" / "text-blue-500"
  children: React.ReactNode;
}

interface ViewAllDatesButtonProps {
  onClick: () => void;
  expanded: boolean;
}
```

## Critérios de aceite

- [ ] Cada componente renderiza isoladamente com props mockadas
- [ ] `upcoming-week-banner` só aparece quando `count > 0`; cinza quando count=1, mais vibrante quando count>1 (avaliar com mockup)
- [ ] `dates-section` mostra header com ícone colorido e título; suporta grid responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- [ ] `view-all-dates-button` alterna ícone chevron baixo/cima conforme `expanded`
- [ ] Componente `urgent-date-card` é **removido** ao final deste incremento (substituído por `upcoming-week-banner`)
- [ ] Componente `hello-card` é **removido** se nada mais o usa

## Verificação

1. `npm run lint` && `npm run build`
2. Verificação visual chega no incremento 7

## Commit sugerido

`feat: add dates page sections components`
