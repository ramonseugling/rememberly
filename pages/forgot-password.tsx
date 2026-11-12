import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell/auth-shell';

type Step = 'email' | 'code' | 'password' | 'done';

const EMPTY_DIGITS = ['', '', '', '', '', ''];

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(EMPTY_DIGITS);
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);
  const [error, setError] = useState('');
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

  async function requestCode(): Promise<'sent' | 'google_only' | 'failed'> {
    const response = await fetch('/api/v1/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.status === 429) {
      setError(data.action ?? 'Aguarde um pouco antes de tentar novamente.');
      return 'failed';
    }

    if (!response.ok) {
      setError(data.message ?? 'Erro ao enviar código.');
      return 'failed';
    }

    return data.google_only ? 'google_only' : 'sent';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await requestCode();
    setLoading(false);

    if (result === 'google_only') {
      setGoogleOnly(true);
    } else if (result === 'sent') {
      setOtpDigits(EMPTY_DIGITS);
      setStep('code');
    }
  }

  async function handleResend() {
    setLoading(true);
    setError('');
    setOtpDigits(EMPTY_DIGITS);

    await requestCode();
    setLoading(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const otpCode = otpDigits.join('');

    if (otpCode.length !== 6) {
      setError('Digite o código completo de 6 dígitos.');
      return;
    }

    setLoading(true);

    const response = await fetch('/api/v1/password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp_code: otpCode }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? 'Código inválido ou expirado.');
      return;
    }

    setResetToken(data.reset_token);
    setStep('password');
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('As senhas são diferentes.');
      return;
    }

    setLoading(true);

    const response = await fetch('/api/v1/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? 'Erro ao redefinir senha.');
      return;
    }

    const signedIn = await fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (signedIn.ok) {
      void router.push('/dates');
      return;
    }

    setStep('done');
  }

  function goBack(to: Step) {
    setError('');
    setPassword('');
    setPasswordConfirm('');
    if (to === 'email') setOtpDigits(EMPTY_DIGITS);
    setStep(to);
  }

  if (googleOnly) {
    return (
      <AuthShell
        title="Conta criada com Google"
        subtitle="Esta conta não usa senha. Entre direto pelo Google."
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">🔐</div>
          <p className="text-sm text-muted-foreground">
            Esta conta foi criada usando o Google e não possui senha. Use o
            botão abaixo para entrar.
          </p>
          <a href="/api/v1/auth/google">
            <Button
              type="button"
              className="w-full rounded-2xl py-5 font-semibold border border-border bg-background text-foreground hover:bg-muted transition-smooth mt-2"
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
          <Link
            href="/login"
            className="inline-block text-sm text-primary font-semibold hover:underline mt-2"
          >
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (step === 'code') {
    return (
      <AuthShell
        title="Verifique seu e-mail"
        subtitle={`Enviamos um código de 6 dígitos para ${email}`}
      >
        <button
          type="button"
          onClick={() => goBack('email')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <form onSubmit={handleVerify} className="space-y-5">
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
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Não recebeu o código?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              Reenviar
            </button>
          </p>
        </form>
      </AuthShell>
    );
  }

  if (step === 'password') {
    return (
      <AuthShell
        title="Crie uma nova senha"
        subtitle="Escolha uma senha forte que você vai lembrar."
      >
        <button
          type="button"
          onClick={() => goBack('code')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-smooth mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <form onSubmit={handleReset} className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="password"
            >
              Nova senha
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
                maxLength={72}
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
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="password-confirm"
            >
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="password-confirm"
                type={showPasswordConfirm ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={72}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-smooth"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                tabIndex={-1}
                aria-label={
                  showPasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {showPasswordConfirm ? (
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
            className="w-full gradient-brand text-white rounded-2xl py-6 font-semibold hover:opacity-90 transition-smooth shadow-warm"
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </AuthShell>
    );
  }

  if (step === 'done') {
    return (
      <AuthShell
        title="Senha alterada"
        subtitle="Sua nova senha já está valendo."
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <Link
            href="/login"
            className="inline-block text-sm text-primary font-semibold hover:underline mt-2"
          >
            Ir para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um código para você criar uma nova senha."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-brand text-white rounded-2xl py-6 font-semibold hover:opacity-90 transition-smooth shadow-warm"
        >
          {loading ? 'Enviando código...' : 'Enviar código'}
        </Button>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl text-center">
            {error}
          </p>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Lembrou a senha?{' '}
        <Link
          href="/login"
          className="text-brand-gradient font-bold hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
