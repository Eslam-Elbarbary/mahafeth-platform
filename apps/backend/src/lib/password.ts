import { compare, hash } from 'bcryptjs';

const COST = 12;

// Compared against when the user does not exist, so login timing doesn't reveal valid emails.
let dummyHash: Promise<string> | undefined;

export const hashPassword = (plain: string) => hash(plain, COST);

export async function verifyPassword(plain: string, passwordHash: string | undefined) {
  if (passwordHash) return compare(plain, passwordHash);
  dummyHash ??= hash('timing-equalizer', COST);
  await compare(plain, await dummyHash);
  return false;
}
