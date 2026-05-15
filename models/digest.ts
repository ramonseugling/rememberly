import email from 'models/email';
import systemLog from 'models/system-log';

export interface DigestWindow {
  start: Date;
  end: Date;
}

function yesterdayBrtWindow(now: Date = new Date()): DigestWindow {
  const todayStartBrtInUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      3,
      0,
      0,
    ),
  );
  if (now.getUTCHours() < 3) {
    todayStartBrtInUtc.setUTCDate(todayStartBrtInUtc.getUTCDate() - 1);
  }
  const end = todayStartBrtInUtc;
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 1);
  return { start, end };
}

function formatBrtDateLabel(window: DigestWindow): string {
  const labelDate = new Date(window.start);
  labelDate.setUTCHours(labelDate.getUTCHours() + 3);
  const dd = String(labelDate.getUTCDate()).padStart(2, '0');
  const mm = String(labelDate.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = labelDate.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseRecipients(): string[] {
  const raw = process.env.DIGEST_RECIPIENTS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function sendDailyDigest() {
  const start_time = Date.now();
  const recipients = parseRecipients();
  const window = yesterdayBrtWindow();
  const dateLabel = formatBrtDateLabel(window);

  if (recipients.length === 0) {
    await systemLog.recordCronRun({
      job_name: 'daily_digest',
      status: 'partial',
      metrics: { skipped: 'no_recipients', dateLabel },
      duration_ms: Date.now() - start_time,
    });
    return { skipped: 'no_recipients' as const, dateLabel };
  }

  const [signups, logins, eventsCreated, errors, cronRuns, totals] =
    await Promise.all([
      systemLog.countSignupsBetween(window.start, window.end),
      systemLog.countLoginsBetween(window.start, window.end),
      systemLog.countEventsCreatedBetween(window.start, window.end),
      systemLog.countErrorsBetween(window.start, window.end),
      systemLog.getCronRunsBetween(window.start, window.end),
      systemLog.getCurrentTotals(),
    ]);

  let status: 'success' | 'failed' = 'success';
  try {
    await email.sendDailyDigestEmail({
      to: recipients,
      data: {
        dateLabel,
        signups,
        logins,
        eventsCreated,
        totals,
        cronRuns: cronRuns.map((r) => ({
          job_name: r.job_name,
          status: r.status,
          metrics: r.metrics,
          duration_ms: r.duration_ms,
        })),
        errors,
      },
    });
  } catch (err) {
    status = 'failed';
    await systemLog.recordCronRun({
      job_name: 'daily_digest',
      status,
      metrics: { error: String(err), dateLabel },
      duration_ms: Date.now() - start_time,
    });
    throw err;
  }

  await systemLog.recordCronRun({
    job_name: 'daily_digest',
    status,
    metrics: {
      dateLabel,
      recipients: recipients.length,
      signups: signups.total,
      logins,
      events_created: eventsCreated.total,
      errors: errors.total,
    },
    duration_ms: Date.now() - start_time,
  });

  return { sent: true, dateLabel, recipients: recipients.length };
}

const digest = { sendDailyDigest, yesterdayBrtWindow, formatBrtDateLabel };

export default digest;
