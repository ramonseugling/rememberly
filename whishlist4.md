# Backlog consolidado — Wishlist e presentes no Rememberly

## Direção definida

A proposta amplia o Rememberly de lembretes de datas para **listas de desejos e organização de presentes entre pessoas dos mesmos grupos**.

O primeiro marco será **wishlist com reservas secretas no mobile**, usando o backend atual. Compartilhamento público, experiência dedicada de aniversário e push ficam para etapas posteriores.

Decisões confirmadas nesta conversa:

- Mobile primeiro; wishlist no web será uma entrega posterior.
- Compartilhamento inicialmente restrito a grupos autorizados.
- Navegação: **Datas · Grupos · Desejos · Perfil**.
- Datas comemorativas continuam disponíveis pelo Perfil.
- O redesign minimalista e o calendário anteriormente cancelados permanecem descartados.
- Decisões de negócio ainda abertas serão registradas como bloqueios antes das respectivas implementações.

## O que já existe e o que é novidade

| Área                           | Estado atual                                                     | Trabalho necessário                                           |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Contas, autenticação e sessões | Implementados no web e mobile                                    | Reutilizar e proteger os novos recursos                       |
| Datas e grupos                 | Implementados                                                    | Acrescentar acesso aos desejos dos membros                    |
| Wishlist pessoal               | Ausente                                                          | Dados, APIs e telas                                           |
| Compartilhamento de wishlist   | Ausente                                                          | Permissões explícitas por grupo                               |
| Reservas e compras declaradas  | Ausentes                                                         | Concorrência, confidencialidade e interfaces                  |
| Tela dedicada de aniversário   | Ausente                                                          | Identificação da pessoa e ocorrência, leitura autorizada      |
| Fotos de perfil                | Sem suporte funcional identificado                               | Definir necessidade e privacidade; inicialmente usar iniciais |
| Push                           | Infraestrutura implementada, envio desativado                    | Configuração, operação e validação em builds instaladas       |
| Deep links                     | Convites e recuperação implementados; notificações levam às abas | Acrescentar destino específico de aniversário                 |
| Observabilidade                | Axiom e Analytics web existentes                                 | Instrumentar o novo funil sem dados sensíveis                 |

**Distinção importante:** aniversários dos grupos são derivados do cadastro dos usuários. Um evento pessoal chamado “Pedro” é texto livre e não identifica necessariamente uma conta. Não associaremos wishlist a alguém pelo nome.

## Backlog por marco

### Marco 0 — Consolidar contexto e fechar os contratos

| ID      | Prioridade | Entrega e aceite                                                                                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REM-000 | P0         | Consolidar visão, decisões e backlog em `docs/product/`, preservando o histórico de mobile. Mesclar orientações úteis dos arquivos recebidos sem substituir o `AGENTS.md` existente. |
| REM-001 | P0         | Consolidar a auditoria iniciada nesta conversa: capacidades existentes, lacunas, referências de código e limites de validação. Estado inicial: **em revisão**.                       |
| REM-002 | P0         | Fechar dados, autorização, contratos de resposta e políticas de ciclo de vida. A implementação de reservas fica bloqueada pelas decisões listadas abaixo.                            |
| REM-501 | P1         | Diagnosticar antecipadamente os requisitos reais de push, links e builds, reutilizando os registros existentes. Identificar dependências externas sem ativar envios.                 |

**Correções aos documentos recebidos:** o projeto usa PostgreSQL com SQL parametrizado, sem ORM; rotas sob `/api/v1/`; migrações progressivas com rollback automático desabilitado. Os exemplos de tabelas e endpoints são propostas, não o estado atual.

### Marco 1 — Wishlist e reservas no mobile

Executar na ordem abaixo, com entregas pequenas e verificáveis.

| Ordem / IDs   | Prioridade | Entrega e critério principal                                                                                                                                                                                |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — REM-101   | P0         | Persistência de uma wishlist permanente por usuário e seus itens. Título obrigatório; campos opcionais conforme contrato aprovado. Lista privada por padrão.                                                |
| 2 — REM-201   | P0         | Compartilhamento com grupos escolhidos pelo dono. Acesso exige vínculo atual autorizado e considera a união dos grupos em comum.                                                                            |
| 3 — REM-102   | P0         | APIs de criação, leitura, edição e exclusão pelo proprietário. Validar URLs e não buscar conteúdo externo.                                                                                                  |
| 4 — REM-103   | P0         | Tela **Meus desejos** no mobile: cadastro, edição, exclusão, estados vazio/erro/carregamento e seleção dos grupos autorizados. Ajustar a navegação aprovada.                                                |
| 5 — REM-202   | P0         | Abrir a wishlist de outro membro pelo grupo. Não duplicar itens quando houver vários grupos em comum; tratar acesso revogado.                                                                               |
| 6 — REM-301   | P0         | Persistência de reservas: uma reserva ativa global por item, inclusive sob concorrência e entre grupos diferentes.                                                                                          |
| 7 — REM-302   | P0         | APIs para reservar, marcar como comprado e cancelar. Somente o responsável gerencia sua reserva; conflitos retornam `409`.                                                                                  |
| 8 — REM-303   | P0         | Interface dos presenteadores com disponibilidade e ações. O dono recebe somente seus desejos, sem estado de reserva, compra ou identidade do responsável.                                                   |
| 9 — REM-304   | **P0**     | Implementar e testar as políticas aprovadas para edição/exclusão, perda de acesso e exclusão de conta. Esta história deixa de ser P1 e passa a bloquear o lançamento de reservas.                           |
| 10 — REM-601A | P1         | Medição mínima de criação, compartilhamento, visualização e reserva. Usar a observabilidade existente quando suficiente, sem registrar títulos, URLs ou estados secretos em superfícies acessíveis ao dono. |
| 11 — REM-602A | P0         | Piloto controlado no mobile: autorização, concorrência, regressões, estados de interface e validação em dispositivo. Liberação reversível das novas funções.                                                |

**Dependência principal:** contratos aprovados → persistência e permissões → wishlist própria e de membros → reservas e ciclo de vida → piloto.

### Marco 2 — Tela de aniversário e notificações

| IDs             | Prioridade | Entrega e aceite                                                                                                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REM-401         | P1         | Tela dedicada de aniversário, reutilizando a pessoa cadastrada e a ocorrência anual. Não criar aniversários paralelos nem vincular eventos pessoais por nome.       |
| REM-402         | P1         | Mostrar desejos apenas quando o visitante tiver acesso. A tela do aniversariante continua sem dados de reservas.                                                    |
| REM-502A        | P1         | Estender navegação e payloads para abrir a pessoa/ocorrência correta, inclusive após login. Revalidar autorização no destino.                                       |
| REM-502B        | P1         | Preparar e validar push real: credenciais, builds instaladas, permissões, processamento de recibos, retries e monitoramento. Reutilizar a infraestrutura existente. |
| REM-601B / 602B | P1         | Medir abertura de aniversário/notificação e validar lançamento integrado.                                                                                           |
| REM-403         | P2         | Facilitar felicitações usando compartilhamento ou outra capacidade aprovada, sem envio automático em nome do usuário.                                               |

Push não será requisito para validar inicialmente o valor das wishlists e reservas.

### Evoluções posteriores

- **Wishlist no web:** oferecer a experiência a quem chega por convite sem instalar o app.
- **REM-203:** link público revogável, sem informações de reserva ou compra.
- **REM-503:** aviso antecipado de aniversário para preparar presentes, com opção explícita do usuário. Os lembretes antecipados atuais continuam existindo.
- Fotos, preço/imagem dos desejos, ordenação avançada e outras melhorias conforme escopo aprovado.
- Extração de informações de lojas por URL, com análise específica de segurança.
- Presentes coletivos, afiliados, pagamentos, assinatura e B2B permanecem hipóteses futuras.

## Decisões de negócio que bloqueiam histórias

Estas decisões não serão tomadas implicitamente durante a implementação:

| Decisão                                                                                                 | Precisa estar resolvida antes de |
| ------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Campos do primeiro formulário, ordenação e limite de itens — os 50 itens são apenas sugestão            | REM-101/103                      |
| O que acontece quando o dono altera ou exclui um item reservado/comprado, sem revelar que houve reserva | REM-002, antes das reservas      |
| Como o responsável acompanha ou cancela uma reserva após perder acesso ao grupo/lista                   | REM-302/304                      |
| Tratamento das reservas quando o dono ou o presenteador exclui a conta                                  | Migrações e REM-304              |
| Quando uma reserva expira ou um item comprado pode voltar a ficar disponível                            | REM-301/304                      |
| Identidade da ocorrência anual, contexto de múltiplos grupos e informações pessoais exibidas            | REM-401                          |
| Inclusão de fotos, exposição de idade e forma de enviar parabéns                                        | Funcionalidades correspondentes  |

## Contratos técnicos e validação

- Reutilizar backend, sessões, grupos e padrões MVC existentes. Não criar um backend exclusivo para wishlist mobile.
- Separar explicitamente as respostas do proprietário e dos presenteadores. Esconder informações na interface não atende ao requisito de confidencialidade.
- Tratar disponibilidade como derivada das reservas; proteger a exclusividade no banco e em transações.
- Revalidar acesso em cada leitura e alteração; cache, erros e respostas alternativas também não podem revelar reservas ao dono.
- Validar corridas com PostgreSQL real: dois usuários tentando reservar o mesmo item, inclusive por grupos diferentes.
- Cobrir proprietário, membro autorizado, terceiro, ex-membro, múltiplos grupos, revogação e exclusão de conta.
- Testar repetição de requisições, falhas de rede, expiração de sessão e atualização dos dados no mobile.
- Preservar autenticação, eventos, grupos, e-mails e fluxos já aprovados. Testes de push e links em builds instaladas permanecem separados dos testes no Expo Go.

O resultado desta etapa é um backlog organizado e comparado ao código. **Nenhum arquivo foi alterado e nenhuma funcionalidade nova está sendo declarada como implementada.**
