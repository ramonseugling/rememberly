# 03 — App header (rotas autenticadas)

## Objetivo

Criar o novo header das telas autenticadas — substitui `components/header/header.tsx` quando o usuário está logado. Inclui logo, ícone de busca, sino de notificações com badge e dropdown do avatar.

**Busca e sino são apenas placeholders visuais** nesta rodada — a funcionalidade fica para refactoring futuro.

## Mockup de referência

`refactoring/dates.jpeg` (topo desktop e mobile) e `refactoring/groups-page.jpeg` (topo desktop e mobile).

**Desktop:**

- Logo Rememberly à esquerda (visível, no mobile fica oculto pois sidebar tem o logo... revisar — mockup mostra logo no header em ambos)
- Espaço flexível
- Ícone de busca (lupa) — apenas visual
- Ícone de sino com badge "2" rosa — apenas visual
- Avatar circular + nome do usuário + chevron baixo (dropdown)

**Mobile:**

- Logo (canto esquerdo)
- Ícone de sino com badge
- Avatar
- Hambúrguer (abre Sheet com itens da sidebar)

## Arquivos a criar

- `components/app-header/app-header.tsx` — header principal
- (Possivelmente) `components/app-header/mobile-menu-sheet.tsx` — Sheet com itens da sidebar para mobile

## Arquivos a modificar

Nenhum — substituição efetiva acontece no incremento 4.

## Reutilizar

- `lucide-react`: `Search`, `Bell`, `ChevronDown`, `Menu`
- shadcn `Popover` ou `DropdownMenu` para o menu do avatar (Perfil / Sair)
- shadcn `Sheet` para menu mobile (verificar se já existe em `components/ui/`; se não, instalar via shadcn CLI)
- Tokens: `--primary` para badge do sino, `--background` para o header (`bg-background/80 backdrop-blur-sm`)
- Logo SVG existente em `components/header/header.tsx` — extrair para `components/logo/logo.tsx` se ainda não existe (passo opcional, só se reutilização justificar)

## Props sugeridas

```ts
interface AppHeaderProps {
  user: { id: string; name: string; email: string; avatar_url?: string };
}
```

## Critérios de aceite

- [ ] Sticky top, `border-b`, `backdrop-blur-sm`
- [ ] Avatar dropdown com itens "Perfil" (link `/perfil`) e "Sair" (chama API logout)
- [ ] Sino com badge `2` (placeholder hardcoded — sem cálculo real de notificações)
- [ ] Lupa: visual, sem onClick (cursor pode ser pointer mas sem ação)
- [ ] Mobile: hambúrguer abre Sheet com mesmos itens da sidebar (Datas/Grupos/Perfil + Configurações/Ajuda inativos + card Convide amigos)
- [ ] Não aparece em rotas públicas (landing) — controle no Layout (incremento 4)

## Notas de implementação

- Logout: já existe endpoint? Verificar `pages/api/v1/sessions/` antes de implementar. Se não trivial, copiar do `header.tsx` atual.
- Avatar fallback: iniciais do nome se `avatar_url` ausente.

## Verificação

1. `npm run lint` e `npm run build`
2. Verificação visual no incremento 4

## Commit sugerido

`feat: add app header with avatar dropdown and mobile menu`
