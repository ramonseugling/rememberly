import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import {
  Bell,
  Cake,
  Calendar,
  Chrome,
  Layers,
  Mail,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { withAdmin } from 'infra/page-guard';
import type { AdminStats } from 'models/admin';
import admin from 'models/admin';

const AdminCharts = dynamic(
  () => import('@/components/admin-charts/admin-charts'),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  },
);

interface AdminProps {
  stats: AdminStats;
}

export const getServerSideProps: GetServerSideProps = withAdmin(
  async (_context, _user) => {
    const stats = await admin.getStats();
    return { props: { stats } };
  },
);

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

const MetricCard = ({
  title,
  value,
  subtitle,
  description,
  icon,
  highlight,
}: MetricCardProps) => (
  <Card className={highlight ? 'border-destructive/50 bg-destructive/5' : ''}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <span className="text-muted-foreground">{icon}</span>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold font-heading">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed">
        {description}
      </p>
    </CardContent>
  </Card>
);

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: '🎂 Aniversário',
  dating_anniversary: '💕 Namoro',
  wedding_anniversary: '💍 Casamento',
  celebration: '🎉 Celebração',
  custom: '✨ Personalizado',
};

export default function AdminPage({ stats }: AdminProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-foreground">
          Dashboard Admin
        </h1>
        <p className="text-muted-foreground mt-1">Visão geral da plataforma</p>
      </div>

      {/* Overview cards */}
      <section className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-4">Usuários</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de usuários"
            value={stats.totalUsers}
            description="Todos os usuários cadastrados na plataforma, independente de estarem ativos ou não."
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            title="Ativos (últimos 30d)"
            value={stats.activeUsers30d}
            subtitle={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers30d / stats.totalUsers) * 100) : 0}% do total`}
            description="Usuários que fizeram login ao menos uma vez nos últimos 30 dias."
            icon={<UserCheck className="w-4 h-4" />}
          />
          <MetricCard
            title="Novos (última semana)"
            value={stats.newUsers7d}
            description="Contas criadas nos últimos 7 dias. Bom indicador de tração recente."
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="Novos (último mês)"
            value={stats.newUsers30d}
            description="Contas criadas nos últimos 30 dias. Útil para comparar com períodos anteriores."
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="Cadastrados via Google"
            value={`${stats.usersViaGooglePercent}%`}
            description="Proporção de usuários que entraram pelo OAuth do Google (sem senha cadastrada)."
            icon={<Chrome className="w-4 h-4" />}
          />
          <MetricCard
            title="Com aniversário cadastrado"
            value={`${stats.usersWithBirthdayPercent}%`}
            description="Usuários que informaram sua própria data de nascimento. Necessário para aparecer no dashboard de grupos."
            icon={<Cake className="w-4 h-4" />}
          />
          <MetricCard
            title="Sem nenhum evento"
            value={stats.usersWithNoEvents}
            subtitle={`${stats.usersWithNoEventsPercent}% do total`}
            description="Usuários que nunca cadastraram um evento. Alto % indica problema de onboarding ou abandono precoce."
            icon={<UserX className="w-4 h-4" />}
            highlight={stats.usersWithNoEventsPercent > 30}
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-4">
          Engajamento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de eventos"
            value={stats.totalEvents}
            description="Soma de todos os eventos cadastrados na plataforma por todos os usuários."
            icon={<Calendar className="w-4 h-4" />}
          />
          <MetricCard
            title="Média de eventos/usuário"
            value={stats.avgEventsPerUser}
            description="Quantos eventos cada usuário tem em média. Indica o nível de adoção da funcionalidade principal."
            icon={<Calendar className="w-4 h-4" />}
          />
          <MetricCard
            title="Média de grupos/usuário"
            value={stats.avgGroupsPerUser}
            description="Quantos grupos cada usuário participa em média. Indica uso da funcionalidade social."
            icon={<Layers className="w-4 h-4" />}
          />
          <MetricCard
            title="Média de e-mails anuais/usuário"
            value={stats.avgAnnualEmailsPerUser}
            subtitle="eventos + lembretes configurados"
            description="Estimativa de quantos e-mails cada usuário recebe por ano: 1 por evento no dia + 1 extra por lembrete prévio configurado."
            icon={<Mail className="w-4 h-4" />}
          />
          <MetricCard
            title="Média de eventos c/ lembrete prévio"
            value={stats.avgEventsWithReminderPerUser}
            subtitle="por usuário"
            description="Quantos eventos por usuário têm notificação antecipada ativa. Indica quem usa o recurso de lembretes."
            icon={<Bell className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="mb-8">
        <h2 className="font-heading text-lg text-foreground mb-4">
          Tendências
        </h2>
        <AdminCharts
          weeklySignups={stats.weeklySignups}
          weeklyEventsCreated={stats.weeklyEventsCreated}
          eventTypeBreakdown={stats.eventTypeBreakdown.map((r) => ({
            ...r,
            label: EVENT_TYPE_LABELS[r.type] ?? r.type,
          }))}
        />
      </section>
    </div>
  );
}
