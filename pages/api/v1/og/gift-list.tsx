import type { NextApiRequest, NextApiResponse } from 'next';
import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { previewHeadline } from '@/lib/og/gift-preview-copy';
import controller from 'infra/controller';
import { NotFoundError } from 'infra/errors';
import giftPreview from 'models/gift-preview';
import giftShare from 'models/gift-share';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CONFETTI = [
  { left: 40, top: 40, w: 28, h: 14, rotate: 20, color: '#F7A8C4' },
  { left: 210, top: 560, w: 18, h: 18, rotate: 0, color: '#FEC8A0' },
  { left: 640, top: 36, w: 28, h: 14, rotate: -30, color: '#F58FB0' },
  { left: 1120, top: 70, w: 18, h: 18, rotate: 0, color: '#FDB87C' },
  { left: 560, top: 560, w: 18, h: 18, rotate: 0, color: '#F7A8C4' },
  { left: 60, top: 470, w: 24, h: 12, rotate: 40, color: '#FDB87C' },
  { left: 1090, top: 540, w: 28, h: 14, rotate: 15, color: '#F7A8C4' },
  { left: 470, top: 90, w: 22, h: 11, rotate: -20, color: '#F58FB0' },
  { left: 880, top: 40, w: 18, h: 18, rotate: 0, color: '#FEC8A0' },
  { left: 440, top: 330, w: 16, h: 16, rotate: 0, color: '#F58FB0' },
  { left: 1150, top: 300, w: 22, h: 11, rotate: 35, color: '#FEC8A0' },
  { left: 380, top: 585, w: 18, h: 18, rotate: 0, color: '#F7A8C4' },
] as const;

function asset(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), 'lib', 'og', ...parts));
}

export default controller({ GET: handleGet });

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.list;
  const legacyUser = req.query.user;
  const user =
    typeof code === 'string'
      ? await giftShare.findOwnerIdByToken(code)
      : typeof legacyUser === 'string' && UUID.test(legacyUser)
        ? legacyUser
        : null;
  if (!user) {
    throw new NotFoundError({
      message: 'Lista não encontrada.',
      action: 'Confira o link.',
    });
  }
  const preview = await giftPreview.findGiftPreview(user);
  if (!preview) {
    throw new NotFoundError({
      message: 'Lista não encontrada.',
      action: 'Confira o link.',
    });
  }

  const { headline, subtitle } = previewHeadline(
    preview.firstName,
    preview.daysUntil,
  );
  const logo = `data:image/png;base64,${asset('logo.png').toString('base64')}`;
  const initial = preview.firstName.charAt(0).toUpperCase();

  const image = new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 80px',
        background: 'linear-gradient(135deg, #FDE3EC 0%, #FEE8D6 100%)',
        fontFamily: 'Fredoka',
        position: 'relative',
      }}
    >
      {CONFETTI.map((piece, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: piece.left,
            top: piece.top,
            width: piece.w,
            height: piece.h,
            borderRadius: 3,
            background: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
      <div
        style={{
          width: 340,
          height: 340,
          borderRadius: 170,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F58FB0 0%, #FDB87C 100%)',
          border: '10px solid #FFFFFF',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {preview.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.avatarUrl}
            width={340}
            height={340}
            style={{ objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div style={{ fontSize: 170, color: '#FFFFFF', display: 'flex' }}>
            {initial}
          </div>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 160,
          top: 40,
          display: 'flex',
        }}
      >
        <svg width={180} height={180} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5 L19 21 H5 Z"
            fill="#FEC8A0"
            stroke="#E53565"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d="M8.6 13 L15.4 13 M6.9 17 L17.1 17"
            stroke="#E53565"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle cx={12} cy={4} r={2} fill="#E53565" />
        </svg>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 70,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: '#594553',
            display: 'flex',
            marginBottom: 10,
          }}
        >
          Lista de presentes
        </div>
        <div
          style={{
            fontSize: 88,
            lineHeight: 1.05,
            color: '#D52555',
            display: 'flex',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 48,
            lineHeight: 1.2,
            color: '#221921',
            display: 'flex',
            marginTop: 14,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 40,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={64} height={57} alt="" />
          <div
            style={{
              fontSize: 40,
              color: '#E53565',
              display: 'flex',
              marginLeft: 16,
            }}
          >
            Rememberly
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Fredoka',
          data: asset('fonts', 'Fredoka_700Bold.ttf'),
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  const buffer = Buffer.from(await image.arrayBuffer());
  res.setHeader('Content-Type', 'image/png');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  );
  res.status(200).send(buffer);
}
