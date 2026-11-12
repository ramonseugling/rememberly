import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ExternalLink, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PublicItem {
  id: string;
  title: string;
  link: string | null;
  description: string | null;
  photo_url?: string | null;
  availability?: 'available' | 'reserved' | 'purchased';
  reserved_by_me?: boolean;
}

interface PublicList {
  owner: { id: string; name: string; avatar_url: string | null };
  items: PublicItem[];
  viewer_is_owner: boolean;
  viewer_signed_in: boolean;
}

interface GiftListPageProps {
  appLink: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  headline: string;
  subtitle: string;
  firstName: string;
  token: string | null;
  list: PublicList | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{22}$/;

export const getServerSideProps: GetServerSideProps<GiftListPageProps> = async (
  context,
) => {
  const code = context.query.list;
  const legacyUser = context.query.user;
  const token = typeof code === 'string' && TOKEN.test(code) ? code : null;
  if (!token && !(typeof legacyUser === 'string' && UUID.test(legacyUser))) {
    return { redirect: { destination: '/', permanent: false } };
  }

  const { default: giftVisibility } = await import('models/gift-visibility');
  const { default: giftShare } = await import('models/gift-share');
  const { default: giftPreview } = await import('models/gift-preview');
  const { default: session } = await import('models/session');
  const { previewTitle, previewDescription, previewHeadline } =
    await import('@/lib/og/gift-preview-copy');

  const ownerId = token
    ? await giftShare.findOwnerIdByToken(token)
    : (legacyUser as string);
  const preview = ownerId ? await giftPreview.findGiftPreview(ownerId) : null;

  const host = context.req.headers.host ?? 'rememberly.com.br';
  const forwarded = context.req.headers['x-forwarded-proto'];
  const protocol =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) ??
    (host.startsWith('localhost') ? 'http' : 'https');
  const origin = `${protocol}://${host}`;

  let list: PublicList | null = null;
  if (token && preview) {
    const sessionToken = context.req.cookies?.session_token;
    const found = sessionToken
      ? await session.findOneValidByToken(sessionToken)
      : null;
    list = JSON.parse(
      JSON.stringify(
        await giftVisibility.findListByToken(token, found?.user_id ?? null),
      ),
    ) as PublicList;
  }

  const query = token ? `list=${token}` : `user=${legacyUser as string}`;
  const firstName = preview?.firstName ?? '';
  const headline = preview
    ? previewHeadline(preview.firstName, preview.daysUntil)
    : { headline: 'Lista de presentes', subtitle: '' };
  return {
    props: {
      appLink: token
        ? `rememberly://gift-list?list=${token}`
        : `rememberly://gift-list?user=${legacyUser as string}`,
      title: preview ? previewTitle(preview.firstName) : 'Lista de presentes',
      description: preview
        ? previewDescription(preview.firstName, preview.daysUntil)
        : 'Veja a lista de presentes no Rememberly.',
      imageUrl: preview
        ? `${origin}/api/v1/og/gift-list?${token ? 'list' : 'user'}=${token ?? (legacyUser as string)}`
        : `${origin}/images/brand/new-3d-logo.png`,
      url: `${origin}/gift-list?${query}`,
      headline: headline.headline,
      subtitle: headline.subtitle,
      firstName,
      token,
      list,
    },
  };
};

export default function GiftListPage(props: GiftListPageProps) {
  const router = useRouter();
  const [list, setList] = useState(props.list);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function refresh() {
    if (!props.token) return;
    const response = await fetch(`/api/v1/public/gift-lists/${props.token}`);
    if (response.ok) setList(await response.json());
  }

  async function toggleReservation(item: PublicItem) {
    if (!props.token || !list) return;
    if (!list.viewer_signed_in) {
      void router.push(
        `/login?next=${encodeURIComponent(`/gift-list?list=${props.token}`)}`,
      );
      return;
    }
    setBusy(item.id);
    setError('');
    const response = await fetch(`/api/v1/gifts/${item.id}/reservation`, {
      method: item.reserved_by_me ? 'DELETE' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: item.reserved_by_me
        ? undefined
        : JSON.stringify({ status: 'reserved', token: props.token }),
    });
    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      setError(data.message ?? 'Não foi possível atualizar a reserva.');
    }
    await refresh();
    setBusy(null);
  }

  return (
    <div className="flex-1 flex items-start justify-center p-4">
      <Head>
        <title>{`${props.title} | Rememberly`}</title>
        <meta name="description" content={props.description} />
        <meta key="og:title" property="og:title" content={props.title} />
        <meta
          key="og:description"
          property="og:description"
          content={props.description}
        />
        <meta key="og:url" property="og:url" content={props.url} />
        <meta key="og:image" property="og:image" content={props.imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          key="twitter:image"
          name="twitter:image"
          content={props.imageUrl}
        />
      </Head>
      <div className="w-full max-w-md space-y-4">
        <Card className="rounded-3xl border-border/50 p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-violet/10 text-violet flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {props.headline}
          </h1>
          {props.subtitle && (
            <p className="text-muted-foreground mt-1">{props.subtitle}</p>
          )}
          <p className="text-foreground font-semibold mt-3">
            Lista de presentes{props.firstName ? ` de ${props.firstName}` : ''}
          </p>
        </Card>

        {!list && (
          <Card className="rounded-3xl border-border/50 p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Abra este link no aplicativo Rememberly para ver a lista.
            </p>
            <a href={props.appLink}>
              <Button className="w-full rounded-2xl gradient-violet text-white">
                Abrir no aplicativo
              </Button>
            </a>
          </Card>
        )}

        {list && list.items.length === 0 && (
          <Card className="rounded-3xl border-border/50 p-6 text-center text-muted-foreground">
            Esta lista ainda não tem presentes.
          </Card>
        )}

        {list?.items.map((item) => (
          <Card
            key={item.id}
            className="rounded-3xl border-border/50 p-4 flex gap-4"
          >
            {item.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photo_url}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-violet/10 text-violet flex items-center justify-center shrink-0">
                <Gift className="w-8 h-8" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-semibold text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-sm text-violet font-medium"
                >
                  Ver produto <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {!list.viewer_is_owner && (
                <div>
                  {item.availability === 'available' || item.reserved_by_me ? (
                    <Button
                      size="sm"
                      variant={item.reserved_by_me ? 'outline' : 'default'}
                      className="rounded-xl"
                      disabled={busy === item.id}
                      onClick={() => void toggleReservation(item)}
                    >
                      {item.reserved_by_me
                        ? 'Cancelar minha reserva'
                        : list.viewer_signed_in
                          ? 'Reservar'
                          : 'Entrar para reservar'}
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {item.availability === 'purchased'
                        ? 'Já comprado'
                        : 'Já reservado'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {list && (
          <p className="text-center text-sm text-muted-foreground">
            Tem o app?{' '}
            <a href={props.appLink} className="text-violet font-medium">
              Abrir no aplicativo
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
