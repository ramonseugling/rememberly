import { log } from 'next-axiom';
import { LEGAL_VERSION } from '@/lib/legal/shared';
import { splitSocialName } from '@/lib/person-name';
import database from 'infra/database';
import { ServiceError, ValidationError } from 'infra/errors';
import googleAvatar from 'models/google-avatar';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

function getAuthorizationUrl(
  state: string,
  redirectUri = `${process.env.APP_URL}/api/v1/auth/google/callback`,
) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'online',
    state,
    prompt: 'select_account',
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(
  code: string,
  redirectUri = `${process.env.APP_URL}/api/v1/auth/google/callback`,
) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    log.error('google_token_exchange_failed', {
      status: response.status,
    });

    throw new ServiceError({
      message: 'Erro ao se comunicar com o Google.',
      action: 'Tente novamente mais tarde.',
    });
  }

  const data = await response.json();
  return data.access_token as string;
}

async function getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    log.error('google_userinfo_failed', { status: response.status });

    throw new ServiceError({
      message: 'Erro ao buscar perfil do Google.',
      action: 'Tente novamente mais tarde.',
    });
  }

  const data = await response.json();

  if (!data.email) {
    throw new ValidationError({
      message: 'Não foi possível obter o e-mail da conta Google.',
      action: 'Verifique as permissões da sua conta Google.',
    });
  }

  return {
    email: data.email,
    name: data.name ?? data.email.split('@')[0],
    picture: typeof data.picture === 'string' ? data.picture : undefined,
  };
}

async function findOrCreateUser(profile: GoogleUserProfile) {
  const existingUser = await findUserByEmail(profile.email);

  if (existingUser) {
    log.info('google_auth_existing_user', { userId: existingUser.id });
    await googleAvatar.importIfMissing(existingUser.id, profile.picture);
    return existingUser;
  }

  const newUser = await createUser(profile);
  log.info('google_auth_new_user', { userId: newUser.id });
  await googleAvatar.importIfMissing(newUser.id, profile.picture);
  return newUser;
}

async function findUserByEmail(email: string) {
  const result = await database.query(
    `SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email],
  );

  return result.rows[0] ?? null;
}

async function createUser(profile: GoogleUserProfile) {
  const split = splitSocialName(profile.name);
  const result = await database.query(
    `INSERT INTO users (name, first_name, last_name, email, terms_accepted_at, terms_version)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     RETURNING id, name, email, created_at, updated_at`,
    [
      split.name,
      split.first_name,
      split.last_name,
      profile.email.toLowerCase(),
      LEGAL_VERSION,
    ],
  );

  return result.rows[0];
}

const googleAuth = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  getUserProfile,
  findOrCreateUser,
};

export default googleAuth;
