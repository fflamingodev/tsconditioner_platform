// src/api/today.ts
import { api } from "./axiosApi";
import type { DeviceJSON, TsContainerJSON } from "../types/tstransports";

export async function getDevices(): Promise<DeviceJSON[]> {
    const res = await api.get<DeviceJSON[]>("/getdevices");
    return res.data;
}

export async function getTodayContainer(deviceId: string): Promise<TsContainerJSON> {
    const res = await api.get<TsContainerJSON>(`/today/${encodeURIComponent(deviceId)}`);
    return res.data;
}