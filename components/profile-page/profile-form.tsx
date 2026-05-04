import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DAYS_IN_MONTH, MONTHS } from '@/lib/constants';

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

interface ProfileFormProps {
  user: ProfileUser;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [day, setDay] = useState(user.birth_day ? String(user.birth_day) : '');
  const [month, setMonth] = useState(
    user.birth_month ? String(user.birth_month) : '',
  );
  const [year, setYear] = useState(
    user.birth_year ? String(user.birth_year) : '',
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const daysInMonth = month ? (DAYS_IN_MONTH[Number(month)] ?? 31) : 31;

  const hasChanges =
    name.trim() !== user.name ||
    (day ? Number(day) : null) !== user.birth_day ||
    (month ? Number(month) : null) !== user.birth_month ||
    (year ? Number(year) : null) !== user.birth_year;

  const handleDayChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    const num = Number(value);
    if (value !== '' && (num < 1 || num > daysInMonth)) return;
    setDay(value.slice(0, 2));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('O nome é obrigatório.');
      return;
    }
    if (name.trim().length < 2) {
      setError('O nome deve ter pelo menos 2 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const body: Record<string, unknown> = { name: name.trim() };
      if (day && month && year) {
        body.birth_day = Number(day);
        body.birth_month = Number(month);
        body.birth_year = Number(year);
      }

      const response = await fetch('/api/v1/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message ?? 'Erro ao salvar perfil.');
        return;
      }

      router.replace(router.asPath);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 sm:p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">Nome</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-email">E-mail</Label>
        <Input
          id="profile-email"
          value={user.email}
          disabled
          className="opacity-60 cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground">
          O e-mail não pode ser alterado.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Data de nascimento</Label>
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
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {m}
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button
          className="gradient-warm text-white hover:opacity-90 rounded-2xl px-6 transition-smooth"
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
        >
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
};
