import { useState } from 'react';
import { useRouter } from 'next/router';
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

export const CreateGroupModal = ({
  open,
  onOpenChange,
}: CreateGroupModalProps) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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

      setName('');
      setErrors({});
      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setName('');
      setErrors({});
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md groups-context">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Criar grupo
          </DialogTitle>
        </DialogHeader>

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
          className="w-full mt-2 cursor-pointer gradient-groups text-white hover:opacity-90 transition-smooth"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Criando...' : 'Criar grupo'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
