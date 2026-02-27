import type { AppProps } from 'next/app';
import { Layout } from '@/components/layout/layout';
import { fredoka, quicksand } from '@/lib/fonts';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={quicksand.className}>
      <style>{`
        h1, h2, h3, h4, h5, h6, .font-heading {
          font-family: ${fredoka.style.fontFamily};
        }
      `}</style>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
