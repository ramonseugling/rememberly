# Design system mobile — minimalista acolhedor

Atualizado em 07/11/2026. Estado: primeira proposta visual rejeitada pelo usuário; revisão baseada no mock abaixo implementada para nova validação.

## Referência visual

O [mock fornecido pelo usuário](references/rememberly-visual-reference.png) orienta esta revisão: fundo rosado quase branco, texto escuro com fonte nativa, títulos compactos, listas densas, superfícies discretas, destaques em rosa e botões em gradiente rosa. Esta direção substitui os tokens e a tipografia da primeira proposta, registrada no commit f68fd2a.

As telas de desejos e reservas do mock são referências visuais para componentes futuros. Sua presença na imagem não autoriza a implementação da wishlist, fotos, notificações novas ou mudanças de navegação nesta rodada.

## Escopo e adoção

Base v2 isolada em mobile/src/design-system/. Pilotos reais: Datas e Perfil. Não alterar o tema legado global, o web, APIs, navegação ou regras de negócio. Após aprovação dos pilotos, aplicar a Grupos, Especiais e autenticação em DS-005. Wishlist permanece bloqueada; ver ../product/BACKLOG.md.

Usar fonte nativa: System no iOS e sans-serif no Android, com pesos explícitos 400, 600 e 700. A escolha anterior de Quicksand nos pilotos foi substituída para aproximar a composição do mock. Sem novas fontes ou dependências. Fredoka e Quicksand continuam nas telas legadas até a migração aprovada.

## Tokens

| Papel                 | Valor             | Uso                                                     |
| --------------------- | ----------------- | ------------------------------------------------------- |
| background            | #FDF7FB           | Fundo rosado discreto                                   |
| surface               | #FFFCFE           | Cards e painéis                                         |
| surfaceMuted          | #FAEAF3           | Agrupamentos e desabilitados                            |
| text                  | #210D1A           | Conteúdo principal                                      |
| textMuted             | #6D5164           | Conteúdo secundário                                     |
| primary               | #B91F5A           | Ação textual, ícones e foco                             |
| primaryPressed        | #A31A50           | Ação pressionada                                        |
| onPrimary             | #FFFFFF           | Texto sobre ação primária                               |
| border                | #EEDDE8           | Separação de superfícies, não indicador único de campos |
| controlBorder         | #A28698           | Limites de campos e seletores                           |
| outlineBorder         | #F4B6CE           | Contorno decorativo de botões com rótulo explícito      |
| iconSurface           | #FBE1ED           | Fundo de ícones e badges em destaque                    |
| danger                | #B42335           | Erros e ações destrutivas                               |
| success               | #245B34           | Confirmações                                            |
| successSurface        | #EAF5E8           | Fundo de confirmação                                    |
| dangerSurface         | #FDECF0           | Fundo de erro ou ação destrutiva                        |
| accent                | #F0894D           | Detalhes decorativos de celebração                      |
| actionGradient        | #D52B6E → #D92F79 | Ação principal com texto branco                         |
| actionPressedGradient | #BF1F5C → #BD2064 | Ação principal pressionada                              |
| celebration           | #FFE5E9 → #FBE6F3 | Destaque de hoje com texto escuro                       |
| backgroundGradient    | #FFF9FC → #FDF3F9 | Fundo suave da composição do catálogo                   |

Ação primária em gradiente rosa, formato de cápsula; secundária em contorno rosa sobre superfície suave; ação textual sem superfície; destrutiva com texto de erro sobre fundo suave. Não aplicar texto branco ao laranja claro. Gradientes de celebração ficam restritos ao destaque de hoje. Os tons dos botões foram escurecidos em relação à imagem para manter contraste de texto branco de pelo menos 4,5:1.

Tipografia: título 22/28 com peso 700, seção 16/22 com peso 700, corpo 14/20 com peso 400, rótulo 14/20 com peso 600 e legenda 12/17 com peso 400 (tamanho/altura em pontos). Respeitar escala de fonte do sistema, sem truncar instruções e erros essenciais.

Espaçamentos: 4, 8, 12, 16, 20, 24, 32, 40. Margem lateral 16; padding de card 16; gap de campo 6–8. Raios: controle 12, linha 16, card 18, painel 28, botão cápsula. Área interativa mínima de 48 × 48 para ações independentes; listas e formulários adaptam à fonte grande. Ícones Lucide existentes, 18–24, traço consistente. Bordas discretas; sombra de card: 0 2px 6px rgba(108, 39, 77, 0.06). Linhas comuns não recebem sombra.

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
