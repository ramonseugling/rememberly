import bcrypt from 'bcryptjs';

const ROUNDS = process.env.NODE_ENV === 'production' ? 14 : 1;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

async function compare(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const password = { hash, compare };

export default password;
