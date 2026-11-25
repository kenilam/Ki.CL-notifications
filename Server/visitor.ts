import { decodeJwt } from 'jose';

/** The visitor's ID from the access token the gateway forwards. The gateway verified it, so it is only read here. */
export function ownerOf(cookieHeader: string | null | undefined): string | null {
  const token = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('access_token='))
    ?.slice('access_token='.length);

  if (!token) {
    return null;
  }

  try {
    return decodeJwt(decodeURIComponent(token)).sub ?? null;
  } catch {
    return null;
  }
}
