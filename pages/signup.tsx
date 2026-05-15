import { useCallback, useRef, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuthShell } from '@/components/auth-shell/auth-shell';
import { DAYS_IN_MONTH, MONTHS } from '@/lib/constants';
import { withGuest } from 'infra/page-guard';

export const getServerSideProps: GetServerSideProps = withGuest();

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export default function Signup() {
  const router = useRouter();
  const next = typeof router.query.next === 'string' ? router.query.next : '';
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const daysInMonth = birthMonth
    ? (DAYS_IN_MONTH[Number(birthMonth)] ?? 31)
    : 31;

  const handleBirthDayChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    const num = Number(value);
    if (value !== '' && (num < 1 || num > daysInMonth)) return;
    setBirthDay(value.slice(0, 2));
  };

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const digit = value.slice(-1);
      const newDigits = [...otpDigits];
      newDigits[index] = digit;
      setOtpDigits(newDigits);

      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits],
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
      if (pasted.length === 0) return;

      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] ?? '';
      }
      setOtpDigits(newDigits);

      const focusIndex = Math.min(pasted.length, 5);
      otpRefs.current[focusIndex]?.focus();
    },
    [otpDigits],
  );

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpRes = await fetch('/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const otpData = await otpRes.json();

    if (!otpRes.ok) {
      setError(otpData.message ?? 'Erro ao enviar código.');
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep('otp');
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const otpCode = otpDigits.join('');

    if (otpCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos.');
      setLoading(false);
      return;
    }

    const signupRes = await fetch('/api/v1/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        otp_code: otpCode,
        birth_day: Number(birthDay),
        birth_month: Number(birthMonth),
        birth_year: Number(birthYear),
      }),
    });

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      setError(signupData.message ?? 'Erro ao criar conta.');
      setLoading(false);
      return;
    }

    const loginRes = await fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      router.push(next ? `/login?next=${encodeURIComponent(next)}` : '/login');
      return;
    }

    const redirectTo =
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/dates';
    router.push(redirectTo);
  }

  async function handleResendOtp() {
    setLoading(true);
    setError('');
    setOtpDigits(['', '', '', '', '', '']);

    const otpRes = await fetch('/api/v1/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const otpData = await otpRes.json();

    if (!otpRes.ok) {
      setError(otpData.message ?? 'Erro ao reenviar código.');
    }

    setLoading(false);
  }

  return (
    <AuthShell
      title={step === 'form' ? 'Crie sua conta' : 'Verifique seu e-mail'}
      subtitle={
        step === 'form'
          ? 'Leva menos de um minuto.'
          : `Enviamos um código de 6 dígitos para ${email}`
      }
    >
      {step === 'form' && (
        <>
          <a
            href={
              next
                ? `/api/v1/auth/google?next=${encodeURIComponent(next)}`
                : '/api/v1/auth/google'
            }
          >
            <Button
              type="button"
              className="w-full rounded-2xl py-5 font-semibold border border-border bg-background text-foreground hover:bg-muted transition-smooth"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar com Google
            </Button>
          </a>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="name"
              >
                Nome
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Data de nascimento
              </label>
              <div className="flex gap-3">
                <div className="w-20">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={birthDay}
                    onChange={(e) => handleBirthDayChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth text-center"
                    placeholder="Dia"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    value={birthMonth}
                    onValueChange={(value) => {
                      setBirthMonth(value);
                      const maxDay = DAYS_IN_MONTH[Number(value)] ?? 31;
                      if (Number(birthDay) > maxDay)
                        setBirthDay(String(maxDay));
                    }}
                  >
                    <SelectTrigger className="rounded-2xl py-3 h-auto cursor-pointer">
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {MONTHS.map((monthName, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {monthName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28">
                  <Select value={birthYear} onValueChange={setBirthYear}>
                    <SelectTrigger className="rounded-2xl py-3 h-auto cursor-pointer">
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

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white rounded-2xl py-6 font-semibold hover:opacity-90 transition-smooth shadow-warm"
            >
              {loading ? 'Enviando código...' : 'Continuar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Já tem conta?{' '}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
              className="text-brand-gradient font-bold hover:underline"
            >
              Entrar
            </Link>
          </p>
        </>
      )}

      {step === 'otp' && (
        <>
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setError('');
              setOtpDigits(['', '', '', '', '', '']);
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex justify-center gap-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white rounded-2xl py-6 font-semibold hover:opacity-90 transition-smooth shadow-warm"
            >
              {loading ? 'Verificando...' : 'Verificar e criar conta'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Não recebeu o código?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-primary font-semibold hover:underline disabled:opacity-50"
              >
                Reenviar
              </button>
            </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
