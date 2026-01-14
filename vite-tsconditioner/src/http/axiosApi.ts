// src/http/axiosApi.ts
import axios, { AxiosError, type AxiosInstance } from "axios";

let getTokenFn: (() => Promise<string | null>) | null = null;
let logoutFn: (() => void) | null = null;

export function bindAuth(
    getValidAccessToken: () => Promise<string | null>,
    logout: () => void
): void {
    getTokenFn = getValidAccessToken;
    logoutFn = logout;
}

// Exemple: VITE_API_BASE_URL="http://localhost:9006"
const baseURL = "http://localhost:9006/timeseries";

export const api: AxiosInstance = axios.create({
    baseURL,
    withCredentials: false,
    timeout: 200_000,
});

api.interceptors.request.use(async (config) => {
    if (getTokenFn) {
        const token = await getTokenFn();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
        if (err.response?.status === 401) {
            // Token manquant/expiré/invalid => logique globale
            if (logoutFn) logoutFn();
        }
        return Promise.reject(err);
    }
);