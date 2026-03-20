import { useState } from 'react';
import { useRouter } from 'next/router';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import {
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_IN_MONTH, MONTHS } from '@/lib/constants';

interface BirthdayModalProps {
  open: boolean;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export const BirthdayModal = ({ open }: BirthdayModalProps) => {
  const router = useRouter();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const daysInMonth = month ? (DAYS_IN_MONTH[Number(month)] ?? 31) : 31;

  const handleDayChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    const num = Number(value);
    if (value !== '' && (num < 1 || num > daysInMonth)) return;
    setDay(value.slice(0, 2));
  };

  const handleSubmit = async () => {
    if (!day || !month || !year) {
      setError('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_day: Number(day),
          birth_month: Number(month),
          birth_year: Number(year),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Erro ao salvar data de nascimento.');
        return;
      }

      router.replace(router.asPath);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Qual é a sua data de nascimento?
            </DialogTitle>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              Precisamos dessa informação para celebrar seu aniversário! 🎂
            </DialogPrimitive.Description>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-3">
              <div className="w-20">
                <input
                  type="text"
                  inputMode="numeric"
                  value={day}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background transition-smooth text-center"
                  placeholder="Dia"
                />
              </div>
              <div className="flex-1">
                <Select
                  value={month}
                  onValueChange={(value) => {
                    setMonth(value);
                    const maxDay = DAYS_IN_MONTH[Number(value)] ?? 31;
                    if (Number(day) > maxDay) setDay(String(maxDay));
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
              </div>
              <div className="w-28">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mt-1">{error}</p>}

          <Button
            className="w-full mt-2 cursor-pointer gradient-warm text-white hover:opacity-90 transition-smooth"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
};
