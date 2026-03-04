import { useState } from 'react';
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
  name: string;
  type: EventType | '';
  day: string;
  month: string;
}

interface FormErrors {
  name?: string;
  type?: string;
  day?: string;
  month?: string;
}

const INITIAL_FORM: FormState = { name: '', type: '', day: '', month: '' };

export const AddEventModal = ({ open, onOpenChange }: AddEventModalProps) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const daysInMonth = form.month
    ? (DAYS_IN_MONTH[Number(form.month)] ?? 31)
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'Informe o nome.';
    if (!form.type) newErrors.type = 'Selecione o tipo de evento.';
    if (!form.month) newErrors.month = 'Selecione o mês.';
    if (!form.day) newErrors.day = 'Selecione o dia.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // TODO: chamada à API de criação de evento
    setForm(INITIAL_FORM);
    setErrors({});
    onOpenChange(false);
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
            <Label htmlFor="event-name">Evento</Label>
            <Input
              id="event-name"
              placeholder="Ex: Pedro, Aniversário de namoro com Ana"
              value={form.name}
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de evento</Label>
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
        </div>

        <Button
          className="w-full mt-2 cursor-pointer gradient-warm text-white hover:opacity-90 transition-smooth"
          onClick={handleSubmit}
        >
          Adicionar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
