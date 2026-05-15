import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell/auth-shell';
import { withGuest } from 'infra/page-guard';

export const getServerSideProps: GetServerSideProps = withGuest();

export default function Login() {
  const router = useRouter();
  const next = typeof router.query.next === 'string' ? router.query.next : '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message ?? 'Erro ao fazer login.');
      setLoading(false);
      return;
    }

    router.push(
      next && next.startsWith('/') && !next.startsWith('//') ? next : '/dates',
    );
  }

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre para continuar lembrando quem importa."
    >
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

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou</span>
        </div>
      </div>

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

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-2xl">
            {error}
          </p>
        )}

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-brand text-white rounded-2xl py-6 font-semibold hover:opacity-90 transition-smooth shadow-warm"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Ainda não tem conta?{' '}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
          className="text-brand-gradient font-bold hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}
