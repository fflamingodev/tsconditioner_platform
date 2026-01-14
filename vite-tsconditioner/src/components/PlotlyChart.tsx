// src/components/PlotlyChart.tsx
import Plot from "react-plotly.js";
import type {Config, Data, Layout} from "plotly.js";
import type {TimeSeriesJSON, TsContainerJSON} from "../types/tstransports.ts";
import styles from "./PlotlyChart.module.css";

interface PlotlyChartProps {
    title?: string;
    timeSeries?: TimeSeriesJSON;       // mode "une série"
    seriesContainer?: TsContainerJSON; // mode "multi-séries"
}

// Palette simple
const SERIES_COLORS: Record<string, string> = {
    "Pre Reg Cleaned": "#C0C0C0",
    "Post Reg Cleaned": "#2ca02c",
    "Regularized": "#0000FF",
    "Pre Reg Rejected": "#d62728",
    "Post Reg Rejected": "#9467bd",
    default: "#999999",
};

// Ordre d’affichage (plus grand = au-dessus)
const SERIES_ORDER: Record<string, number> = {
    "Pre Reg Cleaned": 1,
    "Pre Reg Rejected": 2,
    "Regularized": 3,
    "Post Reg Rejected": 4,
    "Post Reg Cleaned": 5, // en dernier -> au-dessus
};

function getSeriesOrder(key: string): number {
    return SERIES_ORDER[key] ?? 0;
}

// Style en fonction de la clé
function getTraceStyle(key: string): Partial<Data> {
    const color = SERIES_COLORS[key] ?? SERIES_COLORS.default;

    switch (key) {
        case "Pre Reg Cleaned":
            return {
                mode: "lines",
                line: {
                    width: 1.0,
                    color,
                },
            };
        case "Regularized":
            return {
                mode: "lines",
                line: {
                    width: 1.0,
                    color,
                },
            };
        case "Post Reg Cleaned":
            return {
                mode: "lines",
                line: {
                    width: 1.0,
                    color,
                },
            };
        case "Pre Reg Rejected":
            return {
                mode: "markers",
                marker: {
                    size: 6,
                    color,
                },
            };
        case "Post Reg Rejected":
            return {
                mode: "markers",
                marker: {
                    size: 7,
                    color,
                },
            };
        case "Reduced":
            return {
                mode: "markers",
                marker: {
                    size: 8,
                    color:"blue",
                    symbol: "circle",
                },
            };
        default:
            return {
                mode: "lines",
                line: {
                    width: 1.0,
                    color,
                },
            };
    }
}

const PlotlyChart = ({
                         title = "",
                         timeSeries,
                         seriesContainer,
                     }: PlotlyChartProps) => {
    // ⬇️ On travaille en Partial<Data> pour être plus souple
    let data: Partial<Data>[] = [];
    let finalTitle = title;

    if (seriesContainer?.name) {
        finalTitle = seriesContainer.name;
    } else if (timeSeries?.name) {
        finalTitle = timeSeries.name;
    }
    let xAxisIsDate = false;

    if (seriesContainer && Object.keys(seriesContainer.series).length > 0) {

        const traces = Object.entries(seriesContainer.series)
            .map(([key, ts]) => {
                if (!ts.chron || ts.chron.length === 0) {
                    return null;
                }

                const style = getTraceStyle(key);

// @ts-expect-error Typings Plotly trop stricts ici, le code runtime est OK.
                const trace: Partial<Data> = {
                    x: ts.chron,
                    y: ts.meas,
                    type: "scatter",
                    name: key,
                    line: {
                        width: 1.0
                    },
                    connectgaps: false,
                    ...style,
                };

                return {key, trace};
            })
            .filter(
                (item): item is { key: string; trace: Partial<Data> } =>
                    item !== null,
            );

        // "Post Reg Cleaned" en dernier
        traces.sort((a, b) => getSeriesOrder(a.key) - getSeriesOrder(b.key));

        data = traces.map((t) => t.trace);

        xAxisIsDate = true;
    } else if (timeSeries) {
        data = [
            {
                x: timeSeries.chron,
                y: timeSeries.meas,
                type: "scatter",
                mode: "markers",
                marker: {
                    size: 2,
                    color: "blue",
                    symbol: "square",
                },
                name: timeSeries.name || "Simulation",
                connectgaps: false,
            },
        ];
        xAxisIsDate = true;
    } else {
        data = [
            {
                x: [1, 2, 3, 4, 5],
                y: [2, 5, 3, 8, 6],
                type: "scatter",
                mode: "lines",
                name: "Série 1",
                connectgaps: false,
            },
        ];
    }

    const layout: Partial<Layout> = {
        title: {text: finalTitle},
        xaxis: {
            title: {text: xAxisIsDate ? "Temps" : "X"},
            type: xAxisIsDate ? "date" : undefined,
        },
        yaxis: {title: {text: "Valeur"}},
        autosize: true,
        margin: {l: 40, r: 20, t: 40, b: 40},
    };

    const config: Partial<Config> = {
        responsive: true,
        displaylogo: false,
    };

    return (
        <div className={styles.plotBackground}>
            <Plot
                // ⬇️ cast unique et localisé vers Data[]
                data={data as Data[]}
                layout={layout}
                config={config}
                style={{width: "100%", height: "100%"}}
                useResizeHandler
            />
        </div>
    );
};

export default PlotlyChart;