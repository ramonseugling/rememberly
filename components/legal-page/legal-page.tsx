import Head from 'next/head';
import Link from 'next/link';
import { LandingFooter } from '@/components/landing-footer/landing-footer';
import {
  DRAFT_NOTICE,
  LEGAL_LAST_UPDATED,
  type LegalDocument,
} from '@/lib/legal/shared';

interface LegalPageProps {
  document: LegalDocument;
  otherPage: { href: string; label: string };
}

export const LegalPage = ({ document, otherPage }: LegalPageProps) => {
  const pageTitle = `${document.title} | Rememberly`;

  return (
    <div className="flex flex-1 flex-col">
      <Head>
        <title>{pageTitle}</title>
        <meta
          key="description"
          name="description"
          content={document.description}
        />
        <meta key="og:title" property="og:title" content={pageTitle} />
        <meta
          key="og:description"
          property="og:description"
          content={document.description}
        />
      </Head>

      <div className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 py-8">
          <div
            role="note"
            className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            {DRAFT_NOTICE}
          </div>

          <article>
            <h1 className="text-3xl font-bold text-foreground">
              {document.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Última atualização: {LEGAL_LAST_UPDATED}
            </p>
            <p className="mt-4 text-foreground">{document.intro}</p>

            <nav aria-label="Índice" className="mt-6">
              <h2 className="text-lg font-semibold">Índice</h2>
              <ol className="mt-2 space-y-1 text-sm">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-primary hover:underline"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {document.sections.map((section) => (
              <section
                key={section.id}
                aria-labelledby={section.id}
                className="mt-8 scroll-mt-24"
              >
                <h2 id={section.id} className="text-xl font-semibold">
                  {section.title}
                </h2>
                {section.blocks.map((block, index) =>
                  'p' in block ? (
                    <p key={index} className="mt-3 text-foreground">
                      {block.p}
                    </p>
                  ) : (
                    <ul
                      key={index}
                      className="mt-3 list-disc space-y-2 pl-6 text-foreground"
                    >
                      {block.ul.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
          </article>

          <p className="mt-10 text-sm">
            <Link href={otherPage.href} className="text-primary underline">
              {otherPage.label}
            </Link>
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};
