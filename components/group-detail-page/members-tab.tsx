import { useState } from 'react';
import { useRouter } from 'next/router';
import { GroupMembersList } from '@/components/group-members-list/group-members-list';
import type { GroupMemberInfo } from '@/lib/types';

interface MembersTabProps {
  groupId: string;
  initialMembers: GroupMemberInfo[];
  currentUserId: string;
  isOwner: boolean;
}

export const MembersTab = ({
  groupId,
  initialMembers,
  currentUserId,
  isOwner,
}: MembersTabProps) => {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);

  const refresh = async () => {
    try {
      const res = await fetch(`/api/v1/groups/${groupId}/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch {
      router.replace(router.asPath);
    }
  };

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 animate-fade-in">
      <h3 className="font-heading font-semibold text-base text-foreground mb-4">
        Membros do grupo ({members.length})
      </h3>
      <GroupMembersList
        groupId={groupId}
        members={members}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onMemberRemoved={refresh}
      />
    </div>
  );
};
