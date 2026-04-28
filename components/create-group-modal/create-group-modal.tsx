import { useState } from 'react';
import { useRouter } from 'next/router';
import { Check, Copy, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  name?: string;
  server?: string;
}

interface CreatedGroup {
  name: string;
  invite_code: string;
}

export const CreateGroupModal = ({
  open,
  onOpenChange,
}: CreateGroupModalProps) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroup | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink =
    createdGroup && typeof window !== 'undefined'
      ? `${window.location.origin}/join-group?code=${createdGroup.invite_code}`
      : '';

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Informe o nome do grupo.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ server: data.message ?? 'Erro ao criar grupo.' });
        return;
      }

      const data = await response.json();
      setCreatedGroup({ name: data.name, invite_code: data.invite_code });
      router.replace(router.asPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName('');
      setErrors({});
      setCreatedGroup(null);
      setCopied(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md violet-context">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {createdGroup ? 'Grupo criado!' : 'Criar grupo'}
          </DialogTitle>
        </DialogHeader>

        {createdGroup ? (
          <div className="flex flex-col gap-4 mt-2 min-w-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet/5 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet/10 text-violet shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm truncate">
                {createdGroup.name}
              </span>
            </div>

            <div className="bg-violet/5 rounded-2xl p-4 overflow-hidden">
              <p className="text-sm font-medium text-violet mb-2">
                Convide pessoas para o grupo
              </p>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 min-w-0 bg-white rounded-xl px-3 py-2 text-sm text-muted-foreground border border-border/50 truncate">
                  {inviteLink}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-violet/30 text-violet hover:bg-violet/10 gap-1.5 shrink-0"
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
                href={`https://wa.me/?text=${encodeURIComponent(`Nunca mais vamos esquecer um aniversário!\n\nEntrei no rememberly e criei o grupo *${createdGroup.name}* pra gente. Cadastra sua data de aniversário e mais ninguém nesse grupo vai esquecer um aniversário!\n\n${inviteLink}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-medium py-2 px-4 rounded-xl transition-smooth"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar no WhatsApp
              </a>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl border-violet/30 text-violet hover:bg-violet/10 hover:text-violet"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="group-name">Nome do grupo</Label>
                <Input
                  id="group-name"
                  placeholder="Ex: Família Silva, Amigos do trabalho"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
            </div>

            {errors.server && (
              <p className="text-sm text-destructive mt-1">{errors.server}</p>
            )}

            <Button
              className="w-full mt-2 cursor-pointer gradient-violet text-white hover:opacity-90 transition-smooth"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar grupo'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
