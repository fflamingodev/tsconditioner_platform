// src/hooks/useRefreshDevicesDB.ts
import { useCallback, useState } from "react";
import { message } from "antd";
import { refreshDevicesDB } from "../http/reportApi.ts";

export function useRefreshDevicesDB() {
    const [loading, setLoading] = useState(false);

    const run = useCallback(async () => {
        setLoading(true);
        try {
            const json = await refreshDevicesDB();
            if (json.ok) message.success("Devices database refreshed");
            else message.error("Refresh failed");
        } catch (e: unknown) {
            message.error(e instanceof Error ? e.message : "Refresh failed");
        } finally {
            setLoading(false);
        }
    }, []);

    return { refreshDevices: run, loading };
}