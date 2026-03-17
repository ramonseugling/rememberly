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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_IN_MONTH, EVENT_TYPES, MONTHS } from '@/lib/constants';
import type { EventType } from '@/lib/types';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  title: string;
  type: EventType | '';
  day: string;
  month: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  day?: string;
  month?: string;
  server?: string;
}

const INITIAL_FORM: FormState = { title: '', type: '', day: '', month: '' };

export const AddEventModal = ({ open, onOpenChange }: AddEventModalProps) => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const daysInMonth = form.month
    ? (DAYS_IN_MONTH[Number(form.month)] ?? 31)
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Informe o título.';
    if (!form.type) newErrors.type = 'Selecione o tipo de evento.';
    if (!form.month) newErrors.month = 'Selecione o mês.';
    if (!form.day) newErrors.day = 'Selecione o dia.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          event_day: Number(form.day),
          event_month: Number(form.month),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ server: data.message ?? 'Erro ao criar evento.' });
        return;
      }

      setForm(INITIAL_FORM);
      setErrors({});
      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Nova data especial
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-name">Título</Label>
            <Input
              id="event-name"
              placeholder="Ex: Pedro, Aniversário de namoro com Ana"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }));
                if (errors.title)
                  setErrors((e) => ({ ...e, title: undefined }));
              }}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de data</Label>
            <Select
              value={form.type}
              onValueChange={(value) => {
                setForm((f) => ({ ...f, type: value as EventType }));
                if (errors.type) setErrors((e) => ({ ...e, type: undefined }));
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Data</Label>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <Select
                  value={form.month}
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, month: value, day: '' }));
                    if (errors.month)
                      setErrors((e) => ({ ...e, month: undefined }));
                  }}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {MONTHS.map((name, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && (
                  <p className="text-xs text-destructive">{errors.month}</p>
                )}
              </div>

              <div className="w-28 flex flex-col gap-1">
                <Select
                  value={form.day}
                  onValueChange={(value) => {
                    setForm((f) => ({ ...f, day: value }));
                    if (errors.day)
                      setErrors((e) => ({ ...e, day: undefined }));
                  }}
                  disabled={!form.month}
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Dia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {days.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.day && (
                  <p className="text-xs text-destructive">{errors.day}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 opacity-60">
            <div className="flex items-center gap-2">
              <Label>Lembrete antecipado</Label>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Em breve
              </span>
            </div>
            <Select disabled>
              <SelectTrigger className="cursor-not-allowed">
                <SelectValue placeholder="1 dia antes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No dia do evento</SelectItem>
                <SelectItem value="1">1 dia antes</SelectItem>
                <SelectItem value="3">3 dias antes</SelectItem>
                <SelectItem value="7">1 semana antes</SelectItem>
                <SelectItem value="15">15 dias antes</SelectItem>
                <SelectItem value="30">30 dias antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {errors.server && (
          <p className="text-sm text-destructive mt-1">{errors.server}</p>
        )}

        <Button
          className="w-full mt-2 cursor-pointer gradient-warm text-white hover:opacity-90 transition-smooth"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Salvando...' : 'Adicionar'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
