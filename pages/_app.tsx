import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Analytics } from '@vercel/analytics/next';
import { Layout } from '@/components/layout/layout';
import { fredoka, quicksand } from '@/lib/fonts';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const is404 = router.pathname === '/404';

  return (
    <div className={quicksand.className}>
      <Head>
        <title>My Forever Dates</title>
        <meta
          name="description"
          content="Nunca mais esqueça o aniversário dos seus amigos."
        />
      </Head>
      <style>{`
        h1, h2, h3, h4, h5, h6, .font-heading {
          font-family: ${fredoka.style.fontFamily};
        }
      `}</style>
      <Layout user={pageProps.user} hideHeader={is404}>
        <Component {...pageProps} />
      </Layout>
      <Analytics />
    </div>
  );
}
