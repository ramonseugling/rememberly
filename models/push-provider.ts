export type PushMessage = {
  to: string;
  title: string;
  body: string;
  channelId: 'reminders';
  data: Record<string, string>;
};
export type SendResult =
  | { status: 'accepted'; id: string }
  | { status: 'rejected'; code: string; retryable: boolean }
  | { status: 'unknown' };
export type ReceiptResult =
  | { status: 'ok' }
  | { status: 'error'; code: string }
  | { status: 'pending' };
export interface PushProvider {
  send(message: PushMessage): Promise<SendResult>;
  sendBatch?(messages: PushMessage[]): Promise<SendResult[]>;
  receipts(ids: string[]): Promise<Record<string, ReceiptResult>>;
}
const codes = new Set([
  'DeviceNotRegistered',
  'MessageTooBig',
  'MessageRateExceeded',
  'MismatchSenderId',
  'InvalidCredentials',
]);
function safeCode(code: unknown) {
  return typeof code === 'string' && codes.has(code) ? code : 'ProviderError';
}
async function request(path: 'send' | 'getReceipts', body: unknown) {
  // Fixed HTTPS origin; CLI EXPO_TOKEN is deliberately never used by this transport.
  return fetch(`https://exp.host/--/api/v2/push/${path}`, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(4000),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(process.env.EXPO_PUSH_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.EXPO_PUSH_ACCESS_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
  });
}
function ticketResult(
  ticket:
    | { status?: unknown; id?: unknown; details?: { error?: unknown } }
    | undefined,
): SendResult {
  if (
    ticket?.status === 'ok' &&
    typeof ticket.id === 'string' &&
    ticket.id.length <= 200
  )
    return { status: 'accepted', id: ticket.id };
  if (ticket?.status === 'error') {
    const code = safeCode(ticket.details?.error);
    return {
      status: 'rejected',
      code,
      retryable: code === 'MessageRateExceeded',
    };
  }
  return { status: 'unknown' };
}
async function sendBatch(messages: PushMessage[]): Promise<SendResult[]> {
  if (!messages.length) return [];
  if (messages.length > 100) throw new Error('Push batch limit exceeded.');
  try {
    const response = await request('send', messages);
    if (response.status === 429)
      return messages.map(() => ({
        status: 'rejected',
        code: 'RateLimited',
        retryable: true,
      }));
    if (!response.ok) return messages.map(() => ({ status: 'unknown' }));
    const json = await response.json();
    if (Array.isArray(json.data) && json.data.length === messages.length)
      return json.data.map(ticketResult);
  } catch {
    /* A timed-out send may already have reached the provider. */
  }
  return messages.map(() => ({ status: 'unknown' }));
}
export const expoProvider: PushProvider = {
  async send(message) {
    return (await sendBatch([message]))[0];
  },
  sendBatch,
  async receipts(ids) {
    const response = await request('getReceipts', { ids });
    if (!response.ok) throw new Error('Push receipt request failed.');
    const json = await response.json();
    const result: Record<string, ReceiptResult> = {};
    for (const id of ids) {
      const receipt = json.data?.[id];
      result[id] =
        receipt?.status === 'ok'
          ? { status: 'ok' }
          : receipt?.status === 'error'
            ? { status: 'error', code: safeCode(receipt.details?.error) }
            : { status: 'pending' };
    }
    return result;
  },
};
