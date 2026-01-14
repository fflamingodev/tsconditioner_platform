// src/auth/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForTokens } from "./keycloak.ts";

function consumePostLoginPath(): string | null {
    const k = "post_login_path";
    const v = sessionStorage.getItem(k);
    if (v) sessionStorage.removeItem(k);
    return v;
}

export function AuthCallback() {
    const nav = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const url = new URL(window.location.href);
    const err = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const earlyError = err ?? (!code || !state ? "Missing code/state in callback." : null);

    useEffect(() => {
        if (earlyError) return;
        if (!code || !state) return;

        const handledKey = `kc_cb_handled:${code}:${state}`;

        const goBackOrDefault = () => {
            const back = consumePostLoginPath();
            nav(back ?? "/restricted", { replace: true });
        };

        if (sessionStorage.getItem(handledKey) === "1") {
            goBackOrDefault();
            return;
        }

        sessionStorage.setItem(handledKey, "1");

        let cancelled = false;

        void (async () => {
            try {
                await exchangeCodeForTokens(code, state);
                if (!cancelled) goBackOrDefault();
            } catch (e) {
                if (!cancelled) {
                    sessionStorage.removeItem(handledKey);
                    setError(e instanceof Error ? e.message : "Auth callback failed.");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [earlyError, code, state, nav]);

    const renderError = error ?? earlyError;

    return (
        <div style={{ padding: 24 }}>
            {renderError ? (
                <>
                    <h3>Authentication error</h3>
                    <pre>{renderError}</pre>
                </>
            ) : (
                <div>Signing you in…</div>
            )}
        </div>
    );
}