import { useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { CreateGroupModal } from '@/components/create-group-modal/create-group-modal';
import { GroupCard } from '@/components/group-card/group-card';
import { GroupEmptyState } from '@/components/group-empty-state/group-empty-state';
import { CreateGroupCta } from '@/components/groups-page/create-group-cta';
import { GroupsPageHeader } from '@/components/groups-page/groups-page-header';
import { GroupsStats } from '@/components/groups-page/groups-stats';
import { NextGroupDateBanner } from '@/components/groups-page/next-group-date-banner';
import { MONTHS } from '@/lib/constants';
import type { BirthdayMember, GroupInfo } from '@/lib/types';
import { withAuth } from 'infra/page-guard';
import group from 'models/group';
import groupMember from 'models/group-member';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface GroupsProps {
  user: User;
  groups: GroupInfo[];
  membersCount: number;
  upcomingDatesCount: number;
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    const [rawGroups, birthdaysRaw] = await Promise.all([
      group.findAllByUserId(user.id),
      groupMember.findAllBirthdaysByUserId(user.id),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function computeDaysUntil(birth_day: number, birth_month: number): number {
      const nextDate = new Date(
        today.getFullYear(),
        birth_month - 1,
        birth_day,
      );
      if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);
      return Math.round(
        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    const birthdaysByGroup: Record<string, BirthdayMember[]> = {};
    for (const b of birthdaysRaw) {
      const days_until = computeDaysUntil(b.birth_day, b.birth_month);
      if (days_until > 30) continue;
      if (!birthdaysByGroup[b.group_id]) birthdaysByGroup[b.group_id] = [];
      birthdaysByGroup[b.group_id].push({
        name: b.name,
        birth_day: b.birth_day,
        birth_month: b.birth_month,
        days_until,
      });
    }

    for (const groupId of Object.keys(birthdaysByGroup)) {
      birthdaysByGroup[groupId].sort((a, b) => a.days_until - b.days_until);
    }

    const groups: GroupInfo[] = rawGroups.map(
      (g: {
        id: string;
        name: string;
        invite_code: string;
        role: string;
        member_count: number;
        created_at: string;
      }) => ({
        id: g.id,
        name: g.name,
        invite_code: g.invite_code,
        role: g.role as 'owner' | 'member',
        member_count: g.member_count,
        created_at: String(g.created_at),
        upcoming_birthdays: birthdaysByGroup[g.id] ?? [],
      }),
    );

    const membersCount = groups.reduce(
      (sum, g) => sum + Math.max(0, g.member_count - 1),
      0,
    );

    const upcomingDatesCount = Object.values(birthdaysByGroup).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    return { props: { user, groups, membersCount, upcomingDatesCount } };
  },
);

export default function Groups({
  user: _user,
  groups,
  membersCount,
  upcomingDatesCount,
}: GroupsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const nextDate = useMemo(() => {
    let best: {
      groupId: string;
      groupName: string;
      member: BirthdayMember;
    } | null = null;
    for (const g of groups) {
      const first = g.upcoming_birthdays[0];
      if (!first) continue;
      if (!best || first.days_until < best.member.days_until) {
        best = { groupId: g.id, groupName: g.name, member: first };
      }
    }
    return best;
  }, [groups]);

  if (groups.length === 0) {
    return (
      <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <GroupEmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
        <CreateGroupModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <GroupsPageHeader onCreateClick={() => setIsCreateModalOpen(true)} />

      <GroupsStats
        groupsCount={groups.length}
        membersCount={membersCount}
        upcomingDatesCount={upcomingDatesCount}
      />

      {nextDate && (
        <NextGroupDateBanner
          daysUntil={nextDate.member.days_until}
          memberName={nextDate.member.name}
          date={`${nextDate.member.birth_day} de ${MONTHS[nextDate.member.birth_month - 1]}`}
          groupName={nextDate.groupName}
          groupId={nextDate.groupId}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {groups.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </div>

      <CreateGroupCta onClick={() => setIsCreateModalOpen(true)} />

      <CreateGroupModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </section>
  );
}
