import { useCallback, useState } from "react";
import { message } from "antd";
import type { ReportLatestJSON } from "../types/report";
import { fetchReportLast } from "../http/reportApi.ts";

function isReportLatestJSON(x: unknown): x is ReportLatestJSON {
    if (!x || typeof x !== "object") return false;
    const obj = x as { generated_at?: unknown; devices?: unknown };
    return typeof obj.generated_at === "string" && Array.isArray(obj.devices);
}

export function useReportLatests() {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<ReportLatestJSON | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchReportLast();

            if (!isReportLatestJSON(data)) {
                console.error("Bad shape returned by API:", data);
                setReport(null);
                message.error("Réponse API inattendue");
                return;
            }

            setReport(data);
            message.success("Report latest chargé");
        } catch (e) {
            console.error(e);
            message.error("Impossible de charger /timeseries/report/latest");
        } finally {
            setLoading(false);
        }
    }, []);

    return { report, loading, load, setReport };
}