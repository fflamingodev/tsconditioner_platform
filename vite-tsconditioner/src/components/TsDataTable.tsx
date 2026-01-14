// src/components/TimeSeriesDataTable.tsx
import React, { useMemo, useState } from "react";
import { Table, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TimeSeriesJSON } from "../types/tstransports.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface Props {
    timeSeries: TimeSeriesJSON;
}

interface TimeSeriesRow {
    key: number;
    chron: string;
    meas: number | null;
    dchron_ns: number | null;
    dmeas: number | null;
    status: number | null;
}

// =======================
// ✅ FORMAT DE DATE (copié de TsStatsTable)
// =======================
type DateFormatKind =
    | "rfc3339"
    | "ymdHms"
    | "dmyHm"
    | "dmyHmS"
    | "timeOnly"
    | "explicitDay"
    | "dmyHmSUTC";

const dateFormatOptions = [
    { label: "RFC3339 brut", value: "rfc3339" },
    { label: "DD-MM-YYYY HH:mm:ss.SSS", value: "dmyHmS" },
    { label: "DD-MM-YYYY HH:mm:ss.SSS [UTC]", value: "dmyHmSUTC" },
    { label: "DD-MM-YYYY HH:mm:ss", value: "dmyHm" },
    { label: "YYYY-MM-DD HH:mm:ss", value: "ymdHms" },
    { label: "Time Only (HH:mm:ss)", value: "timeOnly" },
    { label: "Explicit Day", value: "explicitDay" },
];

// =======================
// ✅ FORMAT DES DÉCIMALES (copié de TsStatsTable)
// =======================
type DecimalFormatKind = 0 | 1 | 2 | 3 | 4 | 5;

const decimalOptions = [
    { label: "0", value: 0 },
    { label: ".0", value: 1 },
    { label: ".00", value: 2 },
    { label: ".000", value: 3 },
    { label: ".0000", value: 4 },
    { label: ".00000", value: 5 },
];

// =======================
// ✅ HELPERS (copié/adapté)
// =======================
const formatNumber = (v: number | null | undefined, decimals: number): string => {
    if (v == null || isNaN(v)) return "-";
    return v.toFixed(decimals);
};

const formatDate = (iso: string | null | undefined, dateFormat: DateFormatKind): string => {
    if (!iso) return "-";
    if (dateFormat === "rfc3339") return iso;

    if (dateFormat === "dmyHmSUTC") {
        const du = dayjs.utc(iso);
        if (!du.isValid()) return iso;
        return du.format("DD-MM-YYYY HH:mm:ss.SSS [UTC]");
    }

    const d = dayjs(iso);
    if (!d.isValid()) return iso;

    switch (dateFormat) {
        case "dmyHm":
            return d.format("DD-MM-YYYY HH:mm:ss");
        case "ymdHms":
            return d.format("YYYY-MM-DD HH:mm:ss.SSS");
        case "dmyHmS":
            return d.format("DD-MM-YYYY HH:mm:ss.SSS");
        case "timeOnly":
            return d.format("HH:mm:ss.SSSSSS");
        case "explicitDay":
            return d.format("ddd D MMM YY").toLowerCase() + " " + d.format("HH:mm:ss");
        default:
            return iso;
    }
};

// ✅ format humain pour ΔChron avec secondes à 3 décimales
const formatNsToHumanDuration = (ns: number | null): string => {
    if (ns === null || ns === undefined) return "-";

    let remainingNs = ns;

    const dayNs = 86400 * 1e9;
    const hourNs = 3600 * 1e9;
    const minuteNs = 60 * 1e9;

    const days = Math.floor(remainingNs / dayNs);
    remainingNs %= dayNs;

    const hours = Math.floor(remainingNs / hourNs);
    remainingNs %= hourNs;

    const minutes = Math.floor(remainingNs / minuteNs);
    remainingNs %= minuteNs;

    const seconds = remainingNs / 1e9; // ⚠️ float ici

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} d`);
    if (hours > 0) parts.push(`${hours} h`);
    if (minutes > 0) parts.push(`${minutes} m`);

    // secondes toujours affichées si rien d’autre
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds.toFixed(3)} s`);
    }

    return parts.join(" ");
};

export const TsDataTable: React.FC<Props> = ({ timeSeries }) => {
    const [dateFormat, setDateFormat] = useState<DateFormatKind>("dmyHm");
    const [decimals, setDecimals] = useState<DecimalFormatKind>(2);

    const dataSource: TimeSeriesRow[] = useMemo(() => {
        const len = timeSeries.chron.length;
        const rows: TimeSeriesRow[] = [];

        for (let i = 0; i < len; i++) {
            rows.push({
                key: i,
                chron: timeSeries.chron[i],
                meas: timeSeries.meas?.[i] ?? null,
                dchron_ns: timeSeries.dchron_ns?.[i] ?? null,
                dmeas: timeSeries.dmeas?.[i] ?? null,
                status: timeSeries.status?.[i] ?? null,
            });
        }
        return rows;
    }, [timeSeries]);

    const uniqueStatusFilters = useMemo(() => {
        const set = new Set<number>();
        timeSeries.status?.forEach((s) => {
            if (s !== null && s !== undefined) set.add(s);
        });

        return Array.from(set).map((s) => ({
            text: String(s),
            value: s,
        }));
    }, [timeSeries.status]);

    const columns: ColumnsType<TimeSeriesRow> = [
        {
            title: "Chron",
            dataIndex: "chron",
            key: "chron",
            sorter: (a, b) => a.chron.localeCompare(b.chron),
            ellipsis: true,
            render: (iso: string) => formatDate(iso, dateFormat),
        },
        {
            title: "Meas",
            dataIndex: "meas",
            key: "meas",
            sorter: (a, b) => (a.meas ?? 0) - (b.meas ?? 0),
            render: (v: number | null) => formatNumber(v, decimals),
            filters: [
                { text: "> 0", value: "gt0" },
                { text: "= 0", value: "eq0" },
                { text: "< 0", value: "lt0" },
            ],
            onFilter: (value, record) => {
                const v = record.meas ?? 0;
                if (value === "gt0") return v > 0;
                if (value === "eq0") return v === 0;
                if (value === "lt0") return v < 0;
                return true;
            },
        },
        {
            title: "ΔChron",
            dataIndex: "dchron_ns",
            key: "dchron_ns",
            sorter: (a, b) => (a.dchron_ns ?? 0) - (b.dchron_ns ?? 0),
            render: (value: number | null) => formatNsToHumanDuration(value),
        },
        {
            title: "ΔMeas",
            dataIndex: "dmeas",
            key: "dmeas",
            sorter: (a, b) => (a.dmeas ?? 0) - (b.dmeas ?? 0),
            render: (v: number | null) => formatNumber(v, decimals),
            filters: [
                { text: "> 0", value: "gt0" },
                { text: "= 0", value: "eq0" },
                { text: "< 0", value: "lt0" },
            ],
            onFilter: (value, record) => {
                const v = record.dmeas ?? 0;
                if (value === "gt0") return v > 0;
                if (value === "eq0") return v === 0;
                if (value === "lt0") return v < 0;
                return true;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            filters: uniqueStatusFilters,
            onFilter: (value, record) => record.status === value,
        },
    ];

    return (
        <div style={{ fontSize: "xx-small" }}>
            {/* ✅ DOUBLE SELECTEUR (comme TsStatsTable) */}
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 8,
                    alignItems: "center",
                }}
            >
                <div>
                    <span style={{ marginRight: 6 }}>Dates:</span>
                    <Select<DateFormatKind>
                        size="small"
                        style={{ width: 220 }}
                        value={dateFormat}
                        onChange={setDateFormat}
                        options={dateFormatOptions}
                    />
                </div>

                <div>
                    <span style={{ marginRight: 6 }}>Decimals:</span>
                    <Select<DecimalFormatKind>
                        size="small"
                        style={{ width: 120 }}
                        value={decimals}
                        onChange={setDecimals}
                        options={decimalOptions}
                    />
                </div>
            </div>

            <Table<TimeSeriesRow>
                size="small"
                dataSource={dataSource}
                columns={columns}
                pagination={{ pageSize: 100, showSizeChanger: false, showQuickJumper: false }}
                scroll={{ y: 750 }}
            />
        </div>
    );
};