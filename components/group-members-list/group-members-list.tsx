import { useState } from 'react';
import { Cake, Clock, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MONTHS } from '@/lib/constants';
import { formatDaysLabel, getBirthdayInfo } from '@/lib/date-utils';
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
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberInfo | null>(
    null,
  );

  const sortedMembers = [...members].sort((a, b) => {
    const { daysUntil: daysA } = getBirthdayInfo(a.birth_day, a.birth_month);
    const { daysUntil: daysB } = getBirthdayInfo(b.birth_day, b.birth_month);
    if (daysA === null && daysB === null) return 0;
    if (daysA === null) return 1;
    if (daysB === null) return -1;
    return daysA - daysB;
  });

  const handleRemove = async () => {
    if (!memberToRemove) return;

    setRemovingId(memberToRemove.id);
    setMemberToRemove(null);

    try {
      await fetch(`/api/v1/groups/${groupId}/members/${memberToRemove.id}`, {
        method: 'DELETE',
      });
      onMemberRemoved();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {sortedMembers.map((member) => {
          const { daysUntil, isNextYear } = getBirthdayInfo(
            member.birth_day,
            member.birth_month,
          );
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted/60 transition-smooth"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
                  <span className="text-sm font-semibold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
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
                      <Badge className="bg-primary/15 text-primary text-[10px] px-1.5 py-0 rounded-full">
                        Criador
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {member.birth_day && member.birth_month && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Cake className="w-3 h-3" />
                        {member.birth_day} de {MONTHS[member.birth_month - 1]}
                        {isNextYear ? (
                          <span className="flex items-center gap-0.5 text-muted-foreground/60">
                            · <Clock className="w-3 h-3" /> Ano que vem
                          </span>
                        ) : (
                          daysUntil !== null && (
                            <span
                              className={`font-medium ${daysUntil === 0 ? 'text-primary' : ''}`}
                            >
                              · {formatDaysLabel(daysUntil)}
                            </span>
                          )
                        )}
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
                  onClick={() => setMemberToRemove(member)}
                  disabled={removingId === member.id}
                  title="Remover membro"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{memberToRemove?.name}</strong> do grupo? Ele perderá o
              acesso aos eventos compartilhados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRemove}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
