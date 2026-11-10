import {
  COMPANY_ADDRESS,
  COMPANY_ID,
  COMPANY_NAME,
  CONTACT_EMAIL,
  GOVERNING_CITY,
  type LegalDocument,
} from '@/lib/legal/shared';

export const termsDocument: LegalDocument = {
  title: 'Termos de Uso',
  description:
    'Termos de Uso do Rememberly, o serviço para guardar datas importantes e receber lembretes.',
  intro:
    'Estes Termos de Uso explicam as regras para usar o Rememberly, no site e no aplicativo. Ao criar uma conta ou usar o serviço, você declara que leu e concorda com eles.',
  sections: [
    {
      id: 'o-servico',
      title: '1. O que é o Rememberly',
      blocks: [
        {
          p: `O Rememberly é um serviço para registrar datas importantes (como aniversários, namoro, casamento e comemorações), receber lembretes por e-mail e notificações push, compartilhar aniversários com amigos e família em grupos e montar listas de presentes. O serviço é oferecido por ${COMPANY_NAME}, ${COMPANY_ID}, com sede em ${COMPANY_ADDRESS} ("Rememberly", "nós").`,
        },
      ],
    },
    {
      id: 'conta',
      title: '2. Conta e cadastro',
      blocks: [
        {
          ul: [
            'O cadastro é aberto e pode ser feito com e-mail (confirmado por um código enviado a você) ou com a sua conta Google.',
            'Você deve informar dados verdadeiros e mantê-los atualizados.',
            'Você é responsável por manter sua senha e seu acesso em segurança e por tudo o que acontece na sua conta. Avise-nos se suspeitar de uso indevido.',
            'A conta é pessoal e não pode ser transferida ou compartilhada.',
            'O serviço não é destinado a menores de 13 anos. Pessoas entre 13 e 17 anos devem usar o serviço com o conhecimento e a autorização de um responsável legal. [A CONFIRMAR COM ADVOGADO]',
          ],
        },
      ],
    },
    {
      id: 'uso-aceitavel',
      title: '3. Uso aceitável',
      blocks: [
        { p: 'Ao usar o Rememberly, você concorda em não:' },
        {
          ul: [
            'cadastrar dados de outras pessoas ou publicar conteúdo que viole direitos ou a lei, inclusive conteúdo ofensivo, discriminatório, ilegal ou que invada a privacidade de alguém;',
            'usar o serviço para enviar spam, fazer assédio ou se passar por outra pessoa;',
            'tentar acessar contas, dados ou áreas do sistema que não sejam seus, ou burlar mecanismos de segurança e limites de uso;',
            'sobrecarregar, copiar de forma automatizada, fazer engenharia reversa ou interferir no funcionamento do serviço;',
            'usar o serviço para fins ilícitos.',
          ],
        },
      ],
    },
    {
      id: 'conteudo',
      title: '4. Seu conteúdo',
      blocks: [
        {
          p: 'Você mantém a titularidade do que cadastra: eventos e datas, nome, aniversário, foto de perfil, fotos de grupos e itens das listas de presentes ("Conteúdo"). Você nos autoriza a armazenar, processar e exibir esse Conteúdo apenas na medida necessária para operar o serviço, inclusive para mostrá-lo a outros integrantes dos seus grupos conforme descrito abaixo e na Política de Privacidade.',
        },
        {
          p: 'Você declara ter o direito de usar as fotos e informações que envia. Podemos remover conteúdo que viole estes Termos ou a lei.',
        },
      ],
    },
    {
      id: 'grupos',
      title: '5. Grupos e convites',
      blocks: [
        {
          ul: [
            'Qualquer usuário pode criar um grupo. Quem cria o grupo é o seu proprietário e recebe um código/link de convite.',
            'Quem tem o código ou link de convite pode entrar no grupo. Compartilhe-o somente com pessoas de confiança; o proprietário pode remover integrantes.',
            'Ao entrar em um grupo, os demais integrantes passam a ver seu nome, foto, data de aniversário (inclusive o ano, se você o informou), e-mail e a sua lista de presentes. Os integrantes também passam a receber lembretes do seu aniversário.',
            'Você pode sair de um grupo a qualquer momento. Ao sair, os integrantes deixam de ver seus dados por meio daquele grupo.',
            'Quem é proprietário de grupos precisa excluí-los antes de excluir a própria conta.',
          ],
        },
      ],
    },
    {
      id: 'listas-de-presentes',
      title: '6. Listas de presentes e reservas',
      blocks: [
        {
          ul: [
            'Cada usuário pode ter uma lista de presentes, com título, link e descrição de cada item.',
            'A lista fica visível para as pessoas que participam de pelo menos um grupo em comum com você.',
            'Outros integrantes podem marcar um item como "reservado" ou "comprado". Essa reserva é secreta: o dono da lista não vê quem reservou nem quem comprou.',
            'Uma reserva marcada como "reservado" é liberada automaticamente se quem reservou deixar de compartilhar um grupo com o dono da lista. Itens "comprados" são mantidos.',
            'Cerca de uma semana após o aniversário do dono da lista, os itens comprados saem da lista e as reservas restantes são limpas, para a lista recomeçar no ano seguinte.',
            'O Rememberly não vende, entrega nem intermedeia a compra dos presentes e não se responsabiliza por links, lojas ou produtos de terceiros indicados nas listas.',
          ],
        },
      ],
    },
    {
      id: 'notificacoes',
      title: '7. Notificações e e-mails',
      blocks: [
        {
          p: 'O serviço envia e-mails (por exemplo, código de confirmação, recuperação de senha e lembretes de datas) e, se você ativar no aplicativo, notificações push. E-mails de novidades e comunicação de marketing só são enviados se você consentir.',
        },
        {
          p: 'Você pode ajustar ou desativar as notificações nas preferências do aplicativo e usar o link de descadastro presente nos e-mails. E-mails essenciais da conta (como código de verificação e recuperação de senha) continuam sendo enviados quando necessários.',
        },
        {
          p: 'Os lembretes dependem de serviços de terceiros (e-mail, notificações do sistema do celular) e, por isso, não garantimos a entrega em um horário específico. Não use o Rememberly como único meio para lembrar de compromissos críticos.',
        },
      ],
    },
    {
      id: 'disponibilidade',
      title: '8. Disponibilidade e ausência de garantias',
      blocks: [
        {
          p: 'O Rememberly é oferecido "como está". Buscamos mantê-lo disponível e funcionando, mas não garantimos que será ininterrupto ou livre de erros, nem que os lembretes serão sempre entregues. Podemos alterar, suspender ou encerrar funcionalidades, inclusive para manutenção. [A REVISAR PELO ADVOGADO]',
        },
      ],
    },
    {
      id: 'responsabilidade',
      title: '9. Limitação de responsabilidade',
      blocks: [
        {
          p: 'Na máxima extensão permitida pela lei, o Rememberly não responde por danos indiretos, lucros cessantes ou perdas decorrentes de lembretes não recebidos ou atrasados, indisponibilidade do serviço, conteúdo publicado por outros usuários ou conduta de terceiros. Nada nestes Termos exclui direitos que a lei, inclusive o Código de Defesa do Consumidor, não permita limitar. [TEXTO A SER REVISADO PELO ADVOGADO]',
        },
      ],
    },
    {
      id: 'encerramento',
      title: '10. Encerramento da conta',
      blocks: [
        {
          p: 'Você pode excluir sua conta quando quiser, pelo aplicativo ou pela página de exclusão de conta. A exclusão remove seus dados pessoais conforme descrito na Política de Privacidade.',
        },
        {
          p: 'Podemos suspender ou encerrar contas que violem estes Termos, coloquem outros usuários em risco ou sejam usadas para fins ilícitos, com aviso quando possível.',
        },
      ],
    },
    {
      id: 'alteracoes',
      title: '11. Alterações destes Termos',
      blocks: [
        {
          p: 'Podemos atualizar estes Termos. Quando a mudança for relevante, avisaremos pelo serviço ou por e-mail. A data da última atualização aparece no topo da página. Continuar usando o serviço depois da mudança significa concordar com a nova versão.',
        },
      ],
    },
    {
      id: 'lei-e-foro',
      title: '12. Lei aplicável e foro',
      blocks: [
        {
          p: `Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro de ${GOVERNING_CITY} para resolver conflitos, ressalvado o direito do consumidor de ajuizar ação no foro do seu domicílio. [A CONFIRMAR COM ADVOGADO]`,
        },
      ],
    },
    {
      id: 'contato',
      title: '13. Contato',
      blocks: [
        {
          p: `Dúvidas sobre estes Termos: ${CONTACT_EMAIL}. Veja também a nossa Política de Privacidade.`,
        },
      ],
    },
  ],
};
