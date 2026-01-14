// src/http/reportApi.ts
import { api } from "./axiosApi.ts";
import type { ReportLatestJSON } from "../types/report";

export async function fetchReportLast(): Promise<ReportLatestJSON> {
    const res = await api.get<ReportLatestJSON>("report/latest");
    return res.data;
}

export async function refreshDevicesDB(): Promise<{ ok: boolean }> {
    const res = await api.get<{ ok: boolean }>("refreshdevices");
    return res.data;
}