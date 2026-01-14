// src/components/TimeSeriesStatsTableBetter.tsx
import React, { useMemo, useState } from "react";
import { Table, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { BasicStatsJSON } from "../types/tstransports.ts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface TimeSeriesStatsTableProps {
    stats: BasicStatsJSON;
}

interface StatsRow {
    key: string;
    label: string;
    value?: string | number;
    isSection?: boolean;
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

const row = (key: string, label: string, value: string | number): StatsRow => ({
    key,
    label,
    value,
});

const section = (key: string, label: string): StatsRow => ({
    key,
    label,
    isSection: true,
});

// ======================= BUILD DES LIGNES =======================
const buildRowsFromStats = (
    s: BasicStatsJSON,
    dateFormat: DateFormatKind,
    decimals: number
): StatsRow[] => {
    return [
        row("len", "Number of Data Points", s.len),

        section("chrono", "Chronology"),

        row(
            "chmin",
            "First Observation",
            formatDateWithValue(s.chmin, s.valAtChmin, dateFormat, decimals)
        ),
        row(
            "chmax",
            "Last Observation",
            formatDateWithValue(s.chmax, s.valAtChmax, dateFormat, decimals)
        ),
        row("chmed", "Median Time Stamp", formatDate(s.chmed, dateFormat)),
        row("chmean", "Mean of Time Stamps", formatDate(s.chmean, dateFormat)),
        row("chstd", "Std Err of Time Stamps", formatDate(s.chstd, dateFormat)),

        section("isi", "Inter-sample Intervals"),

        row(
            "dChmin",
            "Minimum Inter-sample Interval",
            `${formatDurationNs(s.dChmin_ns, decimals)} (${formatDate(
                s.chAtDChmin,
                dateFormat
            )})`
        ),
        row(
            "dChmax_ns",
            "Maximum Inter-sample Interval",
            `${formatDurationNs(s.dChmax_ns, decimals)} (${formatDate(
                s.chAtDChmax,
                dateFormat
            )})`
        ),
        row(
            "dChmean",
            "Mean Inter-sample Interval",
            formatDurationNs(s.dChmean_ns, decimals)
        ),
        row(
            "dChmed",
            "Median Inter-sample Interval",
            formatDurationNs(s.dChmed_ns, decimals)
        ),
        row(
            "dChstd",
            "Std Dev of IsI",
            formatDurationNs(s.dChstd_ns, decimals)
        ),

        section("measure", "Measure"),

        row(
            "msmin",
            "Minimum Value",
            formatValueWithDate(s.msmin, s.chAtMsmin, dateFormat, decimals)
        ),
        row(
            "msmax",
            "Maximum Value",
            formatValueWithDate(s.msmax, s.chAtMsmax, dateFormat, decimals)
        ),
        row("msmean", "Mean Value", formatNumber(s.msmean, decimals)),
        row("msmed", "Median Value", formatNumber(s.msmed, decimals)),
        row("msstd", "Std Dev of Values", formatNumber(s.msstd, decimals)),

        section("diff", "Inter-sample Differences"),

        row("dMsmin", "Minimum Difference", formatNumber(s.dMsmin, decimals)),
        row("dMsmax", "Maximum Difference", formatNumber(s.dMsmax, decimals)),
        row("dMsmed", "Median Difference", formatNumber(s.dMsmed, decimals)),
        row("dMsmean", "Average Difference", formatNumber(s.dMsmean, decimals)),
        row("dMsstd", "Std Dev of Difference", formatNumber(s.dMsstd, decimals)),

        section("nan", "Data Quality"),

        row("nbreOfNaN", "Number of NaN", s.nbreOfNaN),
    ];
};

export const TsStatsTable: React.FC<TimeSeriesStatsTableProps> = ({
                                                                                    stats,
                                                                                }) => {
    const [dateFormat, setDateFormat] =
        useState<DateFormatKind>("dmyHm");

    // ✅ NOUVEL ÉTAT POUR LES DÉCIMALES (par défaut = 2)
    const [decimals, setDecimals] =
        useState<DecimalFormatKind>(2);

    const dataSource = useMemo(
        () => buildRowsFromStats(stats, dateFormat, decimals),
        [stats, dateFormat, decimals]
    );

    const columns: ColumnsType<StatsRow> = [
        {
            title: "Metric",
            dataIndex: "label",
            key: "label",
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
        {
            title: "Value",
            dataIndex: "value",
            key: "value",
            render: (value, record) =>
                record.isSection ? null : value,
        },
    ];

    return (
        <div style={{ fontSize: "xx-small" }}>
            {/* ✅ DOUBLE SELECTEUR */}
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
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                size="small"
                style={{ marginTop: 8 }}
            />
        </div>
    );
};