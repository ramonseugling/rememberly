import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ec7397" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo-3d.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
