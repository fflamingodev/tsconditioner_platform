// CleaningSubForm.tsx
import { Form, InputNumber, Select, Row, Col } from "antd";
import type { CleaningMethod } from "../types/cleaning";

const { Option } = Select;

interface CleaningSubFormProps {
    namePrefix: string; // ex: "cleaning1" ou "cleaning2"
    title?: string;
}

const CleaningSubForm = ({ namePrefix, title }: CleaningSubFormProps) => {
    // On regarde la méthode *dans* ce sous-form
    const method = Form.useWatch<CleaningMethod>([namePrefix, "method"]);

    return (
        <>
            {title && <h3>{title}</h3>}

            <Row gutter={16} wrap={false} style={{ width: "100%" }}>
                <Col flex="1.4">
                    <Form.Item
                        label="Cleaning Method"
                        name={[namePrefix, "method"]}
                        rules={[{ required: true, message: "Choisis une méthode" }]}
                        initialValue="None"
                    >
                        <Select>
                            <Option value="None">None</Option>
                            <Option value="fixedOutbounds">Fixed Outbounds</Option>
                            <Option value="outerPercentile">Outer Percentiles</Option>
                            <Option value="lowerPercentile">Lower Percentile</Option>
                            <Option value="upperPercentile">Upper Percentile</Option>
                            <Option value="zScore">zScore</Option>
                            <Option value="peirce">Peirce</Option>
                        </Select>
                    </Form.Item>
                </Col>

                {method === "fixedOutbounds" && (
                    <>
                        <Col flex="0.8">
                            <Form.Item
                                label="Min"
                                name={[namePrefix, "min"]}
                                rules={[{ required: true, message: "Indique une borne min" }]}
                            >
                                <InputNumber style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col flex="0.8">
                            <Form.Item
                                label="Max"
                                name={[namePrefix, "max"]}
                                rules={[{ required: true, message: "Indique une borne max" }]}
                            >
                                <InputNumber style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </>
                )}

                {method === "outerPercentile" && (
                    <Col flex="0.8">
                        <Form.Item
                            label="Perc. (% x 2)"
                            name={[namePrefix, "percentile"]}
                            rules={[{ required: true, message: "Indique un percentile" }]}
                        >
                            <InputNumber min={0} max={50} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                )}
                {method === "lowerPercentile" && (
                    <Col flex="0.8">
                        <Form.Item
                            label="Perc. (lower %)"
                            name={[namePrefix, "percentile"]}
                            rules={[{ required: true, message: "Indique un percentile" }]}
                        >
                            <InputNumber min={0} max={50} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                )}
                {method === "upperPercentile" && (
                    <Col flex="0.8">
                        <Form.Item
                            label="Perc. (upper %)"
                            name={[namePrefix, "percentile"]}
                            rules={[{ required: true, message: "Indique un percentile" }]}
                        >
                            <InputNumber min={0} max={50} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                )}

                {method === "zScore" && (
                    <Col flex="0.8">
                        <Form.Item
                            label="Seuil z-score"
                            name={[namePrefix, "zScore"]}
                            rules={[{ required: true, message: "Indique un seuil" }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    </Col>
                )}
            </Row>
        </>
    );
};
export default CleaningSubForm;