import { createHash, randomBytes } from 'crypto';

/**
 * Generates a high-entropy opaque token (for refresh tokens / password
 * reset tokens). Returned to the client as plaintext — only its hash
 * is ever stored in the database.
 */
export function generateOpaqueToken(bytes = 40): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Deterministic hash for opaque tokens — lets us look them up via
 * `findUnique({ where: { token: hashToken(plaintext) } })` while never
 * persisting the plaintext value itself.
 *
 * SHA-256 (not bcrypt) is used deliberately here: refresh/reset tokens
 * are already high-entropy random strings (not low-entropy passwords),
 * so a deterministic hash is appropriate and required for the unique
 * index + direct lookup.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
