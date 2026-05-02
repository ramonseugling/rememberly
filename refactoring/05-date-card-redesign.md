# 05 — Redesign do `date-card`

## Objetivo

Atualizar o componente `date-card` para o novo visual dos mockups. O card fica menor e mais limpo, com avatar circular grande à esquerda, info no centro, data + badge "Em X dias/meses" à direita, e menu kebab (3 pontos) no canto superior direito que abre o `update-event-modal`.

Adicionar uma variante `featured` para o card grande destacado (próxima data), ou criar componente separado `featured-next-date-card` — decidir durante a implementação conforme o quão diferentes ficam os layouts.

## Mockup de referência

`refactoring/dates.jpeg` — todos os cards das seções "Este mês" e "Mais pra frente" usam o layout padrão. O card destacado dentro de "Próximos 7 dias" é maior (`featured`).

**Layout do card padrão:**

- Avatar circular rosa-claro com ícone do tipo (bolo para birthday, etc.)
- Nome (font-heading bold)
- Tipo (cinza secundário)
- Tag do grupo (se houver) — pílula com ícone `pessoas` + nome
- Coluna direita: data (ex: "27 de Maio") + badge rosa "Em 1 mês"
- Botão kebab (3 pontos) no canto superior direito

**Layout do card `featured` (Próximos 7 dias):**

- Tudo idem, mas maior (full width na seção)
- Avatar maior
- Badge "Em 6 dias" mais destacado
- Ícone de calendário ao lado da data
- Pode ter borda sutil rosa

## Arquivos a criar/modificar

- `components/date-card/date-card.tsx` — refatorar layout (substituir o atual)
- (Se decidir separar) `components/featured-next-date-card/featured-next-date-card.tsx` — variante grande
- `components/next-year-date-card/next-year-date-card.tsx` — alinhar visual ao novo padrão (manter "muted" mas com a nova estrutura)

## Reutilizar

- Ícones de tipo de evento — verificar se já existe um helper que mapeia `type` → ícone (provavelmente em algum util ou no próprio date-card antigo). Se não, criar `lib/event-icons.ts`
- shadcn `DropdownMenu` para o kebab (item "Editar" abre `update-event-modal`)
- `update-event-modal` — já recebe `event` como prop
- Tokens: `bg-primary/10` para avatar background, `gradient-warm` (variante featured de urgência)

## Props sugeridas

```ts
interface DateCardProps {
  event: {
    id: string;
    title: string;
    type: EventType;
    customType?: string;
    date: string;
    daysUntil: number;
    groupName?: string;
  };
  variant?: 'default' | 'featured';
  onEdit?: (id: string) => void;
}
```

## Critérios de aceite

- [ ] Card padrão tem avatar à esquerda, info ao centro, data + badge à direita, kebab no topo direito
- [ ] Card `featured` é visualmente maior e mais destacado
- [ ] Kebab abre menu com "Editar" (e talvez "Excluir")
- [ ] Tag de grupo aparece quando `groupName` está presente
- [ ] Cores corretas conforme `daysUntil` (≤7 dias = warm, ≤30 = sunset, demais = padrão rosa claro)
- [ ] `next-year-date-card` segue o mesmo layout, com opacidade reduzida e label "Ano que vem"
- [ ] **Componentes legados removidos**: `hello-card` e `urgent-date-card` ainda são usados pela página? Se este incremento não os obsoleta, remoção fica para o 6/7.

## Verificação

1. `npm run lint` && `npm run build`
2. Renderizar `pages/dates.tsx` no browser — visualmente os cards já devem refletir o novo design (mesmo antes de refatorar a página)
3. Editar um evento via kebab → modal abre, salva, atualiza
4. Comparar com mockup

## Commit sugerido

`refactor: redesign date-card to match new mockup`
