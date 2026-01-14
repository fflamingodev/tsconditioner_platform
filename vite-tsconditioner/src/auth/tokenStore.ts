// src/auth/tokenStore.ts
// Lecture/écriture/suppression des tokens (storage), + helpers (isExpired, etc.).
export type AuthTokens = {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt: number; // epoch ms
};

const KEY = "auth_tokens_v1";

export function saveTokens(t: AuthTokens): void {
    localStorage.setItem(KEY, JSON.stringify(t));
}

export function loadTokens(): AuthTokens | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as AuthTokens;
        if (!parsed?.accessToken || !parsed?.expiresAt) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearTokens(): void {
    localStorage.removeItem(KEY);
}

function base64UrlDecode(input: string): string {
    const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
    const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
    return decodeURIComponent(
        atob(b64)
            .split("")
            .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("")
    );
}

export type JwtPayload = Record<string, unknown> & {
    exp?: number; // seconds
    iat?: number;
    iss?: string;
    aud?: string | string[];
    sub?: string;
    preferred_username?: string;
};

export function decodeJwt(token: string): JwtPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        const json = base64UrlDecode(parts[1]);
        return JSON.parse(json) as JwtPayload;
    } catch {
        return null;
    }
}

export function getTokenExpMs(accessToken: string): number | null {
    const p = decodeJwt(accessToken);
    if (!p?.exp) return null;
    return p.exp * 1000;
}

export function isAccessTokenExpired(accessToken: string, skewSeconds = 20): boolean {
    const expMs = getTokenExpMs(accessToken);
    if (!expMs) return true;
    const now = Date.now();
    return now >= expMs - skewSeconds * 1000;
}