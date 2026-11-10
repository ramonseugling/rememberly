import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const API = '/api/v1/admin/communications';
const PUSH_TITLE_HINT = 50;
const PUSH_BODY_HINT = 120;

interface Communication {
  id: string;
  title: string;
  push_title: string | null;
  push_body: string | null;
  email_subject: string | null;
  email_body: string | null;
  send_email: boolean;
  send_push: boolean;
  status: 'draft' | 'sending' | 'sent';
  sent_at: string | null;
  email_sent: number;
  email_failed: number;
  push_users: number;
  push_devices: number;
  created_at: string;
}

interface Form {
  title: string;
  push_title: string;
  push_body: string;
  email_subject: string;
  email_body: string;
  send_email: boolean;
  send_push: boolean;
}

interface RecipientCounts {
  email: number;
  push: number;
}

type Busy = 'save' | 'test' | 'send' | null;

const EMPTY_FORM: Form = {
  title: '',
  push_title: '',
  push_body: '',
  email_subject: '',
  email_body: '',
  send_email: true,
  send_push: false,
};

const STATUS_LABEL: Record<Communication['status'], string> = {
  draft: 'Rascunho',
  sending: 'Enviando',
  sent: 'Enviado',
};

function toForm(communication: Communication): Form {
  return {
    title: communication.title,
    push_title: communication.push_title ?? '',
    push_body: communication.push_body ?? '',
    email_subject: communication.email_subject ?? '',
    email_body: communication.email_body ?? '',
    send_email: communication.send_email,
    send_push: communication.send_push,
  };
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message ?? 'Erro inesperado.');

  return data as T;
}

interface CharHintProps {
  length: number;
  hint: number;
}

const CharHint = ({ length, hint }: CharHintProps) => (
  <span
    className={`text-xs ${length > hint ? 'text-destructive' : 'text-muted-foreground'}`}
  >
    {length}/{hint} caracteres recomendados
  </span>
);

interface ButtonLabelProps {
  busy: boolean;
  idle: string;
  loading: string;
}

const ButtonLabel = ({ busy, idle, loading }: ButtonLabelProps) =>
  busy ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      {loading}
    </>
  ) : (
    <>{idle}</>
  );

export const AdminCommunications = () => {
  const [items, setItems] = useState<Communication[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editing, setEditing] = useState<Communication | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [confirmCounts, setConfirmCounts] = useState<RecipientCounts | null>(
    null,
  );

  const readOnly = editing !== null && editing.status !== 'draft';

  const loadList = useCallback(async () => {
    try {
      const data = await request<{ communications: Communication[] }>(
        API,
        'GET',
      );
      setItems(data.communications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!composing || !form.send_email) return;
    const timer = setTimeout(() => {
      request<{ html: string }>(`${API}/preview`, 'POST', {
        title: form.title,
        email_body: form.email_body,
      })
        .then((data) => setPreviewHtml(data.html))
        .catch(() => setPreviewHtml(''));
    }, 400);
    return () => clearTimeout(timer);
  }, [composing, form.send_email, form.title, form.email_body]);

  function startNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
    setComposing(true);
  }

  function open(communication: Communication) {
    setEditing(communication);
    setForm(toForm(communication));
    setError('');
    setNotice('');
    setComposing(true);
  }

  function close() {
    setComposing(false);
    setEditing(null);
    setConfirmCounts(null);
  }

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function persist(): Promise<Communication> {
    const saved = editing
      ? await request<Communication>(`${API}/${editing.id}`, 'PATCH', form)
      : await request<Communication>(API, 'POST', form);
    setEditing(saved);
    void loadList();
    return saved;
  }

  async function run(kind: Exclude<Busy, null>, action: () => Promise<void>) {
    setBusy(kind);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.');
    } finally {
      setBusy(null);
    }
  }

  const handleSave = () =>
    run('save', async () => {
      await persist();
      setNotice('Rascunho salvo.');
    });

  const handleTest = () =>
    run('test', async () => {
      const saved = await persist();
      const result = await request<{
        email: 'sent' | 'failed' | null;
        push_devices: number | null;
      }>(`${API}/${saved.id}/send-test`, 'POST');
      const parts: string[] = [];
      if (result.email === 'sent') parts.push('e-mail enviado para você');
      if (result.email === 'failed') parts.push('falha ao enviar o e-mail');
      if (result.push_devices !== null)
        parts.push(
          result.push_devices > 0
            ? `push enviado para ${result.push_devices} aparelho(s) seu(s)`
            : 'nenhum aparelho seu com push registrado',
        );
      setNotice(`Teste: ${parts.join('; ')}.`);
    });

  const handleOpenConfirm = () =>
    run('send', async () => {
      const saved = await persist();
      setConfirmCounts(
        await request<RecipientCounts>(`${API}/${saved.id}/recipients`, 'GET'),
      );
    });

  const handleConfirmSend = () =>
    run('send', async () => {
      if (!editing || !confirmCounts) return;
      const sent = await request<Communication>(
        `${API}/${editing.id}/send`,
        'POST',
        { confirm_recipients: confirmCounts },
      );
      setConfirmCounts(null);
      setEditing(sent);
      setNotice(
        `Enviado. E-mails: ${sent.email_sent} enviados, ${sent.email_failed} falhas. Push: ${sent.push_users} pessoas.`,
      );
      void loadList();
    });

  const dialogBusy = busy === 'send' && confirmCounts !== null;

  if (!composing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Comunicados</CardTitle>
          <Button
            onClick={startNew}
            className="gradient-brand text-white rounded-xl font-semibold"
          >
            Novo comunicado
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          {loadingList && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {!loadingList && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum comunicado ainda.
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className="w-full text-left flex items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:bg-accent transition-smooth"
            >
              <span className="min-w-0">
                <span className="block font-medium truncate">{item.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {item.status === 'sent'
                    ? `E-mail ${item.email_sent} · Push ${item.push_users} pessoas`
                    : [item.send_email && 'E-mail', item.send_push && 'Push']
                        .filter(Boolean)
                        .join(' + ')}
                </span>
              </span>
              <Badge variant={item.status === 'sent' ? 'secondary' : 'outline'}>
                {STATUS_LABEL[item.status]}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-heading text-lg">
          {readOnly ? 'Comunicado enviado' : 'Comunicado'}
        </CardTitle>
        <Button variant="outline" className="rounded-xl" onClick={close}>
          Voltar
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="comm-title">
            Título (interno e destaque do e-mail)
          </Label>
          <Input
            id="comm-title"
            value={form.title}
            disabled={readOnly}
            maxLength={120}
            onChange={(e) => setField('title', e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.send_email}
              disabled={readOnly}
              onCheckedChange={(value) => setField('send_email', value)}
            />
            E-mail
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.send_push}
              disabled={readOnly}
              onCheckedChange={(value) => setField('send_push', value)}
            />
            Push
          </label>
        </div>

        {form.send_email && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="comm-subject">Assunto do e-mail</Label>
              <Input
                id="comm-subject"
                value={form.email_subject}
                disabled={readOnly}
                maxLength={150}
                onChange={(e) => setField('email_subject', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comm-email-body">Texto do e-mail</Label>
              <textarea
                id="comm-email-body"
                value={form.email_body}
                disabled={readOnly}
                maxLength={5000}
                rows={8}
                onChange={(e) => setField('email_body', e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Linha em branco separa parágrafos. Use **negrito** e
                [texto](https://link) para links.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Pré-visualização do e-mail</Label>
              <iframe
                title="Pré-visualização do e-mail"
                sandbox=""
                srcDoc={previewHtml}
                className="w-full h-96 rounded-xl border bg-white"
              />
            </div>
          </div>
        )}

        {form.send_push && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="comm-push-title">Título do push</Label>
                <CharHint
                  length={form.push_title.length}
                  hint={PUSH_TITLE_HINT}
                />
              </div>
              <Input
                id="comm-push-title"
                value={form.push_title}
                disabled={readOnly}
                maxLength={65}
                onChange={(e) => setField('push_title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="comm-push-body">Texto do push</Label>
                <CharHint
                  length={form.push_body.length}
                  hint={PUSH_BODY_HINT}
                />
              </div>
              <textarea
                id="comm-push-body"
                value={form.push_body}
                disabled={readOnly}
                maxLength={178}
                rows={3}
                onChange={(e) => setField('push_body', e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-sm bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg">
            {notice}
          </p>
        )}

        {readOnly ? (
          <p className="text-sm text-muted-foreground">
            Enviado: e-mail {editing?.email_sent} ok / {editing?.email_failed}{' '}
            falhas · push para {editing?.push_users} pessoas (
            {editing?.push_devices} aparelhos).
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={busy !== null}
              onClick={handleSave}
            >
              <ButtonLabel
                busy={busy === 'save'}
                idle="Salvar rascunho"
                loading="Salvando..."
              />
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={busy !== null}
              onClick={handleTest}
            >
              <ButtonLabel
                busy={busy === 'test'}
                idle="Enviar teste para mim"
                loading="Enviando teste..."
              />
            </Button>
            <Button
              className="gradient-brand text-white rounded-xl font-semibold"
              disabled={busy !== null}
              onClick={handleOpenConfirm}
            >
              <ButtonLabel
                busy={busy === 'send' && confirmCounts === null}
                idle="Enviar para todos"
                loading="Calculando..."
              />
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog
        open={confirmCounts !== null}
        onOpenChange={(value) => {
          if (!value && !dialogBusy) setConfirmCounts(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar envio</DialogTitle>
            <DialogDescription>
              Esta ação enviará &ldquo;{form.title}&rdquo; para{' '}
              {form.send_email && (
                <strong>{confirmCounts?.email} pessoas por e-mail</strong>
              )}
              {form.send_email && form.send_push && ' e '}
              {form.send_push && (
                <strong>{confirmCounts?.push} pessoas por push</strong>
              )}
              . Não é possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={dialogBusy}
              onClick={() => setConfirmCounts(null)}
            >
              Cancelar
            </Button>
            <Button
              className="gradient-brand text-white rounded-xl font-semibold"
              disabled={dialogBusy}
              onClick={handleConfirmSend}
            >
              <ButtonLabel
                busy={dialogBusy}
                idle="Confirmar envio"
                loading="Enviando..."
              />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
