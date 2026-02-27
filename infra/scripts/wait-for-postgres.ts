import { Client } from 'pg';

async function waitForPostgres() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  let retries = 0;
  const maxRetries = 20;

  while (retries < maxRetries) {
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('PostgreSQL pronto.');
      process.exit(0);
    } catch {
      retries++;
      console.log(
        `PostgreSQL ainda não está pronto. Tentativa ${retries}/${maxRetries}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error('PostgreSQL não ficou pronto a tempo.');
  process.exit(1);
}

waitForPostgres();
