// src/http/restrictedApi.ts
import { api } from "./axiosApi";

export type TestResponse = {
    ok: boolean;
    scope: string;
    message: string;
    time: string;
};

export async function fetchRestrictedTest(): Promise<TestResponse> {
    const res = await api.get<TestResponse>("/timeseries/test");
    return res.data;
}