import { useState } from 'react';
import { useRouter } from 'next/router';
import { LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ConfigurationsTabProps {
  groupId: string;
  groupName: string;
  isOwner: boolean;
  currentUserId: string;
}

export const ConfigurationsTab = ({
  groupId,
  groupName,
  isOwner,
  currentUserId,
}: ConfigurationsTabProps) => {
  const router = useRouter();

  const [newName, setNewName] = useState(groupName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) {
      setRenameError('Informe o nome do grupo.');
      return;
    }

    setIsRenaming(true);
    setRenameError('');

    try {
      const res = await fetch(`/api/v1/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setRenameError(data.message ?? 'Erro ao renomear.');
        return;
      }

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
      await fetch(`/api/v1/groups/${groupId}`, { method: 'DELETE' });
      router.replace('/groups');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await fetch(`/api/v1/groups/${groupId}/members/${currentUserId}`, {
        method: 'DELETE',
      });
      router.replace('/groups');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 flex flex-col gap-6 animate-fade-in">
      {isOwner ? (
        <>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">
              Nome do grupo
            </p>
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
                onClick={handleRename}
                disabled={isRenaming || newName.trim() === groupName}
              >
                {isRenaming ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            {renameError && (
              <p className="text-xs text-destructive mt-1">{renameError}</p>
            )}
          </div>

          <div className="border-t border-border/40 pt-6">
            <p className="text-sm font-semibold text-destructive mb-2">
              Zona de perigo
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Deletar o grupo remove todos os membros permanentemente.
            </p>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl gap-1.5"
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
        </>
      ) : (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">
            Sair do grupo
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Você perde acesso aos aniversários compartilhados pelo grupo.
          </p>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10 rounded-2xl gap-1.5"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            <LogOut className="w-4 h-4" />
            {isLeaving ? 'Saindo...' : 'Sair do grupo'}
          </Button>
        </div>
      )}
    </div>
  );
};
