import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import session from 'models/session';

interface User {
  id: string;
  name: string;
  email: string;
  birth_day: number | null;
  birth_month: number | null;
  birth_year: number | null;
}

type AuthenticatedHandler<P extends Record<string, unknown>> = (
  context: GetServerSidePropsContext,
  user: User,
) => Promise<
  { props: P } | { redirect: { destination: string; permanent: boolean } }
>;

async function getValidUser(
  context: GetServerSidePropsContext,
): Promise<User | null> {
  const token = context.req.cookies?.session_token;
  if (!token) return null;

  const foundSession = await session.findOneValidByToken(token);
  if (!foundSession) return null;

  return {
    id: foundSession.user_id,
    name: foundSession.name,
    email: foundSession.email,
    birth_day: foundSession.birth_day ?? null,
    birth_month: foundSession.birth_month ?? null,
    birth_year: foundSession.birth_year ?? null,
  };
}

function withAuth<P extends Record<string, unknown>>(
  handler: AuthenticatedHandler<P>,
): GetServerSideProps {
  return async (context) => {
    const user = await getValidUser(context);

    if (!user) {
      return { redirect: { destination: '/', permanent: false } };
    }

    return handler(context, user);
  };
}

function withGuest(): GetServerSideProps {
  return async (context) => {
    const user = await getValidUser(context);

    if (user) {
      return { redirect: { destination: '/dates', permanent: false } };
    }

    return { props: {} };
  };
}

export { withAuth, withGuest };
