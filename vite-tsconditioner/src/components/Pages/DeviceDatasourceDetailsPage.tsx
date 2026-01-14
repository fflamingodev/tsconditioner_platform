// src/pages/DeviceDatasourceDetailsPage.tsx
import { useEffect } from "react";
import { Button, Form, DatePicker, InputNumber, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { VisualisationContainer } from "../VisualisationContainer.tsx";
import { useDeviceDatasourceDetails } from "../../hooks/useDeviceDatasourceDetails";
import { usePolishing } from "../../hooks/usePolishing";
import { postPolishing } from "../../http/polishingApi";
import type { PolishRequest } from "../../types/polishing";

type FormValues = {
    from?: Dayjs;
    to?: Dayjs;
    limit?: number;
};

const DeviceDatasourceDetailsPage: React.FC = () => {
    const {
        tsData,
        tsMemId,

        selectedDeviceId,
        selectedDataSource,
        setSelectedDataSource,
        handleDeviceChange,

        deviceOptions,
        dataSourceOptions,

        loadRemoteData,
    } = useDeviceDatasourceDetails();

    const { tsContainerJSON, runPolishing } = usePolishing(postPolishing, {
        successMessage: "Processing completed successfully!",
        errorPrefix: "Processing failed",
    });

    const [form] = Form.useForm<FormValues>();

    useEffect(() => {
        form.setFieldsValue({ to: dayjs() });
    }, [form]);

    const handleLoadDataClick = () => {
        const from = form.getFieldValue("from");
        const to = form.getFieldValue("to");
        const limit = form.getFieldValue("limit");
        loadRemoteData({ from, to, limit });
    };

    const handlePolishing = (request: PolishRequest) => {
        runPolishing(request);
    };

    return (
        <div style={{ padding: 20 }}>
            <h2>One Device, One Data Source</h2>

            <Form layout="inline" style={{ marginBottom: 8 }}>
                <Form.Item label="Device">
                    <Select
                        style={{ minWidth: 260 }}
                        placeholder="Select a device"
                        allowClear
                        value={selectedDeviceId}
                        onChange={handleDeviceChange}
                        options={deviceOptions}
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

                <Form.Item label="Data source">
                    <Select
                        style={{ minWidth: 260 }}
                        placeholder="Select a data source"
                        allowClear
                        value={selectedDataSource}
                        onChange={setSelectedDataSource}
                        disabled={!selectedDeviceId}
                        options={dataSourceOptions}
                        showSearch
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>
            </Form>

            <Form form={form} layout="inline" style={{ marginBottom: 8 }}>
                <Form.Item
                    name="from"
                    label="From"
                    rules={[{ required: true, message: "Veuillez choisir une date de début" }]}
                >
                    <DatePicker showTime />
                </Form.Item>

                <Form.Item
                    name="to"
                    label="To"
                    rules={[{ required: true, message: "Veuillez choisir une date de fin" }]}
                >
                    <DatePicker showTime />
                </Form.Item>

                <Form.Item
                    name="limit"
                    label="Limit"
                    initialValue={0}
                    tooltip="Maximum Number of Requested Points (0 = No Limit)"
                >
                    <InputNumber min={0} step={100} />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        onClick={handleLoadDataClick}
                        disabled={!selectedDeviceId || !selectedDataSource}
                    >
                        Load Data
                    </Button>
                </Form.Item>
            </Form>

            <VisualisationContainer
                tsData={tsData}
                tsContainerJSON={tsContainerJSON}
                tsMemId={tsMemId}
                baseLabel="RemoteData"
                onPolishing={handlePolishing}
            />
        </div>
    );
};

export default DeviceDatasourceDetailsPage;