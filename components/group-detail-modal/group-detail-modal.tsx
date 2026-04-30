import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Check,
  Copy,
  LogOut,
  MessageCircle,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { GroupMembersList } from '@/components/group-members-list/group-members-list';
import type { GroupMemberInfo } from '@/lib/types';

interface GroupData {
  id: string;
  name: string;
  role: 'owner' | 'member';
  invite_code: string;
  member_count: number;
}

interface GroupDetailModalProps {
  group: GroupData;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'members' | 'settings';

export const GroupDetailModal = ({
  group,
  currentUserId,
  open,
  onOpenChange,
}: GroupDetailModalProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [members, setMembers] = useState<GroupMemberInfo[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [copied, setCopied] = useState(false);

  // Rename state
  const [newName, setNewName] = useState(group.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Delete/Leave state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwner = group.role === 'owner';
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join-group?code=${group.invite_code}`
      : '';

  useEffect(() => {
    if (open) {
      fetchMembers();
      setActiveTab('members');
      setNewName(group.name);
      setConfirmDelete(false);
    }
  }, [open, group.id]);

  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/v1/groups/${group.id}/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      setRenameError('Informe o nome do grupo.');
      return;
    }

    setIsRenaming(true);
    setRenameError('');

    try {
      const res = await fetch(`/api/v1/groups/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRenameError(data.message ?? 'Erro ao renomear.');
        return;
      }

      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/v1/groups/${group.id}`, { method: 'DELETE' });
      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await fetch(`/api/v1/groups/${group.id}/members/${currentUserId}`, {
        method: 'DELETE',
      });
      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsLeaving(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    {
      id: 'members',
      label: `Membros (${members.length || group.member_count})`,
    },
    ...(isOwner ? [{ id: 'settings' as Tab, label: 'Configurações' }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl sm:max-h-[85vh] sm:overflow-y-auto violet-context">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-violet" />
            {group.name}
          </DialogTitle>
        </DialogHeader>

        {/* Invite section */}
        <div className="bg-violet/5 rounded-2xl p-4 mt-2">
          <p className="text-sm font-medium text-violet mb-2">
            Convide pessoas para o grupo
          </p>
          <div className="flex gap-2 mb-3">
            <div className="hidden sm:flex flex-1 min-w-0 bg-white rounded-xl px-3 py-2 text-sm text-muted-foreground border border-border/50 truncate">
              {inviteLink}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto rounded-xl border-violet/30 text-violet hover:bg-violet/10 gap-1.5 shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copiar link
            </Button>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Nunca mais vamos esquecer um aniversário!\n\nEntrei no Rememberly e criei o grupo *${group.name}* pra gente. Cadastra sua data de aniversário e mais ninguém nesse grupo vai esquecer um aniversário!\n\n${inviteLink}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-medium py-2 px-4 rounded-xl transition-smooth"
          >
            <MessageCircle className="w-4 h-4" />
            Compartilhar no WhatsApp
          </a>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 border-b border-border/50 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-smooth ${
                  activeTab === tab.id
                    ? 'text-violet border-b-2 border-violet bg-violet/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className="bg-violet/5 rounded-2xl p-4">
          {activeTab === 'members' && (
            <div>
              {isLoadingMembers ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Carregando membros...
                </p>
              ) : (
                <GroupMembersList
                  groupId={group.id}
                  members={members}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  onMemberRemoved={fetchMembers}
                />
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwner && (
            <div className="flex flex-col gap-6">
              {/* Rename */}
              <div>
                <p className="text-sm font-medium mb-2">Nome do grupo</p>
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (renameError) setRenameError('');
                    }}
                    maxLength={100}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    className="gradient-violet text-white hover:opacity-90 rounded-xl"
                    onClick={handleRename}
                    disabled={isRenaming || newName.trim() === group.name}
                  >
                    {isRenaming ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
                {renameError && (
                  <p className="text-xs text-destructive mt-1">{renameError}</p>
                )}
              </div>

              {/* Delete */}
              <div className="border-t border-violet/20 pt-4">
                <p className="text-sm font-medium text-destructive mb-2">
                  Zona de perigo
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Deletar o grupo remove todos os membros permanentemente.
                </p>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl gap-1.5"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {confirmDelete
                    ? isDeleting
                      ? 'Deletando...'
                      : 'Confirmar exclusão'
                    : 'Deletar grupo'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Leave button for non-owners */}
        {!isOwner && (
          <div className="bg-violet/5 rounded-2xl p-4">
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 rounded-xl gap-1.5"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              <LogOut className="w-4 h-4" />
              {isLeaving ? 'Saindo...' : 'Sair do grupo'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
