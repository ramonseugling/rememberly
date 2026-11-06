import { SessionApiError } from './api.ts';
import type { CreatedSession, SessionApi, SessionIdentity } from './api.ts';
import { ApiError } from '../data/client.ts';
import type { AuthenticatedTransport, RequestOptions } from '../data/client.ts';

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
  private dataTransport?: AuthenticatedTransport;

  constructor(
    api: SessionApi,
    storage: CredentialStorage,
    dataTransport?: AuthenticatedTransport,
  ) {
    this.api = api;
    this.storage = storage;
    this.dataTransport = dataTransport;
  }

  request = async <T>(path: string, options?: RequestOptions): Promise<T> => {
    const token = this.token;
    const epoch = this.epoch;
    if (!token || this.state.status !== 'authenticated')
      throw new ApiError('http', 401);
    if (!this.dataTransport) throw new ApiError('network');
    try {
      const data = await this.dataTransport<T>(path, token, options);
      if (
        epoch !== this.epoch ||
        token !== this.token ||
        this.state.status !== 'authenticated'
      ) {
        throw new ApiError('stale');
      }
      return data;
    } catch (error) {
      if (
        epoch !== this.epoch ||
        token !== this.token ||
        this.state.status !== 'authenticated'
      ) {
        throw new ApiError('stale');
      }
      if (error instanceof ApiError && error.status === 401) {
        await this.rejectSession(epoch, token);
        if (
          this.epoch !== epoch + 1 ||
          this.token !== null ||
          this.getSnapshot().status !== 'signed-out'
        ) {
          throw new ApiError('stale');
        }
      }
      throw error;
    }
  };

  private async rejectSession(epoch: number, token: string) {
    if (epoch !== this.epoch || token !== this.token) return;
    const rejectedEpoch = ++this.epoch;
    this.token = null;
    this.update('signed-out', 'Sua sessão expirou. Entre novamente.');
    let removed = true;
    try {
      await this.stored(async () => {
        if (rejectedEpoch === this.epoch) await this.storage.remove();
      });
    } catch {
      removed = false;
    }
    if (!removed && rejectedEpoch === this.epoch) {
      this.update(
        'signed-out',
        'Sua sessão expirou. Não foi possível remover o acesso salvo; tente sair novamente.',
        null,
        true,
      );
    }
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
        'Não foi possível confirmar o encerramento da sessão no servidor. Tente sair novamente quando estiver conectado.',
        null,
        true,
      );
    }
  }

  async restore() {
    const activeIdentity =
      this.state.status === 'authenticated' ? this.state.identity : null;
    const activeToken = this.token;
    const epoch = ++this.epoch;
    if (!activeIdentity) this.update('restoring');
    try {
      const token = await this.stored(() => this.storage.get());
      if (epoch !== this.epoch) return;
      this.token = token;
      if (activeIdentity && token !== activeToken) this.update('restoring');
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
        this.update('signed-out', 'Sua sessão expirou. Entre novamente.');
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
              ? 'Sua sessão expirou. Entre novamente.'
              : 'Sua sessão expirou. Não foi possível remover o acesso salvo; tente sair novamente.',
            null,
            !removed,
          );
      } else if (activeIdentity && this.token === activeToken) {
        this.update(
          'authenticated',
          'Não foi possível verificar sua sessão novamente. Sua tela atual foi mantida. Tente novamente quando estiver conectado.',
          activeIdentity,
          this.pendingRevocations.size > 0,
        );
      } else {
        this.update(
          'unavailable',
          'Não foi possível verificar sua sessão salva. Seu acesso foi mantido. Tente novamente quando estiver conectado.',
        );
      }
    }
  }

  async login(email: string, password: string) {
    return this.signIn(() => this.api.login(email, password));
  }

  async loginWithGoogle(authorize: () => Promise<CreatedSession | null>) {
    return this.signIn(authorize, true);
  }

  private async signIn(
    authorize: () => Promise<CreatedSession | null>,
    google = false,
  ) {
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
      const created = await authorize();
      if (!created) {
        if (epoch === this.epoch) this.update('signed-out');
        return;
      }
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
          ? 'Não foi possível encerrar uma sessão anterior. Tente sair novamente quando estiver conectado.'
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
          ? 'Não foi possível remover o acesso salvo. Tente sair novamente antes de trocar de conta.'
          : google
            ? 'Não foi possível entrar com Google. Tente novamente.'
            : error instanceof SessionApiError && error.status === 401
              ? 'E-mail ou senha inválidos. Se sua conta usa o Google, entre com Google.'
              : error instanceof SessionApiError && error.status === 400
                ? 'Informe um e-mail válido e sua senha.'
                : error instanceof SessionApiError && error.status === 429
                  ? 'Muitas tentativas de login. Aguarde antes de tentar novamente.'
                  : issued
                    ? 'Não foi possível salvar seu acesso com segurança. Tente sair e entrar novamente.'
                    : 'O login está indisponível. Confira sua conexão e tente novamente.',
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
        ? 'Não foi possível remover o acesso salvo. Tente sair novamente antes de fechar o app.'
        : unconfirmed
          ? 'Você saiu deste dispositivo. Não foi possível confirmar o encerramento no servidor; tente novamente quando estiver conectado.'
          : null,
      null,
      !removed || unconfirmed,
    );
  }
}
