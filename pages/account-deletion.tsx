import { type FormEvent, useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { getValidUser } from 'infra/page-guard';

type Props = {
  user: { name: string; email: string; avatar_url: string | null } | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context,
) => {
  context.res.setHeader('Cache-Control', 'no-store');
  const identity = await getValidUser(context);
  return {
    props: {
      user: identity
        ? {
            name: identity.name,
            email: identity.email,
            avatar_url: identity.avatar_url ?? null,
          }
        : null,
    },
  };
};

export default function AccountDeletion({ user }: Props) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [message, setMessage] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !acknowledged || confirmation !== 'DELETE' || !password)
      return;
    setPending(true);
    setMessage('');
    try {
      const response = await fetch('/api/v1/account-deletion', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      });
      setPassword('');
      if (response.status === 204) {
        setDeleted(true);
        return;
      }
      if (response.status === 401) {
        setNeedsLogin(true);
        setMessage('Your session has ended. Sign in again to continue.');
      } else if (response.status === 409)
        setMessage(
          'Delete the groups you own on the Groups page, then return here to delete your account.',
        );
      else if (response.status === 403)
        setMessage(
          'Unable to confirm this request. Check your current password and try again from this page.',
        );
      else
        setMessage(
          'Account deletion could not be completed. Please try again.',
        );
    } catch {
      setPassword('');
      setMessage(
        'The request could not be confirmed. Check your connection and refresh this page before trying again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-12 space-y-6">
      <Head>
        <title>Delete your Rememberly account</title>
      </Head>
      <h1 className="text-3xl font-bold">Delete your Rememberly account</h1>
      {deleted ? (
        <div role="status" className="space-y-4">
          <p>
            Your account and personal data have been deleted. All your sessions
            have ended.
          </p>
          <Link href="/">Return to Rememberly</Link>
        </div>
      ) : (
        <>
          <p>
            You can permanently delete your Rememberly account here, including
            accounts used in the iOS and Android app.
          </p>
          <p>
            Deletion removes your profile, personal dates, group memberships,
            saved occasions, password recovery and verification records,
            notification settings and devices, and sessions. Error logs linked
            to your account are also removed.
          </p>
          <p>
            You must delete every group you own first. Groups owned by other
            people and their accounts remain available.
          </p>
          <p>
            Aggregate service records and error logs that are not linked to your
            account remain. This action does not immediately erase hosting logs
            or backups.
          </p>
          <p>
            This version requires your current Rememberly password. Accounts
            without a password cannot complete deletion through this form.
            Password recovery is available through the existing{' '}
            <Link className="underline" href="/forgot-password">
              password recovery page
            </Link>
            .
          </p>
          {!user || needsLogin ? (
            <Link
              className="inline-block underline"
              href="/login?next=%2Faccount-deletion"
            >
              Sign in to delete your account
            </Link>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-5 rounded-2xl border p-6"
            >
              <p>
                Signed in as <strong>{user.email}</strong>.
              </p>
              <p className="font-semibold">
                This is permanent. Your account and personal data cannot be
                restored through Rememberly.
              </p>
              <label className="block">
                Current password
                <input
                  className="mt-2 block w-full rounded border p-3"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label className="block">
                Type DELETE to confirm
                <input
                  className="mt-2 block w-full rounded border p-3"
                  name="confirmation"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  pattern="DELETE"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  disabled={pending}
                />
              </label>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  disabled={pending}
                  required
                />
                <span>
                  I understand that my account and personal data will be
                  permanently deleted.
                </span>
              </label>
              <button
                className="rounded bg-red-700 px-4 py-3 text-white disabled:opacity-50"
                type="submit"
                disabled={
                  pending ||
                  !password ||
                  confirmation !== 'DELETE' ||
                  !acknowledged
                }
              >
                {pending
                  ? 'Deleting account…'
                  : 'Permanently delete my account'}
              </button>
              <p>
                <Link className="underline" href="/groups">
                  Manage my groups
                </Link>
              </p>
            </form>
          )}
          {message && <p role="alert">{message}</p>}
        </>
      )}
    </main>
  );
}
