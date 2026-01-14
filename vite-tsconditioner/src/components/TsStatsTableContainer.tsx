// src/components/TsContainerStatsTableBetter.tsx
import React, { useMemo, useState } from "react";
import { Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import type {
    TimeSeriesJSON,
    TsContainerJSON,
    BasicStatsJSON,
} from "../types/tstransports.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface Props {
    container: TsContainerJSON;
    baseSeries?: TimeSeriesJSON;
    baseLabel?: string;
}

// =======================
// ✅ FORMAT DE DATE
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
// ✅ FORMAT DES DÉCIMALES
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
// ✅ TYPE DES LIGNES
// =======================
interface StatsRow {
    key: string;
    label: string;
    isSection?: boolean;
    // colonnes dynamiques : "_base", "Original", "Cleaned", ...
    [columnId: string]: string | number | boolean | undefined;
}

// =======================
// ✅ HELPERS
// =======================
const formatNumber = (
    v: number | null | undefined,
    decimals: number
): string => {
    if (v == null || isNaN(v)) return "-";
    return v.toFixed(decimals);
};

const formatDate = (
    iso: string | null | undefined,
    dateFormat: DateFormatKind
): string => {
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
            return (
                d.format("ddd D MMM YY").toLowerCase() +
                " " +
                d.format("HH:mm:ss")
            );
        default:
            return iso;
    }
};

const formatDurationNs = (
    ns: number | null | undefined,
    decimals: number
): string => {
    if (ns == null) return "-";
    const seconds = ns / 1e9;
    return `${seconds.toFixed(decimals)} s`;
};

const formatDateWithValue = (
    iso: string | null | undefined,
    v: number | null | undefined,
    dateFormat: DateFormatKind,
    decimals: number
): string => {
    const d = formatDate(iso, dateFormat);
    return v == null ? d : `${d} (${formatNumber(v, decimals)})`;
};

const formatValueWithDate = (
    v: number | null | undefined,
    iso: string | null | undefined,
    dateFormat: DateFormatKind,
    decimals: number
): string => {
    const d = formatDate(iso, dateFormat);
    return v == null ? d : `${formatNumber(v, decimals)} (${d})`;
};

// Helpers pour la construction des lignes
const makeSection = (key: string, label: string): StatsRow => ({
    key,
    label,
    isSection: true,
});

type ColumnId = string; // "_base" ou nom de série

const pushRow = (
    rows: StatsRow[],
    key: string,
    label: string,
    columnIds: ColumnId[],
    statsMap: Record<ColumnId, BasicStatsJSON | undefined>,
    extractor: (s: BasicStatsJSON | undefined) => string | number | undefined
) => {
    const row: StatsRow = { key, label };
    for (const col of columnIds) {
        const st = statsMap[col];
        const value = extractor(st);
        row[col] = value ?? "-";
    }
    rows.push(row);
};

// =======================
// ✅ BUILD DES LIGNES MULTI-SÉRIES
// =======================
const buildRowsFromContainer = (
    container: TsContainerJSON,
    baseSeries: TimeSeriesJSON | undefined,
    baseKey: string | undefined,
    dateFormat: DateFormatKind,
    decimals: number
): StatsRow[] => {
    const seriesNames = Object.keys(container.series); // ex: ["Original", "Pre Reg Cleaned", ...]

    const columnIds: ColumnId[] = [];
    const statsMap: Record<ColumnId, BasicStatsJSON | undefined> = {};

    if (baseKey && baseSeries?.stats) {
        columnIds.push(baseKey);
        statsMap[baseKey] = baseSeries.stats;
    }

    for (const s of seriesNames) {
        columnIds.push(s);
        statsMap[s] = container.series[s]?.stats;
    }

    const rows: StatsRow[] = [];

    // Nombre de points
    pushRow(
        rows,
        "len",
        "Number of Data Points",
        columnIds,
        statsMap,
        (s) => s?.len
    );

    // ----- Chronologie -----
    rows.push(makeSection("chrono", "Chronology"));

    pushRow(
        rows,
        "chmin",
        "First Observation",
        columnIds,
        statsMap,
        (s) =>
            s
                ? formatDateWithValue(
                    s.chmin,
                    s.valAtChmin,
                    dateFormat,
                    decimals
                )
                : "-"
    );

    pushRow(
        rows,
        "chmax",
        "Last Observation",
        columnIds,
        statsMap,
        (s) =>
            s
                ? formatDateWithValue(
                    s.chmax,
                    s.valAtChmax,
                    dateFormat,
                    decimals
                )
                : "-"
    );

    pushRow(
        rows,
        "chmed",
        "Median Time Stamp",
        columnIds,
        statsMap,
        (s) => (s ? formatDate(s.chmed, dateFormat) : "-")
    );

    pushRow(
        rows,
        "chmean",
        "Mean of Time Stamps",
        columnIds,
        statsMap,
        (s) => (s ? formatDate(s.chmean, dateFormat) : "-")
    );

    pushRow(
        rows,
        "chstd",
        "Std Err of Time Stamps",
        columnIds,
        statsMap,
        (s) => (s ? formatDate(s.chstd, dateFormat) : "-")
    );

    // ----- Inter-sample intervals -----
    rows.push(makeSection("isi", "Inter-sample Intervals"));

    pushRow(
        rows,
        "dChmin",
        "Minimum Inter-sample Interval",
        columnIds,
        statsMap,
        (s) =>
            s
                ? `${formatDurationNs(
                    s.dChmin_ns,
                    decimals
                )} (${formatDate(s.chAtDChmin, dateFormat)})`
                : "-"
    );

    pushRow(
        rows,
        "dChmax",
        "Maximum Inter-sample Interval",
        columnIds,
        statsMap,
        (s) =>
            s
                ? `${formatDurationNs(
                    s.dChmax_ns,
                    decimals
                )} (${formatDate(s.chAtDChmax, dateFormat)})`
                : "-"
    );

    pushRow(
        rows,
        "dChmean",
        "Mean Inter-sample Interval",
        columnIds,
        statsMap,
        (s) =>
            s ? formatDurationNs(s.dChmean_ns, decimals) : "-"
    );

    pushRow(
        rows,
        "dChmed",
        "Median Inter-sample Interval",
        columnIds,
        statsMap,
        (s) =>
            s ? formatDurationNs(s.dChmed_ns, decimals) : "-"
    );

    pushRow(
        rows,
        "dChstd",
        "Std Dev of IsI",
        columnIds,
        statsMap,
        (s) =>
            s ? formatDurationNs(s.dChstd_ns, decimals) : "-"
    );

    // ----- Mesure -----
    rows.push(makeSection("measure", "Measure"));

    pushRow(
        rows,
        "msmin",
        "Minimum Value",
        columnIds,
        statsMap,
        (s) =>
            s
                ? formatValueWithDate(
                    s.msmin,
                    s.chAtMsmin,
                    dateFormat,
                    decimals
                )
                : "-"
    );

    pushRow(
        rows,
        "msmax",
        "Maximum Value",
        columnIds,
        statsMap,
        (s) =>
            s
                ? formatValueWithDate(
                    s.msmax,
                    s.chAtMsmax,
                    dateFormat,
                    decimals
                )
                : "-"
    );

    pushRow(
        rows,
        "msmean",
        "Mean Value",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.msmean, decimals) : "-")
    );

    pushRow(
        rows,
        "msmed",
        "Median Value",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.msmed, decimals) : "-")
    );

    pushRow(
        rows,
        "msstd",
        "Std Dev of Values",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.msstd, decimals) : "-")
    );

    // ----- Différences inter-échantillons -----
    rows.push(makeSection("diff", "Inter-sample Differences"));

    pushRow(
        rows,
        "dMsmin",
        "Minimum Difference",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.dMsmin, decimals) : "-")
    );

    pushRow(
        rows,
        "dMsmax",
        "Maximum Difference",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.dMsmax, decimals) : "-")
    );

    pushRow(
        rows,
        "dMsmed",
        "Median Difference",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.dMsmed, decimals) : "-")
    );

    pushRow(
        rows,
        "dMsmean",
        "Average Difference",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.dMsmean, decimals) : "-")
    );

    pushRow(
        rows,
        "dMsstd",
        "Std Dev of Difference",
        columnIds,
        statsMap,
        (s) => (s ? formatNumber(s.dMsstd, decimals) : "-")
    );

    // ----- Qualité des données -----
    rows.push(makeSection("nan", "Data Quality"));

    pushRow(
        rows,
        "nbreOfNaN",
        "Number of NaN",
        columnIds,
        statsMap,
        (s) => s?.nbreOfNaN
    );

    return rows;
};

// =======================
// ✅ COMPOSANT PRINCIPAL
// =======================
export const TsStatsTableContainer: React.FC<Props> = ({
                                                                 container,
                                                                 baseSeries,
                                                                 baseLabel = "BulkSimul",
                                                             }) => {
    const [dateFormat, setDateFormat] =
        useState<DateFormatKind>("dmyHm");
    const [decimals, setDecimals] =
        useState<DecimalFormatKind>(2);

    const baseKey = baseSeries ? "_base" : undefined;

    const data = useMemo(
        () =>
            buildRowsFromContainer(
                container,
                baseSeries,
                baseKey,
                dateFormat,
                decimals
            ),
        [container, baseSeries, baseKey, dateFormat, decimals]
    );

    const seriesNames = Object.keys(container.series);

    // Colonnes dynamiques
    const columns: ColumnsType<StatsRow> = [
        {
            title: "Metric",
            dataIndex: "label",
            key: "label",
            fixed: "left",
            width: 220,
            render: (text, record) =>
                record.isSection ? (
                    <div
                        style={{
                            fontWeight: "bold",
                            backgroundColor: "#f5f5f5",
                        }}
                    >
                        {text}
                    </div>
                ) : (
                    text
                ),
        },
        ...(baseSeries
            ? [
                {
                    title: baseLabel,
                    dataIndex: baseKey!,
                    key: baseKey!,
                    width: 160,
                    render: (value, record) =>
                        record.isSection ? null : value,
                } as ColumnsType<StatsRow>[number],
            ]
            : []),
        ...seriesNames.map(
            (s): ColumnsType<StatsRow>[number] => ({
                title: s,
                dataIndex: s,
                key: s,
                width: 160,
                render: (value, record) =>
                    record.isSection ? null : value,
            })
        ),
    ];

    return (
        <div style={{ fontSize: "xx-small" }}>
            {/* Sélecteurs date + décimales */}
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

            <Table<StatsRow>
                size="small"
                bordered
                pagination={false}
                columns={columns}
                dataSource={data}
                scroll={{ x: 800 }}
            />
        </div>
    );
};