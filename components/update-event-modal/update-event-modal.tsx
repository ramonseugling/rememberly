import { useEffect, useState } from 'react';
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
import {
  DAYS_IN_MONTH,
  EVENT_TYPES,
  MONTHS,
  REMINDER_OPTIONS,
} from '@/lib/constants';
import type { EventType } from '@/lib/types';

interface EventData {
  id: string;
  title: string;
  type: EventType;
  custom_type?: string | null;
  event_day: number;
  event_month: number;
  reminder_days_before: number;
}

interface UpdateEventModalProps {
  event: EventData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  title: string;
  type: EventType | '';
  customType: string;
  day: string;
  month: string;
  reminderDaysBefore: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  customType?: string;
  day?: string;
  month?: string;
  server?: string;
}

function eventToForm(e: EventData): FormState {
  return {
    title: e.title,
    type: e.type,
    customType: e.custom_type ?? '',
    day: String(e.event_day),
    month: String(e.event_month),
    reminderDaysBefore: String(e.reminder_days_before ?? 0),
  };
}

export const UpdateEventModal = ({
  event,
  open,
  onOpenChange,
}: UpdateEventModalProps) => {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => eventToForm(event));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(eventToForm(event));
      setErrors({});
    }
  }, [open, event]);

  const initialForm = eventToForm(event);
  const isDirty =
    form.title !== initialForm.title ||
    form.type !== initialForm.type ||
    form.customType !== initialForm.customType ||
    form.day !== initialForm.day ||
    form.month !== initialForm.month ||
    form.reminderDaysBefore !== initialForm.reminderDaysBefore;

  const daysInMonth = form.month
    ? (DAYS_IN_MONTH[Number(form.month)] ?? 31)
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.title.trim()) newErrors.title = 'Informe o título.';
    if (!form.type) newErrors.type = 'Selecione o tipo de evento.';
    if (form.type === 'custom' && !form.customType.trim())
      newErrors.customType = 'Informe o tipo personalizado.';
    if (!form.month) newErrors.month = 'Selecione o mês.';
    if (!form.day) newErrors.day = 'Selecione o dia.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsLoadingSave(true);
    setErrors({});

    try {
      const response = await fetch(`/api/v1/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          type: form.type,
          custom_type:
            form.type === 'custom' ? form.customType.trim() : undefined,
          event_day: Number(form.day),
          event_month: Number(form.month),
          reminder_days_before: Number(form.reminderDaysBefore),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ server: data.message ?? 'Erro ao atualizar evento.' });
        return;
      }

      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const handleDelete = async () => {
    setIsLoadingDelete(true);

    try {
      await fetch(`/api/v1/events/${event.id}`, { method: 'DELETE' });
      onOpenChange(false);
      router.replace(router.asPath);
    } finally {
      setIsLoadingDelete(false);
    }
  };

  const isSubmitting = isLoadingSave || isLoadingDelete;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Editar data especial
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="update-event-name">Título</Label>
            <Input
              id="update-event-name"
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
                setForm((f) => ({
                  ...f,
                  type: value as EventType,
                  customType: value !== 'custom' ? '' : f.customType,
                }));
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
            {form.type === 'custom' && (
              <div className="flex flex-col gap-1 mt-2">
                <Input
                  placeholder="Ex: Formatura, Dia dos melhores amigos"
                  value={form.customType}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, customType: e.target.value }));
                    if (errors.customType)
                      setErrors((e) => ({ ...e, customType: undefined }));
                  }}
                  maxLength={100}
                />
                {errors.customType && (
                  <p className="text-xs text-destructive">
                    {errors.customType}
                  </p>
                )}
              </div>
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

          <div className="flex flex-col gap-1.5">
            <Label>Notificação antecipada</Label>
            <Select
              value={form.reminderDaysBefore}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, reminderDaysBefore: value }))
              }
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {errors.server && (
          <p className="text-sm text-destructive mt-1">{errors.server}</p>
        )}

        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer border-destructive text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isLoadingDelete ? 'Excluindo...' : 'Excluir'}
          </Button>
          <Button
            className="flex-1 cursor-pointer gradient-warm text-white hover:opacity-90 transition-smooth disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!isDirty || isSubmitting}
          >
            {isLoadingSave ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
