import { useMemo, useState } from "react";
import { api } from "../http/axiosApi.ts";
import { useAuth } from "../auth/AuthContext";
import {clearTokens, decodeJwt} from "../auth/tokenStore";
import { getRoles } from "../auth/permissions";

type PingResponse = {
    ok: boolean;
    message?: string;
};

function safeString(v: unknown): string {
    return typeof v === "string" ? v : "";
}
function hardResetAuth() {
    clearTokens();
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("kc_cb_handled:")) sessionStorage.removeItem(k);
    }
    window.location.assign("/timeseries/restricted");
}
export default function RestrictedHome() {
    const { tokens, isAuthenticated, logout, getValidAccessToken } = useAuth();

    const [pingResult, setPingResult] = useState<string>("");
    const [busy, setBusy] = useState<boolean>(false);

    const tokenInfo = useMemo(() => {
        if (!tokens?.accessToken) return null;
        const payload = decodeJwt(tokens.accessToken);
        if (!payload) return null;

        const username =
            safeString(payload.preferred_username) ||
            safeString(payload["email"]) ||
            safeString(payload["sub"]);

        const roles = getRoles(tokens.accessToken, import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string);

        return {
            username,
            exp: typeof payload.exp === "number" ? new Date(payload.exp * 1000).toISOString() : "",
            roles,
        };
    }, [tokens?.accessToken]);

    async function handlePing() {
        setBusy(true);
        setPingResult("");
        try {
            // Juste pour montrer que getValidAccessToken marche aussi
            const t = await getValidAccessToken();
            if (!t) {
                setPingResult("No valid access token (should not happen in restricted route).");
                return;
            }

            // Exemple: endpoint backend à protéger (à adapter)
            const res = await api.get<PingResponse>("/api/ping");
            setPingResult(JSON.stringify(res.data, null, 2));
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setPingResult(`Ping failed: ${msg}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
            <h2>Restricted Home</h2>

            <div style={{ marginBottom: 16 }}>
                <strong>isAuthenticated:</strong> {String(isAuthenticated)}
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>User:</strong> {tokenInfo?.username || "(unknown)"} <br />
                <strong>Token exp:</strong> {tokenInfo?.exp || "(unknown)"} <br />
                <strong>Roles:</strong>{" "}
                {tokenInfo?.roles?.length ? tokenInfo.roles.join(", ") : "(none / not in token)"}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <button onClick={handlePing} disabled={busy}>
                    {busy ? "Calling..." : "Call /api/ping"}
                </button>

                <button onClick={logout}>
                    Logout
                </button>

                <button onClick={hardResetAuth} style={{ color: "red" }}>
                    Hard reset auth
                </button>
            </div>

            <div>
                <strong>Result:</strong>
                <pre
                    style={{
                        background: "#111",
                        color: "#eee",
                        padding: 12,
                        borderRadius: 8,
                        overflowX: "auto",
                        marginTop: 8,
                    }}
                >
{pingResult || "(no call yet)"}
            </pre>
            </div>
        </div>
    );
}