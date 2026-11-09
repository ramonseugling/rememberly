import { spawn } from 'node:child_process';
import { Client } from 'pg';

process.loadEnvFile('.env.development');

function toTestUrl(connectionString: string) {
  const url = new URL(connectionString);
  if (!url.pathname.endsWith('_test')) {
    url.pathname = `${url.pathname}_test`;
  }
  return url;
}

async function ensureDatabase(testUrl: URL) {
  const admin = new URL(testUrl.toString());
  admin.pathname = '/postgres';
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const name = decodeURIComponent(testUrl.pathname.slice(1));
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [name],
    );
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
      console.log(`Created test database ${name}.`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error('Usage: with-test-db <command> [args...]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in .env.development.');
    process.exit(1);
  }

  const testUrl = toTestUrl(process.env.DATABASE_URL);
  await ensureDatabase(testUrl);

  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
