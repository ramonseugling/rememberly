import database from 'infra/database';

export interface AdminStats {
  totalUsers: number;
  activeUsers30d: number;
  newUsers7d: number;
  newUsers30d: number;
  totalEvents: number;
  avgEventsPerUser: number;
  avgGroupsPerUser: number;
  avgAnnualEmailsPerUser: number;
  avgEventsWithReminderPerUser: number;
  usersWithNoEvents: number;
  usersWithNoEventsPercent: number;
  usersWithBirthdayPercent: number;
  usersViaGooglePercent: number;
  eventTypeBreakdown: { type: string; count: number }[];
  weeklySignups: { week: string; count: number }[];
  weeklyEventsCreated: { week: string; count: number }[];
}

async function getStats(): Promise<AdminStats> {
  const [
    overviewResult,
    eventTypeResult,
    weeklySignupsResult,
    weeklyEventsResult,
  ] = await Promise.all([
    database.query(`
      WITH user_event_counts AS (
        SELECT u.id, COUNT(e.id) AS event_count
        FROM users u
        LEFT JOIN events e ON e.user_id = u.id
        GROUP BY u.id
      ),
      user_reminder_counts AS (
        SELECT u.id, COUNT(e.id) AS reminder_count
        FROM users u
        LEFT JOIN events e ON e.user_id = u.id AND e.reminder_days_before > 0
        GROUP BY u.id
      ),
      user_group_counts AS (
        SELECT u.id, COUNT(gm.id) AS group_count
        FROM users u
        LEFT JOIN group_members gm ON gm.user_id = u.id
        GROUP BY u.id
      ),
      user_email_counts AS (
        SELECT
          u.id,
          uec.event_count + urc.reminder_count AS annual_emails
        FROM users u
        JOIN user_event_counts uec ON uec.id = u.id
        JOIN user_reminder_counts urc ON urc.id = u.id
      )
      SELECT
        (SELECT COUNT(*) FROM users)::int AS total_users,
        (
          SELECT COUNT(DISTINCT s.user_id)
          FROM sessions s
          WHERE s.created_at > NOW() - INTERVAL '30 days'
        )::int AS active_users_30d,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days')::int AS new_users_7d,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days')::int AS new_users_30d,
        (SELECT COUNT(*) FROM events)::int AS total_events,
        ROUND(AVG(uec.event_count), 2)::float AS avg_events_per_user,
        ROUND(AVG(ugc.group_count), 2)::float AS avg_groups_per_user,
        ROUND(AVG(uem.annual_emails), 2)::float AS avg_annual_emails_per_user,
        ROUND(AVG(urc.reminder_count), 2)::float AS avg_events_with_reminder_per_user,
        (SELECT COUNT(*) FROM user_event_counts WHERE event_count = 0)::int AS users_with_no_events,
        (SELECT COUNT(*) FROM users)::int AS total_for_pct,
        ROUND(
          100.0 * (SELECT COUNT(*) FROM users WHERE birth_day IS NOT NULL) /
          NULLIF((SELECT COUNT(*) FROM users), 0), 1
        )::float AS users_with_birthday_pct,
        ROUND(
          100.0 * (SELECT COUNT(*) FROM users WHERE password IS NULL) /
          NULLIF((SELECT COUNT(*) FROM users), 0), 1
        )::float AS users_via_google_pct
      FROM user_event_counts uec
      JOIN user_reminder_counts urc ON urc.id = uec.id
      JOIN user_group_counts ugc ON ugc.id = uec.id
      JOIN user_email_counts uem ON uem.id = uec.id
    `),
    database.query(`
      SELECT type, COUNT(*)::int AS count
      FROM events
      GROUP BY type
      ORDER BY count DESC
    `),
    database.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'DD/MM') AS week,
        COUNT(*)::int AS count
      FROM users
      WHERE created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `),
    database.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'DD/MM') AS week,
        COUNT(*)::int AS count
      FROM events
      WHERE created_at > NOW() - INTERVAL '8 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `),
  ]);

  const row = overviewResult.rows[0];

  return {
    totalUsers: row.total_users ?? 0,
    activeUsers30d: row.active_users_30d ?? 0,
    newUsers7d: row.new_users_7d ?? 0,
    newUsers30d: row.new_users_30d ?? 0,
    totalEvents: row.total_events ?? 0,
    avgEventsPerUser: row.avg_events_per_user ?? 0,
    avgGroupsPerUser: row.avg_groups_per_user ?? 0,
    avgAnnualEmailsPerUser: row.avg_annual_emails_per_user ?? 0,
    avgEventsWithReminderPerUser: row.avg_events_with_reminder_per_user ?? 0,
    usersWithNoEvents: row.users_with_no_events ?? 0,
    usersWithNoEventsPercent:
      row.total_for_pct > 0
        ? Math.round((row.users_with_no_events / row.total_for_pct) * 1000) / 10
        : 0,
    usersWithBirthdayPercent: row.users_with_birthday_pct ?? 0,
    usersViaGooglePercent: row.users_via_google_pct ?? 0,
    eventTypeBreakdown: eventTypeResult.rows,
    weeklySignups: weeklySignupsResult.rows,
    weeklyEventsCreated: weeklyEventsResult.rows,
  };
}

const admin = { getStats };

export default admin;
