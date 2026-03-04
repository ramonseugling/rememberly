import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Layout } from '@/components/layout/layout';
import { fredoka, quicksand } from '@/lib/fonts';
import '../styles/globals.css';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App({ Component, pageProps }: AppProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/v1/sessions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className={quicksand.className}>
      <style>{`
        h1, h2, h3, h4, h5, h6, .font-heading {
          font-family: ${fredoka.style.fontFamily};
        }
      `}</style>
      <Layout user={user}>
        <Component {...pageProps} user={user} onUserChange={setUser} />
      </Layout>
    </div>
  );
}
