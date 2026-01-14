// src/hooks/useDeviceDatasourceDetails.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import type { Dayjs } from "dayjs";

import type { TimeSeriesJSON, DeviceJSON } from "../types/tstransports";
import { fetchDevices, postRemoteData, type RemoteDataPayload } from "../http/deviceDatasourceDetailsApi";

export type LoadRemoteDataArgs = {
    from: Dayjs | undefined;
    to: Dayjs | undefined;
    limit: number | undefined;
};

export function useDeviceDatasourceDetails() {
    const [devices, setDevices] = useState<DeviceJSON[]>([]);
    const [tsData, setTsData] = useState<TimeSeriesJSON | null>(null);
    const [tsMemId, setTsMemId] = useState<number | null>(null);

    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
    const [selectedDataSource, setSelectedDataSource] = useState<string | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchDevices();
                setDevices(data);
            } catch (err) {
                console.error(err);
                message.error("Erreur chargement devices");
            }
        })();
    }, []);

    const selectedDevice = useMemo(
        () => devices.find((d) => d.device_id === selectedDeviceId),
        [devices, selectedDeviceId]
    );

    const dataSourceOptions = useMemo(
        () =>
            (selectedDevice?.datasources ?? [])
                .map((ds) => ds?.name)
                .filter((name): name is string => typeof name === "string" && name.length > 0)
                .map((name) => ({ label: name, value: name })),
        [selectedDevice]
    );

    const deviceOptions = useMemo(
        () =>
            devices.map((d) => ({
                label: d.device_name,
                value: d.device_id,
            })),
        [devices]
    );

    const handleDeviceChange = useCallback((value?: string) => {
        setSelectedDeviceId(value);
        setSelectedDataSource(undefined);
    }, []);

    const loadRemoteData = useCallback(
        async (args: LoadRemoteDataArgs) => {
            if (!selectedDeviceId) return message.warning("Merci de sélectionner un device d'abord");
            if (!selectedDataSource) return message.warning("Merci de sélectionner une data source");

            const { from, to, limit } = args;
            if (!from || !to) return message.warning("Merci de sélectionner les dates From et To");

            const payload: RemoteDataPayload = {
                device: selectedDeviceId,
                datasource: selectedDataSource,
                from: from.toISOString(),
                to: to.toISOString(),
            };
            if (typeof limit === "number" && limit > 0) payload.limit = limit;

            try {
                const data = await postRemoteData(payload);
                setTsData(data);
                setTsMemId(data.id);
                message.success("RemoteData loaded successfully!");
            } catch (err) {
                console.error("❌ Erreur serveur:", err);
                message.error("Erreur backend");
            }
        },
        [selectedDeviceId, selectedDataSource]
    );

    return {
        devices,
        tsData,
        tsMemId,

        selectedDeviceId,
        selectedDataSource,
        setSelectedDataSource,
        handleDeviceChange,

        deviceOptions,
        dataSourceOptions,

        loadRemoteData,
    };
}