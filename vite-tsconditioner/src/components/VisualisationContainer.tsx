// src/components/VisualisationContainer.tsx
import React, { useState } from "react";
import { Form, Switch } from "antd";

import PlotlyChart from "./PlotlyChart";
import { TsDataTable } from "./TsDataTable.tsx";
import { TsStatsTable } from "./TsStatsTable.tsx";
import { PolishForm } from "./PolishForm";
import { TsContainerView } from "./TsContainerView";

import type { TimeSeriesJSON, TsContainerJSON } from "../types/tstransports.ts";
import type { PolishRequest } from "../types/polishing";

interface VisualizationContainerProps {
    tsData: TimeSeriesJSON | null;
    tsContainerJSON: TsContainerJSON | null;
    tsMemId: number | null;

    baseLabel: string; // ex: "BulkSimul" ou "RemoteData"

    onPolishing: (request: PolishRequest) => Promise<void> | void;
}

export const VisualisationContainer: React.FC<VisualizationContainerProps> = ({
                                                                                  tsData,
                                                                                  tsContainerJSON,
                                                                                  tsMemId,
                                                                                  baseLabel,
                                                                                  onPolishing,
                                                                              }) => {
    const [showAllData, setShowAllData] = useState(false);
    const [showStatsTable, setShowStatsTable] = useState(false);

    return (
        <div style={{ marginTop: 20 }}>
            {/* 📈 Graph */}
            <div style={{ marginTop: 20, marginBottom:60, height: 400 }}>
                <PlotlyChart timeSeries={tsData ?? undefined} />
            </div>

            {/* 🔀 Switches */}
            <Form layout="inline" style={{ marginTop: 16, marginBottom: 16 }}>
                <Form.Item label="Show Raw Data">
                    <Switch
                        checked={showAllData}
                        onChange={setShowAllData}
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                        disabled={!tsData}
                    />
                </Form.Item>

                <Form.Item label="Show Raw Data Statistics">
                    <Switch
                        checked={showStatsTable}
                        onChange={setShowStatsTable}
                        checkedChildren="Yes"
                        unCheckedChildren="No"
                        disabled={!tsData}
                    />
                </Form.Item>
            </Form>

            {/* 📋 Table des données brutes */}
            {showAllData && tsData && (
                <div style={{ marginTop: 20 }}>
                    <TsDataTable timeSeries={tsData} />
                </div>
            )}

            {/* 📊 Table des stats */}
            {showStatsTable && tsData?.stats && (
                <div style={{ marginTop: 20 }}>
                    <TsStatsTable stats={tsData.stats} />
                </div>
            )}

            {/* 🧴 Polish + Container view */}
            <div style={{ marginTop: 24 }}>
                {tsMemId != null && (
                    <PolishForm
                        memId={tsMemId}
                        onSubmit={onPolishing}
                    />
                )}

                <TsContainerView
                    title="Processing Results:"
                    container={tsContainerJSON}
                    baseSeries={tsData ?? undefined}
                    baseLabel={baseLabel}
                />
            </div>
        </div>
    );
};