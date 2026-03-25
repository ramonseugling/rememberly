import { useState } from 'react';
import { Cake, Crown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MONTHS } from '@/lib/constants';
import type { GroupMemberInfo } from '@/lib/types';

interface GroupMembersListProps {
  groupId: string;
  members: GroupMemberInfo[];
  currentUserId: string;
  isOwner: boolean;
  onMemberRemoved: () => void;
}

export const GroupMembersList = ({
  groupId,
  members,
  currentUserId,
  isOwner,
  onMemberRemoved,
}: GroupMembersListProps) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (userId: string) => {
    setRemovingId(userId);

    try {
      await fetch(`/api/v1/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });
      onMemberRemoved();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-smooth"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/10 text-violet-600 shrink-0">
              {member.role === 'owner' ? (
                <Crown className="w-4 h-4" />
              ) : (
                <span className="text-sm font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground truncate">
                  {member.name}
                  {member.id === currentUserId && (
                    <span className="text-muted-foreground"> (você)</span>
                  )}
                </span>
                {member.role === 'owner' && (
                  <Badge className="gradient-groups text-white text-[10px] px-1.5 py-0 rounded-full">
                    Criador
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="truncate">{member.email}</span>
                {member.birth_day && member.birth_month && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Cake className="w-3 h-3" />
                    {member.birth_day} de {MONTHS[member.birth_month - 1]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isOwner && member.id !== currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => handleRemove(member.id)}
              disabled={removingId === member.id}
              title="Remover membro"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
