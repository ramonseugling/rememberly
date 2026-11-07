# Backlog de produto — Design system mobile e wishlist

## Direção definida

A proposta amplia o Rememberly de lembretes de datas para **listas de desejos e organização de presentes entre pessoas dos mesmos grupos**.

Após o design system, o primeiro marco funcional novo será **wishlist com reservas secretas no mobile**, usando o backend atual. Compartilhamento público, experiência dedicada de aniversário e push ficam para etapas posteriores.

Decisões confirmadas nesta conversa:

- Mobile primeiro; wishlist no web será uma entrega posterior.
- Compartilhamento inicialmente restrito a grupos autorizados.
- Navegação aprovada em 07/11: **Início · Eventos · Grupos · Desejos · Perfil**, sem botão central. Substitui a proposta anterior de quatro abas. Desejos exibe somente “Em breve” até a implementação da wishlist.
- Datas comemorativas continuam disponíveis pelo Perfil.
- A refatoração anterior e o calendário permanecem descartados. A nova etapa aprovada é um design system minimalista acolhedor, com catálogo e pilotos reais de Datas e Perfil.
- Decisões de negócio ainda abertas serão registradas como bloqueios antes das respectivas implementações.

## Etapa atual — Design system antes da wishlist

Atualizado em 07/11/2026. O web permanece fora desta rodada. As duas primeiras propostas visuais foram rejeitadas; a referência vigente é o [recorte da tela inicial](../mobile/references/home-color-reference.png), com extração de pixels documentada no design system. Referências e plano não substituem os AGENTS.md existentes.

Ordem: registrar este backlog → definir tokens e componentes → catálogo e pilotos → aprovação visual do usuário → padronizar demais telas → iniciar wishlist.

| ID     | Prioridade | Estado                                     | Entrega / aceite                                                                                                                                                                      | Dependência             |
| ------ | ---------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| DS-001 | P0         | Implementado; nova revisão visual pendente | Especificação alinhada ao mock: cores semânticas, fonte nativa, espaçamentos, dimensões, bordas, sombras, ícones e movimento em docs/mobile/design-system.md.                         | Este registro           |
| DS-002 | P0         | Implementado; revisão visual pendente      | Base isolada em mobile/src/design-system/: texto, botões, campos, seletores, cards, linhas, badges, switches, checkbox, OTP, feedback e painéis. Nenhuma troca global do tema legado. | DS-001                  |
| DS-003 | P0         | Implementado; revisão visual pendente      | Catálogo apenas em desenvolvimento, com estados interativos e dados de demonstração identificados. Nenhum envio, cadastro ou exclusão real automático.                                | DS-002                  |
| DS-004 | P0         | Implementado; revisão visual pendente      | Datas e Perfil reais usando a nova base; preservar recursos, navegação e dados. Testes/tipos/bundles e validação visual no dispositivo.                                               | DS-002/003              |
| DS-005 | P0         | Bloqueado                                  | Após aprovação dos pilotos, migrar Grupos, Especiais e autenticação; eliminar estilos duplicados substituídos e consolidar tokens.                                                    | Aprovação visual DS-004 |

A aprovação visual é do usuário e não pode ser inferida de tipos, testes ou bundles. Registrar evidência por rodada. A primeira execução termina com catálogo e pilotos prontos para revisão; não migra outras telas nem inicia wishlist automaticamente.

Não incluir nesta etapa: tema escuro, calendário, fotos, novas preferências/regras de notificação, mudanças de API/banco, pagamentos, rebranding completo ou alteração do site. Preservar backdrop estacionário e animação independente dos painéis, teclado, safe areas e redução de movimento.

Todos os marcos REM abaixo ficam bloqueados para implementação até a conclusão e aprovação do design system. As decisões de negócio listadas ao final continuam pendentes; exemplos de tabelas/rotas dos materiais recebidos devem seguir SQL parametrizado, /api/v1/ e migrações progressivas do projeto.

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

Este documento registra planejamento e decisões aprovadas. A wishlist não está implementada. O histórico original desta proposta foi preservado em whishlist4.md; este arquivo é o índice atualizado de execução.

## Evidência da rodada DS-001–004 — 06/11/2026

Planejamento versionado antes do código no commit 5d61a8a. Catálogo e pilotos reais de Datas/Perfil implementados com tokens isolados; navegação, tema legado, APIs e regras de negócio preservados. Verificação local: 97 testes mobile, TypeScript, formatação dos arquivos alterados e exports Hermes iOS/Android passaram. Testes novos verificam os pares de contraste e a disponibilidade do catálogo somente em ambiente/bundle de desenvolvimento. O preview usa o banco local existente, sem limpeza ou seed.

Aprovação visual, texto ampliado, teclado, leitores de tela e movimento em dispositivo: pendentes da revisão do usuário. DS-005 e toda implementação da wishlist continuam bloqueadas até essa aprovação.

## Revisão visual pelo mock — 07/11/2026

O usuário rejeitou a aparência da primeira proposta e indicou um mock específico. A revisão substitui a tipografia Quicksand dos pilotos por fonte nativa, aproxima a paleta do rosa suave da imagem, usa ações principais em gradiente rosa e torna as linhas de Datas e os painéis de Perfil mais compactos. O catálogo inclui uma composição visual de demonstração. A imagem foi preservada em docs/mobile/references/rememberly-visual-reference.png.

O escopo continua em catálogo, base e pilotos de Datas/Perfil. Desejos, reservas, fotos, navegação futura e demais telas do mock permanecem nos marcos correspondentes. A nova aparência ainda requer aprovação visual no dispositivo; DS-005 e wishlist permanecem bloqueados.

Validação desta revisão: TypeScript, 97 testes mobile, formatação completa de mobile e exports Hermes iOS/Android aprovados. Preview do Expo Go e API local alcançáveis; banco preservado, sem seed. Isso não representa aprovação visual nem teste de dispositivo.

## Correção da referência — 07/11/2026

A revisão d3e9d28 também foi rejeitada. A referência vigente passa a ser o recorte home-color-reference.png, com cores amostradas dos pixels e proporções corrigidas para viewport mobile. DS-001–004 continuam em revisão visual; DS-005 e wishlist permanecem bloqueados. Ver método e medidas no documento do design system.

## Início e navegação aprovados — 07/11/2026

O usuário antecipou explicitamente esta mudança de navegação e a criação do Início durante a revisão visual. Isso substitui a restrição anterior de aguardar a wishlist para alterar as abas; não libera a funcionalidade de desejos.

- Saudação com primeiro nome, emoji 👋, texto “Aqui estão suas próximas celebrações” e avatar com inicial que abre Perfil.
- Próximos eventos: até três aniversários reais da agenda (pessoais e de grupos), ordenados por dias até a próxima ocorrência. Inclui hoje e a virada do ano; exclui outros tipos de evento. Empates usam título e ID para estabilidade, sem fundir pessoas pelo nome.
- “Ver todos” abre Eventos. Cada aniversário abre seus dados atuais em Eventos; edição disponível somente para eventos pessoais autorizados.
- Meus grupos: até dois grupos, na ordem atual da API. “Ver todos” retorna à listagem de Grupos mesmo após uma visita aos detalhes. Cada card abre seu grupo.
- Abas: Início, Eventos, Grupos, Desejos e Perfil. A aba Desejos apresenta “Em breve”, sem ações de wishlist.
- Adicionar evento fica em Eventos; Criar grupo permanece em Grupos. Especiais fica acessível pelo Perfil. Notificações de evento agora direcionam a Eventos.
- Estados de carregamento, erro com tentativa novamente, vazio e atualização por gesto usam as APIs e as proteções de sessão existentes.

Aceite visual em dispositivo pendente. Exploração visual das demais telas fica para a próxima rodada; implementação da wishlist continua bloqueada.

Verificação da entrega Início: 101 testes mobile, TypeScript, formatação e bundles Hermes iOS/Android aprovados. Smoke autenticado de leitura de perfil, agenda e grupos passou; sessão do smoke revogada. Validação visual e navegação manual no aparelho permanecem pendentes.

## Eventos — referência visual de 07/11/2026

A tela Eventos foi revisada segundo o [mock enviado](../mobile/references/events-reference.png): título e descrição no topo, ícone de calendário como ação de adicionar, seções “Próximos 7 dias”, “Este mês” e “Mais pra frente”, cards compactos com avatar por inicial, nome, tipo, badge de hoje ou data abreviada e seta de detalhes. Ao tocar, o usuário vê o evento; eventos pessoais continuam editáveis no painel existente. Não há fotos cadastradas atualmente.

“Este mês” passou a significar o mês civil da data local retornada pela agenda; uma data dos próximos sete dias permanece na primeira seção mesmo quando cruza a virada do mês. As demais datas aparecem em ordem cronológica, com expansão para listas longas. Estados vazio, erro, atualização e CRUD permanecem disponíveis. Validação visual no aparelho: pendente.
`nVerificação da rodada Eventos: 102 testes mobile, TypeScript, formatação e exports Hermes iOS/Android aprovados. Aprovação visual no dispositivo pendente.
