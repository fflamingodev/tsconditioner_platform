// src/http/simulationApi.ts
import { api } from "./axiosApi.ts";
import type { TimeSeriesJSON } from "../types/tstransports";

export type BulkSimulPayload = {
    name: string;
    start: string;
    periodSeconds: number;
    n: number;
    mean: number;
    stdDev: number;
    jitter: number;
};

export async function postBulkSimulation(payload: BulkSimulPayload): Promise<TimeSeriesJSON> {
    const res = await api.post<TimeSeriesJSON>("bulksimul", payload);
    return res.data;
}