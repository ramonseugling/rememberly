import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth-shell/auth-shell';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/v1/password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message ?? 'Erro ao redefinir senha.');
      setLoading(false);
      return;
    }

    router.push('/login?reset=success');
  }

  if (!token) {
    return (
      <AuthShell
        title="Link inválido"
        subtitle="Este link de redefinição é inválido ou expirou."
      >
        <div className="text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <p className="text-sm text-muted-foreground">
            Solicite um novo link de redefinição.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block text-sm text-brand-gradient font-bold hover:underline mt-2"
          >
            Solicitar novo link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie uma nova senha"
      subtitle="Escolha uma senha forte que você vai lembrar."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
              minLength={6}
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
              minLength={6}
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
