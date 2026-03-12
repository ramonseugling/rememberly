import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      body: JSON.stringify({ name, email, password, otp_code: otpCode }),
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
      router.push('/login');
      return;
    }

    router.push('/dates');
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
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            {step === 'form'
              ? 'Crie sua conta gratuitamente'
              : 'Verifique seu e-mail'}
          </p>
        </div>

        <Card className="p-8 rounded-3xl border-border/50">
          {step === 'form' && (
            <>
              <a href="/api/v1/auth/google">
                <Button
                  type="button"
                  className="w-full rounded-2xl py-3 font-semibold border border-border bg-background text-foreground hover:bg-muted transition-smooth"
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="name"
                  >
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="email"
                  >
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                    placeholder="seu@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="password"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
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
                  className="w-full gradient-warm text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition-smooth"
                >
                  {loading ? 'Enviando código...' : 'Continuar'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem conta?{' '}
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:underline"
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

              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para
                </p>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {email}
                </p>
              </div>

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
                  className="w-full gradient-warm text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition-smooth"
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
        </Card>
      </div>
    </div>
  );
}
