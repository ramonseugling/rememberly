import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateGroupModal } from '@/components/create-group-modal/create-group-modal';
import { GroupCard } from '@/components/group-card/group-card';
import { GroupDetailModal } from '@/components/group-detail-modal/group-detail-modal';
import { GroupEmptyState } from '@/components/group-empty-state/group-empty-state';
import type { GroupInfo } from '@/lib/types';
import { withAuth } from 'infra/page-guard';
import group from 'models/group';

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
}

export const getServerSideProps: GetServerSideProps = withAuth(
  async (_context, user) => {
    const rawGroups = await group.findAllByUserId(user.id);

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
      }),
    );

    return { props: { user, groups } };
  },
);

export default function Groups({ user, groups }: GroupsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

  return (
    <div>
      <section className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        {groups.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Meus Grupos
            </h2>
            <Button
              className="gradient-groups text-white hover:opacity-90 rounded-2xl gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Criar grupo
            </Button>
          </div>
        )}

        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((g, index) => (
              <div key={g.id} style={{ animationDelay: `${index * 0.1}s` }}>
                <GroupCard
                  name={g.name}
                  role={g.role}
                  memberCount={g.member_count}
                  onClick={() => setSelectedGroup(g)}
                />
              </div>
            ))}
          </div>
        ) : (
          <GroupEmptyState onCreateClick={() => setIsCreateModalOpen(true)} />
        )}
      </section>

      <CreateGroupModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          currentUserId={user.id}
          open={!!selectedGroup}
          onOpenChange={(open) => {
            if (!open) setSelectedGroup(null);
          }}
        />
      )}
    </div>
  );
}
