import type { PartialUser, UserRole } from "./types";

interface AccessClaims {
  sub?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

export function decodeAccessToken(token: string): PartialUser | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as AccessClaims;
    if (!claims.sub || !claims.role) return null;
    return { id: claims.sub, role: claims.role };
  } catch {
    return null;
  }
}
