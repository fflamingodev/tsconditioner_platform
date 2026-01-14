// src/http/runtimeConfig.ts
export type RuntimeConfig = {
    authDisabled: boolean;
    appBasename: string; // normalisé: "/webtimeseries" (sans trailing slash)
    kcBaseUrl: string;
    kcRealm: string;
    kcClientId: string;
};

let cached: RuntimeConfig | null = null;
let inFlight: Promise<RuntimeConfig> | null = null;

function normalizeBasename(input: string): string {
    let s = (input ?? "").trim();
    if (!s || s === "/") return "";
    if (!s.startsWith("/")) s = "/" + s;
    s = s.replace(/\/+$/, "");
    return s === "/" ? "" : s;
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
    if (cached) return cached;
    if (inFlight) return inFlight;

    inFlight = (async () => {
        const res = await fetch("/timeseries/config", {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`Failed to load runtime config: ${res.status} ${txt}`);
        }

        const raw = (await res.json()) as {
            authDisabled: boolean;
            appBasename: string;
            kcBaseUrl: string;
            kcRealm: string;
            kcClientId: string;
        };

        cached = {
            authDisabled: !!raw.authDisabled,
            appBasename: normalizeBasename(raw.appBasename),
            kcBaseUrl: raw.kcBaseUrl,
            kcRealm: raw.kcRealm,
            kcClientId: raw.kcClientId,
        };
        return cached;
    })();

    return inFlight;
}

export function getRuntimeConfigSync(): RuntimeConfig {
    if (!cached) throw new Error("Runtime config not loaded yet.");
    return cached;
}