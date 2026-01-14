// src/http/deviceDatasourceDetailsApi.ts
import { api } from "./axiosApi.ts";
import type { TimeSeriesJSON, DeviceJSON } from "../types/tstransports";

export type RemoteDataPayload = {
    device: string;
    datasource: string;
    from: string; // ISO
    to: string;   // ISO
    limit?: number;
};

export async function fetchDevices(): Promise<DeviceJSON[]> {
    const res = await api.get<DeviceJSON[]>("getdevices");
    return res.data;
}

export async function postRemoteData(payload: RemoteDataPayload): Promise<TimeSeriesJSON> {
    const res = await api.post<TimeSeriesJSON>("remotedata", payload);
    return res.data;
}