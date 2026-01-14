// src/pages/TodayDeviceGraphsPage.tsx
import React from "react";
import { Card, Col, Row, Select, Space, Typography, Spin, Button } from "antd";
import { GraphCard } from "../GraphCard";
import { useTodayDeviceGraphs } from "../../hooks/useTodayDeviceGraphs";

const { Title, Text } = Typography;

export const TodayDeviceGraphsPage: React.FC = () => {
    const {
        deviceOptions,
        seriesEntries,
        container,

        selectedDevice,
        setSelectedDevice,
        loadedDevice,

        loadingDevices,
        loadingContainer,
        canLoad,

        load,
        clear,
    } = useTodayDeviceGraphs();

    return (
        <div style={{ padding: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Title level={3} style={{ margin: 0 }}>
                    Today graphs
                </Title>

                <Card size="small">
                    <Space direction="vertical" style={{ width: "100%" }} size="small">
                        <Text>Device</Text>

                        <Select
                            showSearch
                            allowClear
                            loading={loadingDevices}
                            options={deviceOptions}
                            placeholder="Select a device"
                            value={selectedDevice}
                            onChange={(v) => setSelectedDevice(v ?? undefined)}
                            style={{ width: "100%" }}
                            filterOption={(input, option) => {
                                const label = option?.label;
                                const labelStr = typeof label === "string" ? label : String(label ?? "");
                                return labelStr.toLowerCase().includes(input.toLowerCase());
                            }}
                        />

                        <Space>
                            <Button type="primary" onClick={load} disabled={!canLoad}>
                                Load
                            </Button>

                            <Button onClick={clear} disabled={loadingContainer}>
                                Clear
                            </Button>

                            {loadingContainer && (
                                <Space size="small">
                                    <Spin size="small" />
                                    <Text type="secondary">Loading…</Text>
                                </Space>
                            )}
                        </Space>

                        {loadedDevice && <Text type="secondary">Chargé : {loadedDevice}</Text>}
                    </Space>
                </Card>

                <Card size="small" style={{ width: "100%" }}>
                    {loadingContainer ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                            <Spin />
                        </div>
                    ) : !loadedDevice ? (
                        <Text type="secondary">Choisis un device puis clique sur Load.</Text>
                    ) : !container ? (
                        <Text type="secondary">Aucune réponse (ou pas encore chargée).</Text>
                    ) : seriesEntries.length === 0 ? (
                        <Text type="secondary">Aucune donnée aujourd’hui pour ce device.</Text>
                    ) : (
                        <div style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto", paddingRight: 6 }}>
                            <Row gutter={[12, 12]}>
                                {seriesEntries.map(([key, ts]) => (
                                    <Col key={key} xs={24} md={12}>
                                        <GraphCard title={key} ts={ts} height={260} />
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    )}
                </Card>
            </Space>
        </div>
    );
};
