// src/auth/keycloak.ts
import {saveTokens, type AuthTokens, decodeJwt} from "./tokenStore.ts";

const KC_BASE_URL = import.meta.env.VITE_KEYCLOAK_BASE_URL as string;
const KC_REALM = import.meta.env.VITE_KEYCLOAK_REALM as string;
const KC_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string;
const APP_BASENAME = (import.meta.env.VITE_APP_BASENAME as string) ?? "";

// Doit matcher tokenStore.ts
const AUTH_TOKENS_KEY = "auth_tokens_v1";

// Flow keys
const STATE_KEY = "kc_state_v1";
const VERIFIER_KEY = "kc_pkce_verifier_v1";
const CB_HANDLED_PREFIX = "kc_cb_handled_v1:";

function realmUrl(): string {
    return `${KC_BASE_URL.replace(/\/$/, "")}/realms/${encodeURIComponent(KC_REALM)}`;
}
function authEndpoint(): string {
    return `${realmUrl()}/protocol/openid-connect/auth`;
}
function tokenEndpoint(): string {
    return `${realmUrl()}/protocol/openid-connect/token`;
}
function logoutEndpoint(): string {
    return `${realmUrl()}/protocol/openid-connect/logout`;
}
function callbackUrl(): string {
    return `${window.location.origin}${APP_BASENAME}/auth/callback`;
}

// ----- PKCE helpers -----
function randomString(bytes = 32): string {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function base64UrlEncode(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let str = "";
    for (const b of bytes) str += String.fromCharCode(b);
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(input: string): Promise<ArrayBuffer> {
    const enc = new TextEncoder().encode(input);
    return crypto.subtle.digest("SHA-256", enc);
}

function readSavedTokens(): AuthTokens | null {
    const raw = localStorage.getItem(AUTH_TOKENS_KEY);
    if (!raw) return null;
    try {
        const t = JSON.parse(raw) as AuthTokens;
        if (!t?.accessToken || !t?.expiresAt) return null;
        return t;
    } catch {
        return null;
    }
}

export function startLoginRedirect(): void {
    const state = randomString(16);
    const verifier = randomString(32);

    // Session-only: évite de “rester coincé” entre tentatives
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(VERIFIER_KEY, verifier);

    void (async () => {
        const challenge = base64UrlEncode(await sha256(verifier));

        const params = new URLSearchParams({
            client_id: KC_CLIENT_ID,
            redirect_uri: callbackUrl(),
            response_type: "code",
            scope: "openid profile email",
            state,
            code_challenge: challenge,
            code_challenge_method: "S256",
        });

        window.location.assign(`${authEndpoint()}?${params.toString()}`);
    })();
}

export type TokenResponse = {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number; // seconds
};

export async function exchangeCodeForTokens(code: string, returnedState: string): Promise<AuthTokens> {
    // Idempotence: empêche double échange (StrictMode / reload / back-forward)
    const handledKey = `${CB_HANDLED_PREFIX}${code}:${returnedState}`;
    if (sessionStorage.getItem(handledKey) === "1") {
        const existing = readSavedTokens();
        if (existing) return existing;
        throw new Error("Auth callback already handled, but no tokens found.");
    }
    sessionStorage.setItem(handledKey, "1");

    const expectedState = sessionStorage.getItem(STATE_KEY);
    const verifier = sessionStorage.getItem(VERIFIER_KEY);

    // Valider AVANT nettoyage
    if (!expectedState || expectedState !== returnedState) {
        sessionStorage.removeItem(handledKey);
        throw new Error("Invalid state (CSRF protection).");
    }
    if (!verifier) {
        sessionStorage.removeItem(handledKey);
        throw new Error("Missing PKCE verifier.");
    }

    // Nettoyage après validation
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KC_CLIENT_ID,
        code,
        redirect_uri: callbackUrl(),
        code_verifier: verifier,
    });

    const res = await fetch(tokenEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        const txt = await res.text();
        // autorise un retry si l'échange échoue
        sessionStorage.removeItem(handledKey);
        throw new Error(`Token exchange failed: ${res.status} ${txt}`);
    }

    const tr = (await res.json()) as TokenResponse;

    const expiresAt = Date.now() + tr.expires_in * 1000;
    const tokens: AuthTokens = {
        accessToken: tr.access_token,
        refreshToken: tr.refresh_token,
        idToken: tr.id_token,
        expiresAt,
    };
    const decoded = decodeJwt(tokens.accessToken);
    console.log("KC access_token decoded (pretty):\n", JSON.stringify(decoded, null, 2));
    console.log("aud raw:", decoded?.aud, "typeof:", typeof decoded?.aud);
    console.log("azp:", decoded?.azp);
    console.log("iss:", decoded?.iss);
    console.log("resource_access keys:", decoded?.resource_access ? Object.keys(decoded.resource_access) : null);
    saveTokens(tokens);
    return tokens;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: KC_CLIENT_ID,
        refresh_token: refreshToken,
    });

    const res = await fetch(tokenEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Refresh failed: ${res.status} ${txt}`);
    }

    const tr = (await res.json()) as TokenResponse;

    const expiresAt = Date.now() + tr.expires_in * 1000;
    const tokens: AuthTokens = {
        accessToken: tr.access_token,
        refreshToken: tr.refresh_token ?? refreshToken,
        idToken: tr.id_token,
        expiresAt,
    };

    saveTokens(tokens);
    return tokens;
}

export function startLogoutRedirect(idTokenHint?: string): void {
    const params = new URLSearchParams({
        client_id: KC_CLIENT_ID,
        post_logout_redirect_uri: `${window.location.origin}${APP_BASENAME}/`,
    });
    if (idTokenHint) params.set("id_token_hint", idTokenHint);

    window.location.assign(`${logoutEndpoint()}?${params.toString()}`);
}