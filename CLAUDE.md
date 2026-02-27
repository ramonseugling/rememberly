# my-forever-dates

## Visão do produto

Aplicação multi-usuário para registrar datas importantes de pessoas e receber notificações por e-mail no dia do evento.

**Problema que resolve**: lembrar de datas anuais como aniversários, casamentos e início de relacionamentos das pessoas importantes da sua vida.

### Entidades

**User**

- `name` — nome
- `email` — e-mail (único)
- `password` — senha (hash bcrypt)
- `id`, `created_at`, `updated_at`

**Event**

- `title` — nome livre (ex: "Pedro", "Aniversário de namoro com Ana")
- `type` — enum: `birthday`, `dating_anniversary`, `wedding_anniversary`, `celebration`
- `date` — data do evento (dia + mês, sem ano obrigatório — eventos repetem anualmente)
- `user_id` — FK para o usuário dono do evento
- `id`, `created_at`, `updated_at`

### Regras de negócio

- Cada usuário vê e gerencia apenas seus próprios eventos
- Eventos são sempre anuais — repetem todo ano na mesma data
- No dia do evento, o usuário recebe um e-mail com o título do evento
- Notificação enviada apenas no dia — sem antecedência
- Um cron job diário verifica os eventos do dia e dispara os e-mails

### Fluxo principal

1. Usuário cria conta (name, email, senha) e faz login
2. Cadastra eventos com título, tipo e data
3. Todo dia de manhã recebe e-mails para cada evento que cai naquele dia

### Acesso

- Cadastro aberto — qualquer pessoa pode criar uma conta

## Decisões técnicas

### Notificações

- **Cron job**: Vercel Cron Jobs — executa diariamente de manhã chamando um endpoint interno
- **E-mail**: Nodemailer + SMTP
- Localmente: MailCatcher para interceptar e-mails sem envio real

### UI

- **Tailwind CSS v4** com `@theme` (sem `tailwind.config.ts`)
- **shadcn/ui** para componentes base (`components/ui/`)
- **Fontes Google**: Fredoka (heading) + Quicksand (body) via `next/font/google`
- Design system definido em `styles/globals.css`

### Deploy

- A definir — Vercel Cron Jobs exige hospedagem na Vercel
- Banco de dados: a definir (Railway ou Supabase)

## Stack

- Next.js 16, React 19, TypeScript (strict mode)
- PostgreSQL (via `pg` — sem ORM, SQL puro com queries parametrizadas)
- `node-pg-migrate` para migrations
- Prettier: single quotes, semi, tabWidth 2, trailingComma all

## Arquitetura MVC

Implementação simples com camadas bem definidas e responsabilidades separadas.

```
HTTP Request
    ↓
[Controller]  pages/api/v1/*       → recebe a requisição, chama model, devolve resposta
    ↓
[Middleware]  infra/controller.ts  → autenticação, autorização, tratamento de erros
    ↓
[Model]       models/*             → regras de negócio e acesso a dados
    ↓
[Infra]       infra/database.ts    → execução das queries PostgreSQL
```

### Camadas

**Controller** (`pages/api/v1/`)

- Recebe a requisição HTTP
- Delega para o model correspondente
- Devolve a resposta

**Middleware** (`infra/controller.ts`)

- **Autenticação**: valida se o usuário está logado (sessão válida)
- **Autorização**: valida se o usuário tem permissão para acessar o recurso
- **Erros**: captura exceções e formata a resposta de erro

**Model** (`models/`)

- Toda a lógica de negócio
- Queries ao banco de dados
- Validações de domínio

**Infra** (`infra/`)

- `database.ts` — pool de conexão e execução de queries
- `errors.ts` — classes de erro customizadas
- `migrations/` — schema do banco

## Estrutura de pastas

```
pages/
  index.tsx
  _app.tsx           → wrapper global com fontes aplicadas
  _document.tsx      → HTML base
  api/
    v1/              → todos os endpoints aqui
components/
  ui/                → componentes shadcn/ui (Button, Card, Badge...)
  layout/            → layout.tsx
  header/            → header.tsx
  footer/            → footer.tsx
  [feature]/         → cada componente em seu próprio diretório
lib/
  fonts.ts           → instâncias next/font/google centralizadas
  utils.ts           → cn() (clsx + tailwind-merge)
mocks/               → dados mock para desenvolvimento
models/              → lógica de negócio (user.ts, event.ts, session.ts)
infra/
  database.ts        → pool de conexão PostgreSQL
  errors.ts          → classes de erro customizadas
  controller.ts      → middleware: auth, autorização, erros
  migrations/        → arquivos de migration
  scripts/           → utilitários (ex: wait-for-postgres)
styles/
  globals.css        → design system (Tailwind v4 @theme, CSS vars, utilitários)
tests/
  orchestrator.ts    → setup/teardown dos testes
  integration/
    api/v1/          → testes espelhando estrutura de endpoints
```

## API

- Versionar endpoints em `/api/v1/`
- Usar `next-connect` para roteamento por método HTTP
- Respostas: 201 para criação, 200 para sucesso, 4xx/5xx para erros
- Erros sempre retornam JSON com: `name`, `message`, `action`, `status_code`

## Erros customizados (`infra/errors.ts`)

Criar hierarquia de erros com classes tipadas:

- `ValidationError` → 400
- `NotFoundError` → 404
- `UnauthorizedError` → 401
- `MethodNotAllowedError` → 405
- `ServiceError` → 503
- `InternalServerError` → 500

Cada erro implementa `toJSON()` para resposta consistente na API.

## Banco de dados

- Queries com parâmetros (`$1, $2`) — nunca interpolação de string
- `RETURNING *` nas operações de create/update
- Verificações case-insensitive para campos únicos (username, email)
- SSL automático em produção

## Migrations

- Usar `node-pg-migrate`
- `exports.down = false` — sem rollback automático
- Campos padrão em todas as tabelas:
  - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ DEFAULT NOW()`

## Testes

- Framework: Jest
- Filosofia: **sem mocks** — usar serviços reais (banco real, etc.)
- Testes espelham estrutura de endpoints: `tests/integration/api/v1/...`
- `orchestrator.ts` centraliza: `clearDatabase()`, `runPendingMigrations()`, factories
- Usar `@faker-js/faker` para geração de dados de teste
- Timeout padrão: 60 segundos
- Rodar com `--runInBand` (sequencial) para evitar conflitos no banco

## Convenções de código

### Componentes

- **Pages** (`pages/*.tsx`): `export default function NomeDaPagina()`
- **Componentes** (`components/**/*.tsx`): `export const NomeDoComponente = () => {}`
- Um componente por diretório, arquivo com nome explícito (não `index.tsx`)
  - Ex: `components/date-card/date-card.tsx`
- Props tipadas com `interface`:
  ```ts
  interface DateCardProps {
    name: string;
    type: 'birthday' | 'anniversary';
  }
  ```
- Importações sempre com alias `@/`:
  - `import { Button } from '@/components/ui/button'`

### Geral

- Sem `any`
- Sem comentários óbvios
- Mensagens de erro voltadas ao usuário em português

### Fontes (next/font/google)

Instâncias centralizadas em `lib/fonts.ts`. Aplicadas em `pages/_app.tsx`:

- `quicksand.className` na div wrapper → fonte do corpo via herança CSS
- `fredoka.style.fontFamily` via `<style>` tag → aplicada em `h1-h6` e `.font-heading`

Motivo: no Pages Router, variáveis CSS de fontes não ficam disponíveis em elementos pai (body/html) quando aplicadas em divs filhas. O `<style>` tag injeta o valor real da fonte gerado pelo next/font.

## Commits

- Seguir Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Validar com commitlint + husky

## Infraestrutura local

- Docker Compose em `infra/compose.yaml` para PostgreSQL local
- Script `wait-for-postgres` antes de subir o servidor
- `.env.development` para variáveis locais
