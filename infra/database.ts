import { Client, Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSSLValues(),
});

async function query(text: string, values?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, values);
  } finally {
    client.release();
  }
}

async function getNewClient(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: getSSLValues(),
  });
  await client.connect();
  return client;
}

function getSSLValues() {
  if (process.env.POSTGRES_CA) {
    return { ca: process.env.POSTGRES_CA };
  }

  return process.env.NODE_ENV === 'production' ? true : false;
}

const database = { query, getNewClient };

export default database;
