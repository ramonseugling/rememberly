# 07 — Orquestrador de `pages/dates.tsx`

## Objetivo

Refatorar `pages/dates.tsx` para que o arquivo da página fique fino — apenas `getServerSideProps` + `withAuth` + composição das seções criadas no incremento 6. Toda a lógica de buckets temporais (próximos 7 dias / este mês / mais pra frente) acontece aqui.

Ao final deste incremento a tela de Datas está visualmente alinhada ao mockup.

## Mockup de referência

`refactoring/dates.jpeg` completo — desktop e mobile.

## Arquivos a modificar

- `pages/dates.tsx` — reduzir de ~233 linhas para um orquestrador fino

## Estrutura do novo `pages/dates.tsx`

```tsx
export default function DatesPage({ user, events, monthName }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showAll, setShowAll] = useState(false);

  const buckets = useMemo(() => bucketEvents(events), [events]);

  return (
    <Layout user={user} variant="app">
      <DatesPageHeader monthName={monthName} upcomingCount={buckets.thisMonth.length + buckets.withinWeek.length} onAddClick={() => setAddOpen(true)} />

      {buckets.withinWeek.length > 0 && (
        <UpcomingWeekBanner count={buckets.withinWeek.length} onClick={...} />
      )}

      {buckets.withinWeek.length > 0 && (
        <DatesSection title="Próximos 7 dias" icon={Calendar} iconColor="text-primary">
          {buckets.withinWeek.map((e, i) => (
            <DateCard key={e.id} event={e} variant={i === 0 ? 'featured' : 'default'} onEdit={() => setEditingEvent(e)} />
          ))}
        </DatesSection>
      )}

      {buckets.thisMonth.length > 0 && (
        <DatesSection title="Este mês" icon={Cake} iconColor="text-orange-500">
          {buckets.thisMonth.map(e => <DateCard ... />)}
        </DatesSection>
      )}

      {buckets.later.length > 0 && (
        <DatesSection title="Mais pra frente" icon={Calendar} iconColor="text-blue-500">
          {(showAll ? buckets.later : buckets.later.slice(0, 3)).map(e => <DateCard ... />)}
        </DatesSection>
      )}

      {buckets.later.length > 3 && (
        <ViewAllDatesButton expanded={showAll} onClick={() => setShowAll(!showAll)} />
      )}

      {editingEvent && (
        <UpdateEventModal event={editingEvent} open={!!editingEvent} onOpenChange={(o) => !o && setEditingEvent(null)} />
      )}

      <AddEventModal open={addOpen} onOpenChange={setAddOpen} />
    </Layout>
  );
}
```

## Lógica de buckets

```ts
function bucketEvents(events: Event[]) {
  return {
    withinWeek: events.filter((e) => e.daysUntil <= 7),
    thisMonth: events.filter((e) => e.daysUntil > 7 && e.daysUntil <= 30),
    later: events.filter((e) => e.daysUntil > 30),
  };
}
```

Considerar extrair para `lib/event-buckets.ts` se ficar reutilizado em outro lugar (ex: stats da página de grupos).

## Reutilizar

- `getServerSideProps` atual de `pages/dates.tsx` (mantém autenticação e fetch via models)
- `withAuth` já presente
- Todos os componentes criados nos incrementos 5 e 6
- Modais `add-event-modal` e `update-event-modal`

## Critérios de aceite

- [ ] Página renderiza corretamente com dados reais do banco
- [ ] Buckets se distribuem: ≤7 dias / 8–30 dias / >30 dias
- [ ] Card destacado é o primeiro de "Próximos 7 dias"
- [ ] Empty state quando não há eventos (reusar `empty-state` ou criar inline conforme mockup — mockup parece não desenhar empty state; manter `empty-state` atual como fallback)
- [ ] Navegação, FAB, modais — tudo funcional
- [ ] Mobile: layout adapta (stack vertical, FAB no bottom-nav)
- [ ] Tests de integração passam: `npm test -- --runInBand`

## Verificação

1. `npm run lint` && `npm run build`
2. `npm test -- --runInBand` (testes que tocam events)
3. Verificação visual no browser pelo usuário, desktop + mobile, comparando com `refactoring/dates.jpeg`
4. Criar/editar/excluir evento e ver se persiste e re-renderiza correto

## Commit sugerido

`refactor: rebuild dates page using new section components`
