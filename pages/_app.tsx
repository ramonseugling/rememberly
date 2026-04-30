import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/next';
import { Layout } from '@/components/layout/layout';
import { fredoka, quicksand } from '@/lib/fonts';
import '../styles/globals.css';

const PAGES_WITH_OWN_HEADER = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const is404 = router.pathname === '/404';
  const hasOwnHeader = PAGES_WITH_OWN_HEADER.includes(router.pathname);

  return (
    <div className={quicksand.className}>
      <Head>
        <title>
          Rememberly — Nunca mais esqueça o aniversário de seus amigos
        </title>
        <meta
          name="description"
          content="Crie grupos com amigos e família. Cada pessoa cadastra o próprio aniversário e todo mundo recebe lembretes no dia certo."
        />
        <meta
          property="og:title"
          content="Rememberly — Nunca mais esqueça o aniversário de seus amigos"
        />
        <meta
          property="og:description"
          content="Crie grupos com amigos e família. Cada pessoa cadastra o próprio aniversário e todo mundo recebe lembretes no dia certo."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <style>{`
        h1, h2, h3, h4, h5, h6, .font-heading {
          font-family: ${fredoka.style.fontFamily};
        }
      `}</style>
      <Layout user={pageProps.user} hideHeader={is404 || hasOwnHeader}>
        <Component {...pageProps} />
      </Layout>
      <Analytics />
    </div>
  );
}
