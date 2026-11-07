# Design system mobile — minimalista acolhedor

Atualizado em 07/11/2026. Estado: duas propostas visuais rejeitadas; revisão atual baseada em extração de pixels e proporções da referência recortada.

## Referência visual

A referência vigente é o [recorte da tela inicial](references/home-color-reference.png), de 202 × 407 pixels. O [mock completo anterior](references/rememberly-visual-reference.png) fica como histórico. Cores foram amostradas com System.Drawing.Bitmap.GetPixel, usando frequências em regiões planas e pixels mais saturados nos ícones; não são valores de um arquivo de design original.

| Amostra             | Região em pixels (x, y) | Cor observada                        |
| ------------------- | ----------------------- | ------------------------------------ |
| Fundo               | x45–149, y30–39         | #FCF4F8 (259 ocorrências)            |
| Superfície de grupo | x60–129, y273–278       | #FDF9FB (56 ocorrências)             |
| Badge comum         | x139–176, y169–179      | #F3E6EF                              |
| Texto escuro        | x15–74, y42–55          | #221921 (mediana dos pixels escuros) |
| Ícone ativo         | x27–47, y360–386        | #E53565 e #D52555                    |
| Card de hoje        | x18–186, y105–154       | #FEE6E8 → #FEF1F7                    |
| Badge de hoje       | x146–177, y111–115      | #FEDECB                              |
| Ícone família       | x22–48, y275–298        | #EE1124; fundo #FEE7DE               |
| Ícone amigos        | x22–48, y311–336        | #AC26A4                              |

A imagem tem antialiasing, sombras e gradientes. Bordas, texto secundário, estados ausentes e superfícies complementares são adaptações documentadas; não devem ser apresentados como valores exatos extraídos. O rosa de marca #E53565 permanece nos ícones. Texto de ação pequeno sobre rosa usa #BB204B para contraste, sem escurecer a paleta inteira. Badge de hoje usa texto #994017 sobre #FEDECB.

Proporções aproximadas para viewport lógico de 390 pontos (escala ~2×): margens 16, avatares 56, linhas de evento a partir de 80, grupos 68, raios 22, badges com raio 10. Títulos 24 e seções 20. O catálogo reutiliza esses componentes na composição da referência. Fotos e navegação da imagem não acrescentam funcionalidades nesta etapa.

## Escopo e adoção

Base v2 isolada em mobile/src/design-system/. Pilotos reais: Eventos (antes Datas), Perfil e a nova tela Início. O usuário autorizou a nova navegação de cinco abas nesta rodada. Preservar o tema legado das demais telas, o web, APIs e regras de acesso. Após aprovação dos pilotos, aplicar a Grupos, Especiais e autenticação em DS-005. Wishlist permanece bloqueada; ver ../product/BACKLOG.md.

Usar fonte nativa: System no iOS e sans-serif no Android, com pesos explícitos 400, 600 e 700. A escolha anterior de Quicksand nos pilotos foi substituída para aproximar a composição do mock. Sem novas fontes ou dependências. Fredoka e Quicksand continuam nas telas legadas até a migração aprovada.

## Tokens

| Papel                    | Valor             | Uso                                                     |
| ------------------------ | ----------------- | ------------------------------------------------------- |
| background               | #FCF4F8           | Fundo rosado discreto                                   |
| surface                  | #FDF9FB           | Cards e painéis                                         |
| surfaceMuted             | #F3E6EF           | Agrupamentos e desabilitados                            |
| text                     | #221921           | Conteúdo principal                                      |
| textMuted                | #594553           | Conteúdo secundário                                     |
| primary                  | #D52555           | Ação sólida e foco                                      |
| brand                    | #E53565           | Ícones ativos, amostra saturada do mock                 |
| actionText               | #BB204B           | Texto de ação sobre fundos claros                       |
| todaySurface / todayText | #FEDECB / #994017 | Badge de hoje                                           |
| family / familySurface   | #EE1124 / #FEE7DE | Ícones de família na composição                         |
| friends / friendsSurface | #AC26A4 / #F8E5F5 | Ícone extraído e fundo complementar de amigos           |
| primaryPressed           | #BB204B           | Ação pressionada                                        |
| onPrimary                | #FFFFFF           | Texto sobre ação primária                               |
| border                   | #F0E4EC           | Separação de superfícies, não indicador único de campos |
| controlBorder            | #A28698           | Limites de campos e seletores                           |
| outlineBorder            | #FADADE           | Contorno decorativo de botões com rótulo explícito      |
| iconSurface              | #FEE6E8           | Fundo de ícones e badges em destaque                    |
| danger                   | #B42335           | Erros e ações destrutivas                               |
| success                  | #245B34           | Confirmações                                            |
| successSurface           | #EAF5E8           | Fundo de confirmação                                    |
| dangerSurface            | #FDECF0           | Fundo de erro ou ação destrutiva                        |
| accent                   | #D05126           | Detalhes decorativos de celebração                      |
| actionGradient           | #D52555 → #D52555 | Ação principal com texto branco                         |
| actionPressedGradient    | #BB204B → #BB204B | Ação principal pressionada                              |
| celebration              | #FEE6E8 → #FEF1F7 | Destaque de hoje com texto escuro                       |
| backgroundGradient       | #FCF4F8 → #FDF9FB | Fundo suave da composição do catálogo                   |

Ação primária sólida no rosa #D52555; o recorte não demonstra gradiente em botão principal. Os dois stops iguais preservam a interface dos componentes compartilhados. Secundárias recebem fundo suave e texto #BB204B. Somente o destaque de hoje usa gradiente rosa-pêssego. Raios menores substituem a cápsula exagerada da rodada anterior.

Tipografia: título 24/30 com peso 700, seção 20/26 com peso 700, corpo 14/20 com peso 400, rótulo 16/22 com peso 600 e legenda 12/17 com peso 400 (tamanho/altura em pontos). Respeitar escala de fonte do sistema, sem truncar instruções e erros essenciais.

Espaçamentos: 4, 8, 12, 16, 20, 24, 32, 40. Margem lateral 16; padding de card 16; gap de campo 6–8. Raios: controle 12, linha 22, card 22, painel 28, botão 16. Área interativa mínima de 48 × 48 para ações independentes; listas e formulários adaptam à fonte grande. Ícones Lucide existentes, 18–24, traço consistente. Bordas discretas; sombra de card: 0 2px 6px rgba(108, 39, 77, 0.06). Linhas recebem a mesma sombra discreta dos cards.

## Componentes e estados

Texto semântico; botão primário/secundário/destrutivo/textual; campo com rótulo, dica e erro; seletor em painel; card; linha de lista; badge; switch; checkbox; OTP de seis dígitos; feedback; painel inferior.

Cada controle trata foco, pressionado, desabilitado e carregamento quando aplicável. Erro e sucesso usam texto/ícone além de cor. Spinner e mensagens precisam de rótulos acessíveis. Valores de checkbox/switch no catálogo são locais; não representam preferências reais da conta.

Painel: backdrop estacionário com opacidade independente, translação só no conteúdo, comportamento pendente preservado e respeito a redução de movimento. Reutilizar a implementação existente com parametrização visual, sem duplicar o fluxo de modal.

## Catálogo e pilotos

Catálogo acessível somente em ambiente development por entrada de desenvolvimento no Perfil. Usar também bloqueio de rota, não apenas esconder o link. Exemplos explicitamente identificados como demonstração; sem acesso ao cliente de dados para mutações.

Datas: linhas compactas com inicial circular, tipo, data, origem e badge de contagem; gradiente suave apenas para hoje. Manter seções, expansão, CRUD e exclusão no editor. Perfil: identificação centralizada com inicial circular, formulário e painéis discretos; preservar seletores, salvar, sair, exclusão e opções adicionais existentes. Nenhuma preferência nova, foto ou recurso simulado nas telas reais.

## Critérios de validação

Verificar contraste, áreas de toque, texto ampliado, rótulos, erro/sucesso, teclado, safe areas e redução de movimento. Executar tipos, formatação, testes pertinentes e exports Hermes iOS/Android. Testes de contraste e disponibilidade do catálogo cobrem comportamentos novos; não criar testes que apenas espelham estilos.

Registrar testes e limites reais após implementação. Aprovação visual dos pilotos: pendente. Build assinado, provider Google, push e associação HTTPS permanecem fora da aceitação visual no Expo Go.

## Implementação e acesso ao catálogo

A base e os pilotos de Datas e Perfil estão implementados e aguardam aprovação visual. Componentes antigos continuam usando sua aparência original quando o parâmetro opcional appearance não é fornecido. Seletores, OTP e painel compartilham o comportamento existente; apenas a aparência e as dimensões dos pilotos são parametrizadas. A área de toque dos controles da nova base é de pelo menos 48 pontos.

Para revisar no Expo Go: iniciar o app com EXPO_PUBLIC_APP_ENV=development e API local alcançável, entrar na conta, abrir Perfil e tocar em **Catálogo do design system** no fim da página. A rota /design-system exige sessão autenticada, ambiente development e bundle **DEV**; staging/production e bundles de release não expõem o catálogo. Há bloqueio de rota além de ocultação do botão.

A galeria abre com uma composição de eventos e grupos inspirada no mock, usando exemplos locais identificados. Contém também texto, cores, ações, campos, seletores, switch, checkbox, OTP, linhas, badges, feedback e painel; estados de foco e pressionado são acionados pela interação. Nenhuma demonstração faz chamadas de mutação. Os pilotos reais continuam enviando alterações somente por suas ações explícitas de salvar/excluir, como antes.

Evidência da primeira rodada (06/11): 97 testes mobile, TypeScript, formatação e exports Hermes Android/iOS aprovados. A aparência dessa rodada foi rejeitada. Na revisão de 07/11, os 97 testes mobile, TypeScript, formatação completa de mobile e exports Hermes Android/iOS passaram novamente. A cobertura de contraste inclui texto branco nos gradientes de ação, além dos pares de texto normal (4,5:1), destaque de celebração e limites de campos habilitados (3:1).

Preview local verificado: Metro e manifesto Expo respondem 200, com bundle em 192.168.1.20:8081; API alcançável na porta 3000, retornando 401 ao acesso não autenticado, como esperado. Banco local existente preservado, nove usuários e conta dev@dev.com presentes. Não foi executado seed.

Esses checks não substituem a inspeção de escalonamento, teclado, leitor de tela, safe areas e movimento em aparelho. Não foi executado teste visual automatizado nem declarado aceite de dispositivo.

Próxima etapa depende da aprovação dos pilotos pelo usuário. Não migrar demais telas nem implementar wishlist automaticamente.

## Revisão por extração — 07/11/2026

Substitui visualmente a rodada d3e9d28, também rejeitada. Aprovação visual pendente. Preserva dados, regras, navegação e escopo de pilotos. TypeScript e 97 testes mobile passaram; aprovação visual em dispositivo permanece pendente.

## Ampliação autorizada: Início e navegação

Em 07/11 o usuário solicitou aplicar a composição do recorte à nova tela Início, com dados reais, três aniversários e dois grupos. O menu passa a Início · Eventos · Grupos · Desejos · Perfil; Desejos mostra “Em breve”. A nova direção substitui a restrição de navegação descrita nas rodadas anteriores. O tema legado das demais telas permanece até sua revisão específica. A Home e a barra de abas usam os tokens extraídos. Fotos são representadas por iniciais; não há upload de imagem.

Validação funcional: TypeScript e 101 testes mobile aprovados, incluindo seleção cronológica de aniversários, limite de dois grupos, nomes e destino atualizado de notificações. A aparência ainda depende de comparação no dispositivo.

Verificação final da rodada Início: formatação completa e exports Hermes iOS/Android aprovados. Leitura autenticada das APIs de perfil, agenda e grupos retornou 200 com os formatos esperados; a sessão temporária do teste foi revogada. Expo Go permanece disponível no preview local. Isso não substitui validação visual ou interação em dispositivo.
