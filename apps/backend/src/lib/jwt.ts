import { jwtVerify, SignJWT } from 'jose';

import { env } from '../config/env.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = 'mahafeth-api';
const AUDIENCE = 'mahafeth-admin';

export async function signAccessToken(userId: string) {
  return new SignJWT()
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

/** Returns the user id and issue time (seconds), or `null` for any invalid/expired token. */
export async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; issuedAt: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
      requiredClaims: ['sub', 'iat', 'exp'],
    });
    return payload.sub && payload.iat ? { userId: payload.sub, issuedAt: payload.iat } : null;
  } catch {
    return null;
  }
}
