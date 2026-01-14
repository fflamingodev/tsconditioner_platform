// src/hooks/useRestrictedTest.ts
import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { fetchRestrictedTest, type TestResponse } from "../http/restrictedApi";

type UseRestrictedTestState = {
    data: TestResponse | null;
    loading: boolean;
    error: string | null;
    reload: () => Promise<void>;
};

function isAxiosError(e: unknown): e is AxiosError {
    return typeof e === "object" && e !== null && "isAxiosError" in e;
}

export function useRestrictedTest(): UseRestrictedTestState {
    const [data, setData] = useState<TestResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const d = await fetchRestrictedTest();
            setData(d);
        } catch (e: unknown) {
            if (isAxiosError(e)) {
                const status = e.response?.status;

                if (status === 401) {
                    // typiquement: pas de JWT, JWT expiré/invalid
                    setError("Accès non autorisé (JWT manquant, invalide ou expiré).");
                } else if (status === 403) {
                    // JWT OK mais permission insuffisante côté backend
                    setError("Accès interdit (permissions insuffisantes).");
                } else {
                    setError("Erreur serveur.");
                }
            } else {
                setError("Erreur inattendue.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    return { data, loading, error, reload };
}