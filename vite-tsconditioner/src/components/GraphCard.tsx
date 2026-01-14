// src/components/GraphCard.tsx
import React, { useMemo } from "react";
import { Card } from "antd";
import Plot from "react-plotly.js";
import type { Data, Layout, Config } from "plotly.js";
import type { TimeSeriesJSON } from "../types/tstransports.ts";

interface GraphCardProps {
    title: string;
    ts: TimeSeriesJSON;
    height?: number; // hauteur limitée
}

export const GraphCard: React.FC<GraphCardProps> = ({ title, ts, height = 260 }) => {
    const { x, y } = useMemo(() => {
        const x: string[] = [];
        const y: (number | null)[] = [];
        const n = Math.min(ts.chron?.length ?? 0, ts.meas?.length ?? 0);

        for (let i = 0; i < n; i++) {
            x.push(ts.chron[i]);
            y.push(ts.meas[i] ?? null);
        }
        return { x, y };
    }, [ts]);

    const data: Data[] = useMemo(
        () => [
            {
                type: "scatter",
                mode: "lines",
                x,
                y,
                name: ts.name ?? title,
                connectgaps: false,
            },
        ],
        [x, y, ts.name, title]
    );

    const layout: Partial<Layout> = useMemo(
        () => ({
            margin: { l: 40, r: 10, t: 20, b: 35 },
            height,
            autosize: true,
            xaxis: { type: "date" },
            yaxis: { automargin: true },
            showlegend: false,
        }),
        [height]
    );

    const config: Partial<Config> = useMemo(
        () => ({
            responsive: true,
            displayModeBar: false,
        }),
        []
    );

    return (
        <Card
            size="small"
            title={title}
            style={{ width: "100%" }}
            bodyStyle={{ padding: 8 }}
        >
            <Plot data={data} layout={layout} config={config} style={{ width: "100%" }} />
        </Card>
    );
};