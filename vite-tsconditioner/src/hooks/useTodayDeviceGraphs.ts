// src/hooks/useTodayDeviceGraphs.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import type { SelectProps } from "antd";
import type { DeviceJSON, TsContainerJSON } from "../types/tstransports";
import { getDevices, getTodayContainer } from "../http/today";

export function useTodayDeviceGraphs() {
    const [devices, setDevices] = useState<DeviceJSON[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string | undefined>(undefined);
    const [loadedDevice, setLoadedDevice] = useState<string | undefined>(undefined);

    const [loadingDevices, setLoadingDevices] = useState(false);
    const [loadingContainer, setLoadingContainer] = useState(false);

    const [container, setContainer] = useState<TsContainerJSON | null>(null);

    // load devices once
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoadingDevices(true);
            try {
                const data = await getDevices();
                if (!cancelled) setDevices(data);
            } catch (err) {
                console.error(err);
                message.error("Erreur chargement devices");
            } finally {
                if (!cancelled) setLoadingDevices(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const deviceOptions: SelectProps["options"] = useMemo(
        () =>
            devices.map((d) => ({
                value: d.device_id,
                label: d.device_name ? `${d.device_name} — ${d.device_id}` : d.device_id,
            })),
        [devices]
    );

    // fetch container when (and only when) loadedDevice changes
    useEffect(() => {
        if (!loadedDevice) {
            setContainer(null);
            return;
        }

        let cancelled = false;

        (async () => {
            setLoadingContainer(true);
            try {
                const data = await getTodayContainer(loadedDevice);
                if (!cancelled) setContainer(data);
            } catch (err) {
                console.error(err);
                message.error("Impossible de charger les séries du jour pour ce device");
                if (!cancelled) setContainer(null);
            } finally {
                if (!cancelled) setLoadingContainer(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [loadedDevice]);

    const seriesEntries = useMemo(() => {
        if (!container?.series) return [];
        return Object.entries(container.series).sort(([a], [b]) => a.localeCompare(b));
    }, [container]);

    const canLoad = !!selectedDevice && !loadingContainer;

    const load = useCallback(() => {
        setLoadedDevice(selectedDevice);
    }, [selectedDevice]);

    const clear = useCallback(() => {
        setSelectedDevice(undefined);
        setLoadedDevice(undefined);
        setContainer(null);
    }, []);

    return {
        // data
        container,
        devices,
        deviceOptions,
        seriesEntries,

        // selection
        selectedDevice,
        setSelectedDevice,
        loadedDevice,

        // states
        loadingDevices,
        loadingContainer,
        canLoad,

        // actions
        load,
        clear,
    };
}