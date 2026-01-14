// src/components/TsContainerView.tsx
import React from "react";
import PlotlyChart from "./PlotlyChart";
import type { TimeSeriesJSON, TsContainerJSON } from "../types/tstransports.ts";
import {TsStatsTableContainer} from "./TsStatsTableContainer.tsx";

interface TsContainerViewProps {
    title: string;
    container: TsContainerJSON | null;
    baseSeries?: TimeSeriesJSON;
    baseLabel?: string;
}

export const TsContainerView: React.FC<TsContainerViewProps> = ({
                                                                    title,
                                                                    container,
                                                                    baseSeries,
                                                                    baseLabel,
                                                                }) => {
    if (!container) return null;

    return (
        <div style={{ marginTop: 20 }}>
            <h3>{title}</h3>

            <div style={{ height: 600 }}>
                <PlotlyChart seriesContainer={container} />
            </div>

            <div style={{ marginTop: 60 }}>
                <TsStatsTableContainer
                    container={container}
                    baseSeries={baseSeries}
                    baseLabel={baseLabel}
                />
            </div>
        </div>
    );
};