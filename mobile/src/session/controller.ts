import { SessionApiError } from './api.ts';
import type { SessionApi, SessionIdentity } from './api.ts';

export interface CredentialStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  remove(): Promise<void>;
}

export interface SessionState {
  status:
    | 'restoring'
    | 'signed-out'
    | 'signing-in'
    | 'authenticated'
    | 'unavailable';
  identity: SessionIdentity | null;
  message: string | null;
  logoutUnconfirmed: boolean;
}

export class SessionController {
  private state: SessionState = {
    status: 'restoring',
    identity: null,
    message: null,
    logoutUnconfirmed: false,
  };
  private token: string | null = null;
  private pendingRevocations = new Set<string>();
  private epoch = 0;
  private listeners = new Set<() => void>();
  private storageQueue: Promise<unknown> = Promise.resolve();
  private api: SessionApi;
  private storage: CredentialStorage;

  constructor(api: SessionApi, storage: CredentialStorage) {
    this.api = api;
    this.storage = storage;
  }

  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(
    status: SessionState['status'],
    message: string | null = null,
    current: SessionIdentity | null = null,
    logoutUnconfirmed = false,
  ) {
    this.state = { status, identity: current, message, logoutUnconfirmed };
    this.listeners.forEach((listener) => listener());
  }

  private stored<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.storageQueue.then(operation);
    this.storageQueue = result.catch(() => {});
    return result;
  }

  private async revoke(token: string) {
    if (!/^[a-f0-9]{96}$/.test(token)) {
      this.pendingRevocations.delete(token);
      return true;
    }
    try {
      await this.api.revoke(token);
      this.pendingRevocations.delete(token);
      return true;
    } catch {
      this.pendingRevocations.add(token);
      return false;
    }
  }

  private async revokeObsolete(token: string) {
    if (!(await this.revoke(token)) && this.state.status === 'signed-out') {
      this.update(
        'signed-out',
        'Server revocation could not be confirmed. Retry sign-out cleanup when connected.',
        null,
        true,
      );
    }
  }

  async restore() {
    const epoch = ++this.epoch;
    this.update('restoring');
    try {
      const token = await this.stored(() => this.storage.get());
      if (epoch !== this.epoch) return;
      this.token = token;
      if (!token) {
        this.update('signed-out');
        return;
      }
      if (!/^[a-f0-9]{96}$/.test(token)) {
        await this.stored(async () => {
          if (epoch === this.epoch) await this.storage.remove();
        });
        if (epoch === this.epoch) {
          this.token = null;
          this.update('signed-out');
        }
        return;
      }
      const current = await this.api.inspect(token);
      if (epoch === this.epoch) this.update('authenticated', null, current);
    } catch (error) {
      if (epoch !== this.epoch) return;
      if (error instanceof SessionApiError && error.status === 401) {
        this.token = null;
        let removed = true;
        try {
          await this.stored(async () => {
            if (epoch === this.epoch) await this.storage.remove();
          });
        } catch {
          removed = false;
        }
        if (epoch === this.epoch)
          this.update(
            'signed-out',
            removed
              ? 'Your session is no longer valid. Please sign in again.'
              : 'Your session is no longer valid. Saved sign-in cleanup failed; retry signing out.',
            null,
            !removed,
          );
      } else {
        this.update(
          'unavailable',
          'We could not verify your saved session. Your saved sign-in has been kept. Try again when connected.',
        );
      }
    }
  }

  async login(email: string, password: string) {
    const epoch = ++this.epoch;
    const previous = this.token;
    this.token = null;
    this.update('signing-in');
    let issued: string | null = null;
    let cleared = false;
    try {
      let saved: string | null = null;
      await this.stored(async () => {
        if (epoch !== this.epoch) return;
        saved = await this.storage.get();
        await this.storage.remove();
        cleared = true;
      });
      for (const old of new Set([previous, saved])) {
        if (old) await this.revoke(old);
      }
      if (epoch !== this.epoch) return;
      const created = await this.api.login(email, password);
      issued = created.token;
      if (epoch !== this.epoch) {
        await this.revokeObsolete(issued);
        return;
      }
      await this.stored(async () => {
        if (epoch === this.epoch) await this.storage.set(created.token);
      });
      if (epoch !== this.epoch) {
        await this.revokeObsolete(issued);
        return;
      }
      this.token = created.token;
      this.update(
        'authenticated',
        this.pendingRevocations.size
          ? 'A previous session could not be revoked. Retry signing out when connected.'
          : null,
        { user: created.user, expires_at: created.expires_at },
      );
    } catch (error) {
      if (issued) await this.revoke(issued);
      if (!cleared && previous) await this.revoke(previous);
      if (epoch !== this.epoch) return;
      if (issued) {
        try {
          await this.stored(async () => {
            if (epoch === this.epoch) await this.storage.remove();
          });
        } catch {}
      }
      if (epoch !== this.epoch) return;
      this.update(
        'signed-out',
        !cleared
          ? 'Saved sign-in could not be cleared. Retry sign-out cleanup before switching accounts.'
          : error instanceof SessionApiError && error.status === 401
            ? 'Invalid email or password. Google-only accounts cannot use password sign-in yet.'
            : error instanceof SessionApiError && error.status === 400
              ? 'Enter a valid email address and a nonempty password.'
              : issued
                ? 'We could not securely save your sign-in. Please retry sign-out cleanup, then sign in again.'
                : 'Sign-in is unavailable. Check your connection and try again.',
        null,
        !cleared || !!issued || this.pendingRevocations.size > 0,
      );
    }
  }

  async logout() {
    const epoch = ++this.epoch;
    const token = this.token;
    this.token = null;
    this.update('signed-out');
    if (token) this.pendingRevocations.add(token);
    let removed = true;
    let captured = true;
    await this.stored(async () => {
      if (epoch !== this.epoch) return;
      try {
        const saved = await this.storage.get();
        if (saved) this.pendingRevocations.add(saved);
      } catch {
        captured = false;
      }
      try {
        await this.storage.remove();
      } catch {
        removed = false;
      }
    });
    for (const pending of [...this.pendingRevocations])
      await this.revoke(pending);
    if (epoch !== this.epoch) return;
    const unconfirmed = !captured || this.pendingRevocations.size > 0;
    this.update(
      'signed-out',
      !removed
        ? 'Saved sign-in could not be removed. Retry signing out before leaving the app.'
        : unconfirmed
          ? 'Signed out on this device. Server revocation could not be confirmed; retry when connected.'
          : null,
      null,
      !removed || unconfirmed,
    );
  }
}
