# Design system mobile — minimalista acolhedor

Data: 06/11/2026. Estado: especificação inicial aprovada para implementação; aparência dos pilotos ainda depende de validação do usuário.

## Escopo e adoção

Base v2 isolada em mobile/src/design-system/. Pilotos reais: Datas e Perfil. Não alterar o tema legado global, o web, APIs, navegação ou regras de negócio. Após aprovação dos pilotos, aplicar a Grupos, Especiais e autenticação em DS-005. Wishlist permanece bloqueada; ver ../product/BACKLOG.md.

Reutilizar Quicksand já instalada: 500 para corpo e 700 para títulos/ênfase. Sem novas fontes ou dependências. Fredoka continua nas telas legadas até a migração aprovada.

## Tokens

| Papel          | Valor             | Uso                                                     |
| -------------- | ----------------- | ------------------------------------------------------- |
| background     | #FCF8FA           | Fundo quente discreto                                   |
| surface        | #FFFFFF           | Cards e painéis                                         |
| surfaceMuted   | #F6EEF2           | Ícones, agrupamentos e desabilitados                    |
| text           | #2B2026           | Conteúdo principal                                      |
| textMuted      | #6F636B           | Conteúdo secundário                                     |
| primary        | #BF2E5B           | Ação primária e foco                                    |
| primaryPressed | #A4224D           | Ação primária pressionada                               |
| onPrimary      | #FFFFFF           | Texto sobre ação primária                               |
| border         | #E8DDE2           | Separação de superfícies, não indicador único de campos |
| controlBorder  | #9C8791           | Limites de campos e seletores                           |
| danger         | #B42335           | Erros e ações destrutivas                               |
| success        | #176744           | Confirmações                                            |
| accent         | #F08B51           | Detalhes decorativos de celebração                      |
| celebration    | #F6BDD0 → #FAD9C3 | Destaque ocasional com texto escuro                     |

Não aplicar texto branco ao laranja claro. Ação primária sólida, secundária em contorno e ação textual sem superfície. Gradiente reservado ao destaque de datas próximas e demonstração no catálogo, não a todo botão/card.

Tipografia: título 26/34, seção 18/26, corpo 15/22, rótulo 14/20 e legenda 12/18 (tamanho/altura em pontos). Respeitar escala de fonte do sistema, sem truncar instruções e erros essenciais.

Espaçamentos: 4, 8, 12, 16, 20, 24, 32, 40. Margem lateral 16; padding de card 20; gap de campo 6–8. Raios: controle 14, linha 16, card 20, painel 28. Área interativa mínima de 48 × 48 para ações independentes; listas e formulários adaptam à fonte grande. Ícones Lucide existentes, 18–22, traço consistente. Bordas discretas, sem sombra por padrão; sombra suave só em superfícies elevadas.

## Componentes e estados

Texto semântico; botão primário/secundário/destrutivo/textual; campo com rótulo, dica e erro; seletor em painel; card; linha de lista; badge; switch; checkbox; OTP de seis dígitos; feedback; painel inferior.

Cada controle trata foco, pressionado, desabilitado e carregamento quando aplicável. Erro e sucesso usam texto/ícone além de cor. Spinner e mensagens precisam de rótulos acessíveis. Valores de checkbox/switch no catálogo são locais; não representam preferências reais da conta.

Painel: backdrop estacionário com opacidade independente, translação só no conteúdo, comportamento pendente preservado e respeito a redução de movimento. Reutilizar a implementação existente com parametrização visual, sem duplicar o fluxo de modal.

## Catálogo e pilotos

Catálogo acessível somente em ambiente development por entrada de desenvolvimento no Perfil. Usar também bloqueio de rota, não apenas esconder o link. Exemplos explicitamente identificados como demonstração; sem acesso ao cliente de dados para mutações.

Datas: hierarquia compacta, cards/linhas com distinção de origem, manutenção de seções, expansão, CRUD e exclusão no editor. Perfil: identificação, formulário, seletores, salvar, sair, exclusão e opções adicionais existentes. Nenhuma preferência nova, foto ou recurso simulado.

## Critérios de validação

Verificar contraste, áreas de toque, texto ampliado, rótulos, erro/sucesso, teclado, safe areas e redução de movimento. Executar tipos, formatação, testes pertinentes e exports Hermes iOS/Android. Testes de contraste e disponibilidade do catálogo cobrem comportamentos novos; não criar testes que apenas espelham estilos.

Registrar testes e limites reais após implementação. Aprovação visual dos pilotos: pendente. Build assinado, provider Google, push e associação HTTPS permanecem fora da aceitação visual no Expo Go.

## Implementação e acesso ao catálogo

A base e os pilotos de Datas e Perfil estão implementados e aguardam aprovação visual. Componentes antigos continuam usando sua aparência original quando o parâmetro opcional appearance não é fornecido. Seletores, OTP e painel compartilham o comportamento existente; apenas a aparência e as dimensões dos pilotos são parametrizadas. A área de toque dos controles da nova base é de pelo menos 48 pontos.

Para revisar no Expo Go: iniciar o app com EXPO_PUBLIC_APP_ENV=development e API local alcançável, entrar na conta, abrir Perfil e tocar em **Catálogo do design system** no fim da página. A rota /design-system exige sessão autenticada, ambiente development e bundle **DEV**; staging/production e bundles de release não expõem o catálogo. Há bloqueio de rota além de ocultação do botão.

A galeria contém texto, cores, ações, campos, seletores, switch, checkbox, OTP, linhas, badges, feedback e painel; estados de foco e pressionado são acionados pela interação. Nenhuma demonstração faz chamadas de mutação. Os pilotos reais continuam enviando alterações somente por suas ações explícitas de salvar/excluir, como antes.

Evidência local: 97 testes mobile, TypeScript, formatação focada e exports Hermes Android/iOS aprovados. Contraste validado para texto normal (4,5:1), texto sobre o gradiente de celebração e limites de campos habilitados (3:1). Isso não substitui a inspeção de escalonamento, teclado, leitor de tela, safe areas e movimento em aparelho. Não foi executado teste visual automatizado nem declarado aceite de dispositivo.

Próxima etapa depende da aprovação dos pilotos pelo usuário. Não migrar demais telas nem implementar wishlist automaticamente.
