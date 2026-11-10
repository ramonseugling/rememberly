import {
  COMPANY_ADDRESS,
  COMPANY_ID,
  COMPANY_NAME,
  CONTACT_EMAIL,
  DPO_NAME,
  type LegalDocument,
} from '@/lib/legal/shared';

export const privacyDocument: LegalDocument = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade do Rememberly: quais dados pessoais coletamos, por quê, com quem compartilhamos e como você exerce seus direitos.',
  intro:
    'Esta Política explica como o Rememberly trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018). Ela vale para o site e para o aplicativo.',
  sections: [
    {
      id: 'controlador',
      title: '1. Quem é o controlador',
      blocks: [
        {
          p: `O controlador dos dados pessoais é ${COMPANY_NAME}, ${COMPANY_ID}, com sede em ${COMPANY_ADDRESS}. Contato para assuntos de privacidade: ${CONTACT_EMAIL}. Encarregado pelo tratamento de dados (DPO): ${DPO_NAME}.`,
        },
      ],
    },
    {
      id: 'dados-coletados',
      title: '2. Quais dados coletamos',
      blocks: [
        { p: 'Dados que você nos fornece:' },
        {
          ul: [
            'Conta: nome, e-mail e, se você criar uma senha, o hash dela (a senha em si não é guardada). Quem entra com o Google pode não ter senha.',
            'Aniversário: dia, mês e, opcionalmente, o ano.',
            'Fotos: foto de perfil e foto de grupos, quando você envia.',
            'Datas e eventos que você cadastra (título, tipo, dia e mês, ano opcional e antecedência do lembrete).',
            'Listas de presentes: título, link e descrição dos itens; e as reservas ("reservado" ou "comprado") que você faz nas listas de outras pessoas.',
            'Grupos: nome do grupo, código de convite, e sua participação (papel de proprietário ou integrante e data de entrada).',
            'Preferências: notificações push, lembretes por e-mail e consentimento para e-mails de novidades (marketing), além de inscrições em datas comemorativas.',
          ],
        },
        { p: 'Dados gerados pelo uso do serviço:' },
        {
          ul: [
            'Sessão: um token de sessão, guardado em cookie no navegador ou de forma segura no aplicativo, com data de criação e validade.',
            'Códigos de verificação (OTP) enviados por e-mail para cadastro e para confirmar a exclusão da conta, e tokens de recuperação de senha.',
            'Notificações push: token de notificação do dispositivo (Expo), plataforma (iOS ou Android) e o histórico de envio e entrega das notificações.',
            'Controle de tentativas de login: contadores de tentativas associados a identificadores derivados (hash) do e-mail e do IP, que expiram em poucos minutos. Não guardamos o e-mail ou o IP puros nesses contadores.',
            'Registros de sistema: erros da aplicação (tipo, mensagem, rota acessada e, quando houver, o identificador do usuário), registros de execução das tarefas diárias e de envio de e-mails, e logs técnicos de operação.',
            'Dados de acesso e uso do site, tratados pelos serviços de hospedagem e de estatísticas descritos na seção 5.',
          ],
        },
        {
          p: 'Se você entrar com o Google, recebemos do Google o seu nome, e-mail e identificador da conta Google. Não temos acesso à sua senha do Google.',
        },
      ],
    },
    {
      id: 'finalidades',
      title: '3. Para que usamos os dados e bases legais',
      blocks: [
        {
          ul: [
            'Criar e manter sua conta, autenticar você, e prestar o serviço (guardar datas, grupos, listas de presentes e enviar lembretes). Base legal: execução de contrato (LGPD, art. 7º, V).',
            'Enviar e-mails e notificações push de lembrete que você pediu. Base legal: execução de contrato; no push, também o seu consentimento ao ativar a permissão.',
            'Enviar e-mails de novidades e marketing. Base legal: consentimento (art. 7º, I), que você pode retirar a qualquer momento.',
            'Segurança, prevenção a fraudes e abuso (limite de tentativas de login, códigos de verificação) e diagnóstico de erros. Base legal: legítimo interesse (art. 7º, IX).',
            'Mostrar seu nome, foto, aniversário e lista de presentes a quem participa de grupos com você. Base legal: execução de contrato e consentimento ao entrar no grupo.',
            'Cumprir obrigações legais e regulatórias e exercer direitos em processos. Base legal: art. 7º, II e VI.',
          ],
        },
        {
          p: 'Não vendemos dados pessoais e não usamos seus dados para publicidade de terceiros. [BASES LEGAIS A CONFIRMAR COM ADVOGADO]',
        },
      ],
    },
    {
      id: 'compartilhamento-em-grupos',
      title: '4. O que outras pessoas veem',
      blocks: [
        {
          p: 'Quando você entra em um grupo, os integrantes desse grupo podem ver:',
        },
        {
          ul: [
            'seu nome e sua foto de perfil;',
            'sua data de aniversário (dia, mês e, se você informou, o ano);',
            'seu e-mail (a lista de integrantes do grupo hoje inclui o e-mail) [A CONFIRMAR: avaliar se o e-mail deve continuar visível];',
            'sua lista de presentes (visível a quem divide ao menos um grupo com você).',
          ],
        },
        {
          p: 'Seus eventos pessoais (datas que você cadastra para si) não são exibidos aos grupos. Integrantes do grupo também recebem lembrete do seu aniversário.',
        },
        {
          p: 'Reservas de presentes são secretas: quem é dono da lista não vê quem reservou ou comprou um item. Internamente, guardamos quem fez cada reserva apenas para que o sistema funcione (por exemplo, para liberar a reserva ou mostrar a você o que você reservou). Se você deixar de dividir um grupo com o dono da lista, suas reservas do tipo "reservado" são liberadas.',
        },
        {
          p: 'Os dados são visíveis ao proprietário e aos integrantes do grupo para quem você escolheu entrar. Cuide de quem recebe seu código ou link de convite.',
        },
      ],
    },
    {
      id: 'operadores',
      title: '5. Com quem compartilhamos (serviços que usamos)',
      blocks: [
        {
          p: 'Usamos prestadores de serviço (operadores) para fazer o Rememberly funcionar. Eles tratam dados apenas para essa finalidade:',
        },
        {
          ul: [
            'Vercel: hospedagem do site e da API, execução das tarefas diárias (cron), armazenamento de fotos (Vercel Blob) e estatísticas de acesso (Vercel Analytics).',
            'Neon: banco de dados PostgreSQL onde ficam os dados da sua conta.',
            'Resend: envio de e-mails (código de verificação, lembretes, recuperação de senha e novidades). Recebe seu e-mail e o conteúdo da mensagem.',
            'Axiom: armazenamento de logs técnicos da aplicação.',
            'Expo (Expo Push Service) e, por meio dele, Apple e Google: entrega de notificações push. Recebem o token do dispositivo e o conteúdo da notificação.',
            'Google: login com a conta Google (Google Sign-In/OAuth).',
          ],
        },
        {
          p: 'Também podemos compartilhar dados quando a lei, uma ordem judicial ou autoridade competente exigir. [LISTA DE OPERADORES A CONFIRMAR PELO RESPONSÁVEL ANTES DE PUBLICAR]',
        },
      ],
    },
    {
      id: 'cookies',
      title: '6. Cookies e tecnologias semelhantes',
      blocks: [
        {
          p: 'Usamos um cookie essencial de sessão, chamado session_token (HttpOnly, validade de até 30 dias), para manter você conectado no site. No aplicativo, o token de sessão fica no armazenamento seguro do dispositivo. Não usamos cookies de publicidade. Usamos o Vercel Analytics para medir o uso do site; segundo a Vercel, ele opera sem cookies de rastreamento. [A CONFIRMAR]',
        },
      ],
    },
    {
      id: 'retencao',
      title: '7. Por quanto tempo guardamos os dados',
      blocks: [
        {
          p: 'Mantemos seus dados enquanto sua conta existir. Dados temporários têm prazo próprio: códigos de verificação valem por poucos minutos, contadores de tentativas de login expiram em cerca de 15 minutos e sessões expiram conforme sua validade (até 30 dias no site). Ainda não definimos um prazo fixo de retenção para os registros de erro e logs de sistema nem para cópias de segurança dos provedores. [DEFINIR PRAZOS]',
        },
      ],
    },
    {
      id: 'exclusao',
      title: '8. Exclusão da conta',
      blocks: [
        {
          p: 'Você pode excluir sua conta pelo aplicativo (confirmando com sua senha ou com um código enviado ao seu e-mail) ou pela página de exclusão de conta. Ao excluir, apagamos:',
        },
        {
          ul: [
            'seu cadastro (nome, e-mail, hash da senha, aniversário e identidades de login social);',
            'seus eventos, sua lista de presentes e suas reservas de presentes;',
            'todas as suas sessões, tokens de recuperação de senha e códigos de verificação;',
            'sua participação em grupos de outras pessoas;',
            'preferências de notificação, dispositivos e histórico de notificações push, inscrições em datas comemorativas e registros de envio de comunicados;',
            'seus registros de erro atribuídos à sua conta;',
            'sua foto de perfil.',
          ],
        },
        {
          p: 'Se você é proprietário de algum grupo, é preciso excluir esses grupos antes de excluir a conta. Grupos de outras pessoas e os dados dos outros integrantes continuam existindo.',
        },
        {
          p: 'Ficam retidos: registros agregados de execução das tarefas automáticas, registros de erro não atribuídos a você e contadores temporários de limite de tentativas (que não guardam e-mail ou IP puros). A exclusão não apaga cópias de segurança, logs retidos pelos provedores citados na seção 5, nem e-mails ou notificações já entregues. Podemos manter dados quando a lei exigir. [PRAZOS DE BACKUP E LOGS A CONFIRMAR]',
        },
      ],
    },
    {
      id: 'direitos',
      title: '9. Seus direitos como titular',
      blocks: [
        {
          p: 'Pela LGPD (art. 18), você pode pedir, a qualquer momento:',
        },
        {
          ul: [
            'confirmação de que tratamos seus dados e acesso a eles;',
            'correção de dados incompletos, inexatos ou desatualizados;',
            'anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;',
            'portabilidade dos dados;',
            'eliminação dos dados tratados com base no consentimento;',
            'informação sobre com quem compartilhamos seus dados;',
            'informação sobre a possibilidade de não consentir e suas consequências;',
            'revogação do consentimento.',
          ],
        },
        {
          p: `Você pode corrigir muitos dados diretamente no perfil e excluir a conta pelo aplicativo. Para os demais pedidos, escreva para ${CONTACT_EMAIL}. Também é possível reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
        },
      ],
    },
    {
      id: 'criancas',
      title: '10. Crianças e adolescentes',
      blocks: [
        {
          p: 'O Rememberly não é destinado a menores de 13 anos e não coletamos intencionalmente dados de crianças. Se soubermos que uma conta pertence a uma criança, ela poderá ser excluída. O uso por adolescentes (13 a 17 anos) deve ocorrer com autorização de um responsável legal, e o tratamento de dados de crianças e adolescentes deve observar o seu melhor interesse (LGPD, art. 14). [A CONFIRMAR COM ADVOGADO: idade mínima e regras de consentimento parental]',
        },
      ],
    },
    {
      id: 'transferencia-internacional',
      title: '11. Transferência internacional de dados',
      blocks: [
        {
          p: 'Alguns prestadores citados (como Vercel, Resend, Axiom, Expo e Google) podem processar dados em servidores fora do Brasil, inclusive nos Estados Unidos. Nesses casos, buscamos prestadores que adotem salvaguardas adequadas, conforme a LGPD (arts. 33 a 36). [LOCALIZAÇÃO DOS SERVIDORES E MECANISMO DE TRANSFERÊNCIA A CONFIRMAR]',
        },
      ],
    },
    {
      id: 'seguranca',
      title: '12. Segurança',
      blocks: [
        {
          p: 'Adotamos medidas técnicas para proteger seus dados: senhas guardadas apenas como hash (bcrypt), conexão criptografada (HTTPS e SSL no banco de dados), cookie de sessão HttpOnly, limite de tentativas de login e códigos de verificação com validade curta. Nenhum sistema é totalmente seguro; em caso de incidente relevante, comunicaremos você e a ANPD conforme a lei. As fotos enviadas ficam em endereços públicos difíceis de adivinhar, mas acessíveis a quem tiver o link. [A REVISAR]',
        },
      ],
    },
    {
      id: 'alteracoes',
      title: '13. Alterações desta Política',
      blocks: [
        {
          p: 'Podemos atualizar esta Política. Quando a mudança for relevante, avisaremos pelo serviço ou por e-mail. A data da última atualização aparece no topo da página.',
        },
      ],
    },
    {
      id: 'contato',
      title: '14. Contato',
      blocks: [
        {
          p: `Para exercer direitos ou tirar dúvidas sobre privacidade, escreva para ${CONTACT_EMAIL}. Veja também os nossos Termos de Uso.`,
        },
      ],
    },
  ],
};
