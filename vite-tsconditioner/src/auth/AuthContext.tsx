// src/auth/AuthContext.tsx
// Source de vérité côté UI : état isAuthenticated, tokens, fonctions login(), logout(), getValidAccessToken().
// utilise keycloak.ts. On va quitter l'app React pour être avec keycloak
/*
Au démarrage de l’app React (premier render)
	•	tokens vaut null (state initial).
	•	isAuthenticated vaut donc false (car !!tokens = false).

Ensuite seulement, ton useEffect(() => setTokens(loadTokens()), []) se déclenche :
	•	Il lit le storage (localStorage / sessionStorage selon ton tokenStore.ts)
	•	Si des tokens existent → setTokens(...) → re-render
	•	Sinon → tokens reste null.

👉 Conclusion : au tout début, pendant un court instant, l’app peut croire que
l’utilisateur n’est pas loggué, puis se “corriger” après loadTokens().
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { loadTokens, clearTokens, isAccessTokenExpired, type AuthTokens } from "./tokenStore.ts";
import { refreshTokens, startLoginRedirect, startLogoutRedirect } from "./keycloak.ts";

type AuthState = {
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
    getValidAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [tokens, setTokens] = useState<AuthTokens | null>(() => loadTokens());

    const logout = useCallback(() => {
        const current = loadTokens();
        clearTokens();
        setTokens(null);
        // optionnel: déconnexion côté Keycloak
        if (current?.idToken) startLogoutRedirect(current.idToken);
    }, []);

    const login = useCallback(() => {
        startLoginRedirect();
    }, []);

    const getValidAccessToken = useCallback(async (): Promise<string | null> => {
        const t = tokens ?? loadTokens();
        if (!t) return null;

        if (!isAccessTokenExpired(t.accessToken)) {
            return t.accessToken;
        }

        if (!t.refreshToken) {
            return null;
        }

        try {
            const nt = await refreshTokens(t.refreshToken);
            setTokens(nt);
            return nt.accessToken;
        } catch {
            clearTokens();
            setTokens(null);
            return null;
        }
    }, [tokens]);

    const value = useMemo<AuthState>(
        () => ({
            tokens,
            isAuthenticated: !!tokens && !isAccessTokenExpired(tokens.accessToken),
            login,
            logout,
            getValidAccessToken,
        }),
        [tokens, login, logout, getValidAccessToken]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}