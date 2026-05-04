import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ConfigurationsTab } from '@/components/group-detail-page/configurations-tab';
import { DatesTab } from '@/components/group-detail-page/dates-tab';
import { GroupHeader } from '@/components/group-detail-page/group-header';
import {
  type GroupTab,
  GroupTabs,
} from '@/components/group-detail-page/group-tabs';
import { MembersTab } from '@/components/group-detail-page/members-tab';
import type { GroupMemberInfo, GroupRole } from '@/lib/types';
import { withAuth } from 'infra/page-guard';
import groupModel from 'models/group';
import groupMemberModel from 'models/group-member';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface GroupSummary {
  id: string;
  name: string;
  invite_code: string;
  role: GroupRole;
  member_count: number;
  created_at: string;
}

interface GroupDetailProps {
  user: User;
  group: GroupSummary;
  members: GroupMemberInfo[];
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (ctx, user) => {
    const id = String(ctx.query.id);

    const membership = await groupMemberModel.findMembership(id, user.id);
    if (!membership) return { notFound: true };

    const [groupData, members] = await Promise.all([
      groupModel.findById(id),
      groupMemberModel.findAllByGroupId(id),
    ]);

    return {
      props: {
        user,
        group: {
          id: groupData.id,
          name: groupData.name,
          invite_code: groupData.invite_code,
          role: membership.role as GroupRole,
          member_count: members.length,
          created_at: String(groupData.created_at),
        },
        members: members.map(
          (m: {
            id: string;
            name: string;
            email: string;
            birth_day: number | null;
            birth_month: number | null;
            birth_year: number | null;
            role: string;
            joined_at: string | Date;
          }) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            birth_day: m.birth_day,
            birth_month: m.birth_month,
            birth_year: m.birth_year,
            role: m.role as GroupRole,
            joined_at: String(m.joined_at),
          }),
        ),
      },
    };
  },
);

export default function GroupDetailPage({
  user,
  group,
  members,
}: GroupDetailProps) {
  const [activeTab, setActiveTab] = useState<GroupTab>('dates');

  const isOwner = group.role === 'owner';
  const creator = members.find((m) => m.role === 'owner');
  const creatorName = creator && creator.id !== user.id ? creator.name : null;

  return (
    <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para grupos
      </Link>

      <GroupHeader
        group={group}
        creatorName={creatorName}
        isOwner={isOwner}
        onConfigClick={() => setActiveTab('configurations')}
      />

      <GroupTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === 'dates' && (
        <DatesTab members={members} currentUserId={user.id} />
      )}

      {activeTab === 'members' && (
        <MembersTab
          groupId={group.id}
          initialMembers={members}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      )}

      {activeTab === 'configurations' && (
        <ConfigurationsTab
          groupId={group.id}
          groupName={group.name}
          isOwner={isOwner}
          currentUserId={user.id}
        />
      )}
    </section>
  );
}
