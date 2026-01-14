import React, { useMemo } from "react";
import { Button, Table, Typography, Space, Tag,  Divider } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import type { ReportDevice } from "../../types/report";
import RefreshDevicesDbButton from "../RefreshDevicesDbButton.tsx";
import { useReportLatests } from "../../hooks/useReportLatests";
import { useAuth } from "../../auth/AuthContext";
import { getRoles } from "../../auth/permissions";

dayjs.extend(utc);


// ======================
// Types
// ======================
type DatasourceRow = {
    key: string;
    name: string;
    last_time: string;
    last_value: number;
};

type DeviceRow = {
    key: string;
    device: string;
    serial: string;
    datasourceCount: number;
    lastSeen: string;
    stale: boolean; // 🔴 signal > 1h
    datasources: DatasourceRow[];
};

// ======================
// Helpers
// ======================
function computeDeviceLastSeen(d: ReportDevice): string {
    const list = d.datasources ?? [];
    let max = "";
    for (const ds of list) {
        if (ds?.last_time && (!max || ds.last_time > max)) max = ds.last_time;
    }
    return max;
}

function formatValue(v: number): string {
    const abs = Math.abs(v);
    if (abs >= 1e9) return v.toExponential(3);
    if (abs >= 1e4) return v.toFixed(0);
    return v.toFixed(2);
}

export const ReportLasts: React.FC = () => {
    const { report, loading, load } = useReportLatests();

    const generatedAt = report ? dayjs(report.generated_at) : null;

    const deviceRows: DeviceRow[] = useMemo(() => {
        if (!report) return [];
        const gen = dayjs(report.generated_at);

        return report.devices.map((d) => {
            const lastSeen = computeDeviceLastSeen(d);
            const lastSeenDay = lastSeen ? dayjs(lastSeen) : null;

            const stale = !lastSeenDay || gen.diff(lastSeenDay, "minute") > 60;

            const datasources: DatasourceRow[] = (d.datasources ?? [])
                .slice()
                .sort((a, b) => (a.last_time < b.last_time ? 1 : -1))
                .map((ds) => ({
                    key: `${d.device}::${ds.name}`,
                    name: ds.name,
                    last_time: ds.last_time,
                    last_value: ds.last_value,
                }));

            return {
                key: d.device,
                device: d.device,
                serial: d.serial,
                datasourceCount: datasources.length,
                lastSeen,
                stale,
                datasources,
            };
        });
    }, [report]);

    const deviceCount = deviceRows.length;
    const datasourceCount = deviceRows.reduce((acc, d) => acc + d.datasourceCount, 0);

    const deviceColumns: ColumnsType<DeviceRow> = [
        {
            title: "Status",
            dataIndex: "stale",
            key: "stale",
            width: 90,
            render: (stale: boolean) => (stale ? <Tag color="red">STALE</Tag> : <Tag color="green">OK</Tag>),
            filters: [
                { text: "OK", value: false },
                { text: "STALE", value: true },
            ],
            onFilter: (value, record) => record.stale === value,
        },
        {
            title: "Serial",
            dataIndex: "serial",
            key: "serial",
            sorter: (a, b) => a.serial.localeCompare(b.serial),
            width: 240,
        },
        {
            title: "Device",
            dataIndex: "device",
            key: "device",
            ellipsis: true,
        },
        {
            title: "# Datasources",
            dataIndex: "datasourceCount",
            key: "datasourceCount",
            sorter: (a, b) => a.datasourceCount - b.datasourceCount,
            width: 140,
        },
        {
            title: "Last seen (UTC)",
            dataIndex: "lastSeen",
            key: "lastSeen",
            render: (iso: string) => (iso ? dayjs(iso).utc().format("YYYY-MM-DD HH:mm:ss") : "-"),
            sorter: (a, b) => a.lastSeen.localeCompare(b.lastSeen),
            width: 210,
        },
    ];

    const datasourceColumns: ColumnsType<DatasourceRow> = [
        {
            title: "Datasource",
            dataIndex: "name",
            key: "name",
            render: (name: string) => <Tag>{name}</Tag>,
            width: 260,
        },
        {
            title: "Last time (UTC)",
            dataIndex: "last_time",
            key: "last_time",
            render: (iso: string) => dayjs(iso).utc().format("YYYY-MM-DD HH:mm:ss.SSS"),
            sorter: (a, b) => a.last_time.localeCompare(b.last_time),
            defaultSortOrder: "descend",
            width: 240,
        },
        {
            title: "Last value",
            dataIndex: "last_value",
            key: "last_value",
            sorter: (a, b) => a.last_value - b.last_value,
            render: (v: number) => formatValue(v),
            width: 160,
        },
    ];
    const { tokens } = useAuth();

    const roles = useMemo(
        () => (tokens ? getRoles(tokens.accessToken) : []),
        [tokens]
    );

    const canWrite = roles.includes("readwrite");

    return (
        <div style={{ padding: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        Report latest
                    </Typography.Title>

                    <Space>
                        {canWrite && <RefreshDevicesDbButton />}
                        <Button type="primary" onClick={load} loading={loading}>
                            Charger
                        </Button>
                    </Space>
                </Space>

                {report && generatedAt && (
                    <Space direction="vertical" size={0}>
                        <Typography.Text type="secondary">
                            generated_at (UTC): {generatedAt.utc().format("YYYY-MM-DD HH:mm:ss.SSS")}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                            Devices: <strong>{deviceCount}</strong> — Datasources: <strong>{datasourceCount}</strong>
                        </Typography.Text>
                    </Space>
                )}

                <Table<DeviceRow>
                    columns={deviceColumns}
                    dataSource={deviceRows}
                    loading={loading}
                    pagination={{ pageSize: 100 }}
                    size="middle"
                    rowKey="key"
                    expandable={{
                        rowExpandable: (record) => record.datasources.length > 0,
                        expandedRowRender: (record) => (
                            <div style={{ paddingLeft: 8 }}>
                                <Typography.Text strong>Datasources — {record.serial}</Typography.Text>
                                <Divider style={{ margin: "8px 0" }} />
                                <Table<DatasourceRow>
                                    columns={datasourceColumns}
                                    dataSource={record.datasources}
                                    pagination={false}
                                    size="small"
                                    rowKey="key"
                                />
                            </div>
                        ),
                    }}
                />
            </Space>
        </div>
    );
};

export default ReportLasts;