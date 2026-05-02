# 01 — Sidebar lateral (desktop)

## Objetivo

Criar uma sidebar lateral fixa no desktop para as rotas autenticadas, contendo navegação principal, navegação secundária e card promocional. Nesta etapa o componente é **presentational** — recebe `currentPath` (ou usa `useRouter`) e nada mais. A integração no layout acontece no incremento 4.

## Mockup de referência

`refactoring/dates.jpeg` (esquerda do desktop) e `refactoring/groups-page.jpeg` (esquerda do desktop) — sidebar idêntica.

Estrutura da sidebar (top → bottom):

1. Logo Rememberly (link para `/`)
2. Itens primários (com active state em rosa quando rota atual):
   - Minhas Datas → `/dates` (ícone calendário)
   - Grupos → `/groups` (ícone pessoas)
   - Perfil → `/perfil` (ícone usuário)
3. Separador visual
4. Itens secundários (**sem href, inativos**):
   - Configurações (ícone engrenagem)
   - Ajuda (ícone interrogação)
5. Card "Convide amigos" no rodapé (placeholder visual, sem ação):
   - Ícone presente
   - Texto "Convide amigos — Para usar o Rememberly e ganhe benefícios"
   - Seta `>` à direita

## Arquivos a criar

- `components/app-sidebar/app-sidebar.tsx` — componente principal
- (Opcional, só se ficar grande) `components/app-sidebar/sidebar-nav-item.tsx` — item de nav reutilizável interno

## Arquivos a modificar

Nenhum — a integração com layout fica para o incremento 4.

## Reutilizar

- Ícones de `lucide-react` (já presente no projeto: `Calendar`, `Users`, `User`, `Settings`, `HelpCircle`, `Gift`, `ChevronRight`)
- `cn()` de `@/lib/utils` para active state
- Tokens: cor `--primary`/`bg-primary/10` para active, `text-foreground` para inativo
- `useRouter` de `next/router` para detectar rota atual

## Props sugeridas

```ts
interface AppSidebarProps {
  // sem props — componente lê useRouter internamente
}
```

## Critérios de aceite

- [ ] Sidebar renderiza com logo, 3 itens primários, separador, 2 itens secundários inativos e card "Convide amigos"
- [ ] Item ativo destacado em rosa quando `router.pathname` corresponde
- [ ] Itens "Configurações" e "Ajuda" renderizam mas não são clicáveis (sem `<Link>`, talvez `cursor-default opacity-60`)
- [ ] Card "Convide amigos" é visual, sem `onClick`
- [ ] `hidden lg:flex` — não aparece abaixo de `lg`
- [ ] Largura fixa (sugestão: `w-64`)
- [ ] Sticky/fixed durante scroll da página
- [ ] Sem dependência de dados de usuário/eventos (só rota)

## Verificação

1. `npm run lint` e `npm run build`
2. Renderizar isoladamente em um page de teste OU esperar o incremento 4 para ver no contexto

> Nota: pode ser tentador "testar" plugando direto no layout, mas isso adianta o incremento 4 e quebra o princípio de PR isolado. Resista.

## Commit sugerido

`feat: add app sidebar component`
