// src/hooks/useSimulation.ts
import { useCallback, useState } from "react";
import { message } from "antd";

import type { TimeSeriesJSON } from "../types/tstransports";
import type { BulkSimulFormValues } from "../components/BulkSimulForm";
import { postBulkSimulation } from "../http/simulationApi";

export function useSimulation() {
    const [tsData, setTsData] = useState<TimeSeriesJSON | null>(null);
    const [tsMemId, setTsMemId] = useState<number | null>(null);

    const runSimulation = useCallback(async (values: BulkSimulFormValues) => {
        const payload = {
            name: values.name,
            start: values.start.toISOString(),
            periodSeconds: values.periodSeconds,
            n: values.n,
            mean: values.mean,
            stdDev: values.stdDev,
            jitter: values.jitter * 1_000_000_000,
        };

        try {
            const data = await postBulkSimulation(payload);
            setTsData(data);
            setTsMemId(data.id);
            message.success("Simulation loaded successfully");
        } catch (err) {
            console.error("❌ bulksimul error:", err);
            message.error("Erreur backend (bulksimul)");
        }
    }, []);

    return { tsData, tsMemId, runSimulation };
}