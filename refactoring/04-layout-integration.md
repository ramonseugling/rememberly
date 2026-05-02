# 04 — Layout integrando sidebar + bottom-nav + app-header

## Objetivo

Integrar os 3 componentes criados nos incrementos 1–3 dentro de `components/layout/layout.tsx`, sem ainda mexer no conteúdo das páginas. Adicionar variante para diferenciar landing (público) de app (autenticado).

Ao final deste incremento o usuário consegue navegar entre `/dates`, `/groups`, `/perfil` em desktop **com sidebar** e em mobile **com bottom-nav e header novo** — mas o conteúdo das páginas continua sendo o atual.

## Mockup de referência

`refactoring/dates.jpeg` e `refactoring/groups-page.jpeg` — observar a moldura externa (sidebar à esquerda no desktop, bottom-nav fixa no mobile, header no topo).

## Arquivos a modificar

- `components/layout/layout.tsx` — adicionar prop `variant: 'app' | 'landing'` (default `'landing'`); compor sidebar + bottom-nav + app-header quando `variant === 'app'`
- `pages/dates.tsx` — passar `variant="app"` ao `Layout`
- `pages/groups.tsx` — idem
- `pages/perfil.tsx` (se existe) — idem

## Reutilizar

- Componentes criados nos incrementos 1, 2, 3
- Estrutura atual de `Layout` (com `<Header>` condicional, `<main>`, `<BirthdayModal>` se sem birth_date)
- Estado de `add-event-modal` e `create-group-modal` — sobe para `Layout` (são triggados pelo FAB do bottom-nav)

## Estrutura do novo Layout

```
<div gradient-soft min-h-screen>
  {variant === 'app' && <AppHeader user={user} />}
  {variant === 'landing' && <Header user={user} />}

  <div flex>
    {variant === 'app' && <AppSidebar />}

    <main flex-1>
      {children}
    </main>
  </div>

  {variant === 'app' && (
    <BottomNav
      onAddEventClick={() => setAddEventOpen(true)}
      onCreateGroupClick={() => setCreateGroupOpen(true)}
    />
  )}

  <AddEventModal open={addEventOpen} onOpenChange={setAddEventOpen} />
  <CreateGroupModal open={createGroupOpen} onOpenChange={setCreateGroupOpen} />

  {birthDateMissing && <BirthdayModal ... />}
</div>
```

> **Nota:** subir os modais para o Layout pode duplicar com modais que as páginas já abrem. Avaliar: ou as páginas removem suas instâncias dos modais (delegando ao Layout), ou o Layout só monta modais que não existem na página. Recomendação: Layout mantém apenas os modais disparados pelo bottom-nav (FAB). Páginas mantêm seus próprios modais para cards/edição.

## Critérios de aceite

- [ ] Em `/dates` e `/groups` no desktop: sidebar à esquerda, header novo no topo, conteúdo no centro
- [ ] Em `/dates` e `/groups` no mobile: header novo no topo, bottom-nav no rodapé, conteúdo no meio
- [ ] Em `/` (landing): nada muda — mesmo header e mesmo footer da landing
- [ ] Navegação entre rotas mantém active state correto na sidebar e bottom-nav
- [ ] FAB do bottom-nav abre o modal correto conforme rota
- [ ] Build passa, sem warnings de hidratação

## Verificação

1. `npm run lint` && `npm run build`
2. `npm run dev` (usuário) — testar:
   - Desktop ≥ lg: sidebar visível, navegação correta, ativa em rota atual
   - Tablet/mobile < lg: sidebar oculta, bottom-nav visível, hambúrguer abre Sheet
   - Landing `/` não foi afetada
   - FAB em `/dates` abre add-event-modal; em `/groups` abre create-group-modal
3. Comparar visualmente com mockup
4. **Não esperar o conteúdo das páginas estar refatorado ainda** — só a moldura

## Commit sugerido

`refactor: integrate app sidebar, header and bottom nav into Layout`
