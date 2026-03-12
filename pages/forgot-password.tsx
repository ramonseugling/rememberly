import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/v1/password/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (response.status === 429) {
      const data = await response.json();
      setError(data.action ?? 'Aguarde uma hora antes de tentar novamente.');
      setLoading(false);
      return;
    }

    const data = await response.json();

    if (data.google_only) {
      setGoogleOnly(true);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <p className="text-muted-foreground">Redefinição de senha</p>
        </div>

        <Card className="p-8 rounded-3xl border-border/50">
          {googleOnly ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">🔐</div>
              <p className="text-foreground font-medium">
                Conta criada com o Google
              </p>
              <p className="text-sm text-muted-foreground">
                Esta conta foi criada usando o Google e não possui senha. Use o
                botão abaixo para entrar.
              </p>
              <a href="/api/v1/auth/google">
                <Button
                  type="button"
                  className="w-full rounded-2xl py-3 font-semibold border border-border bg-background text-foreground hover:bg-muted transition-smooth mt-2"
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
                className="block text-sm text-primary font-semibold hover:underline mt-4"
              >
                Voltar para o login
              </Link>
            </div>
          ) : submitted ? (
            <div className="text-center space-y-4">
              <div className="text-4xl">📬</div>
              <p className="text-foreground font-medium">
                Verifique seu e-mail
              </p>
              <p className="text-sm text-muted-foreground">
                Se este e-mail estiver cadastrado, você receberá um link para
                redefinir sua senha em instantes.
              </p>
              <Link
                href="/login"
                className="block text-sm text-primary font-semibold hover:underline mt-4"
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Informe seu e-mail e enviaremos um link para você criar uma nova
                senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-warm text-white rounded-2xl py-3 font-semibold hover:opacity-90 transition-smooth"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </Button>

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Lembrou a senha?{' '}
                <Link
                  href="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Entrar
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
