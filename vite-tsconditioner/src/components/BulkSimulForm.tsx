// src/components/BulkSimulForm.tsx
import { Form, Input, DatePicker, Select, InputNumber, Button, Row, Col } from "antd";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;

export interface BulkSimulFormValues {
    name: string;
    start: Dayjs;
    periodSeconds: number;
    n: number;
    mean: number;
    stdDev: number;
    jitter: number;
}

interface BulkSimulFormProps {
    onSubmit: (values: BulkSimulFormValues) => void;
}

const BulkSimulForm = ({ onSubmit }:BulkSimulFormProps) => {
    const [form] = Form.useForm<BulkSimulFormValues>();

    return (
        <Form<BulkSimulFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
                start: dayjs(),
                periodSeconds: 10,
                n: 1000,
                mean: 100,
                stdDev: 20,
                jitter: 0,
            }}
        >
            <Row gutter={16} wrap={false} style={{ width: "100%" }}>
                <Col flex="1">
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: false, message: "Le nom est requis" }]}
                    >
                        <Input />
                    </Form.Item>
                </Col>

                <Col flex="1.4">
                    <Form.Item
                        label="Start Date"
                        name="start"
                        rules={[{ required: true, message: "La date est requise" }]}
                    >
                        <DatePicker showTime style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col flex="0.8">
                    <Form.Item
                        label="x secs"
                        name="periodSeconds"
                        rules={[{ required: true, message: "La période est requise" }]}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col flex="1">
                    <Form.Item
                        label="Sample Size"
                        name="n"
                        rules={[{ required: true, message: "La taille de l'échantillon est requise" }]}
                    >
                        <Select>
                            <Option value={100}>100</Option>
                            <Option value={1000}>1 000</Option>
                            <Option value={10000}>10 000</Option>
                            <Option value={100000}>100 000</Option>
                            <Option value={1000000}>1 000 000</Option>

                        </Select>
                    </Form.Item>
                </Col>

                <Col flex="1">
                    <Form.Item
                        label="Mean"
                        name="mean"
                        rules={[
                            {
                                validator: (_, value) =>
                                    value === 0 || value
                                        ? Promise.resolve()
                                        : Promise.reject("La moyenne est requise"),
                            },
                        ]}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col flex="1">
                    <Form.Item
                        label="StdDev"
                        name="stdDev"
                        rules={[{ required: true, message: "L'écart-type est requis" }]}
                    >
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col flex="1">
                    <Form.Item label="Jitter" name="jitter">
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col flex="0 0 120px">
                    <Form.Item label=" " colon={false}>
                        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
                            Run Simulation
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

export default BulkSimulForm;