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
      console.log('PostgreSQL is ready.');
      process.exit(0);
    } catch {
      retries++;
      console.log(
        `PostgreSQL not ready yet. Attempt ${retries}/${maxRetries}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error('PostgreSQL did not become ready in time.');
  process.exit(1);
}

waitForPostgres();
