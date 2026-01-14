// src/http/polishingApi.ts
import { api } from "./axiosApi.ts";
import type { TsContainerJSON } from "../types/tstransports";
import type { PolishRequest } from "../types/polishing";

export async function postPolishing(request: PolishRequest): Promise<TsContainerJSON> {
    const res = await api.post<TsContainerJSON>("/polishing", request);
    return res.data;
}