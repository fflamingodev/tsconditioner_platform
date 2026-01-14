// src/components/InterpolateSubForm.tsx
import { Form, Select, Row, Col } from "antd";

const { Option } = Select;

interface InterpolateSubFormProps {
    namePrefix: string; // ex: "interp1" ou "interp2"
    title?: string;
}

const InterpolateSubForm: React.FC<InterpolateSubFormProps> = ({
                                                                   namePrefix,
                                                                   title,
                                                               }) => {
    return (
        <>
            {title && <h3>{title}</h3>}

            <Row gutter={16} wrap={false} style={{ width: "100%" }}>
                <Col flex="1.4">
                    <Form.Item
                        label="Interpolation"
                        name={[namePrefix, "method"]}
                        rules={[
                            {
                                required: true,
                                message: "Choisis une méthode d'interpolation",
                            },
                        ]}
                        initialValue="None"
                    >
                        <Select>
                            <Option value="None">None</Option>
                            <Option value="Linear">Linear</Option>
                            <Option value="Nearest">Nearest</Option>
                            <Option value="ForwardFill">Forward fill</Option>
                            <Option value="BackwardFill">Backward fill</Option>
                            <Option value="LogLinear">Log-linear</Option>
                            <Option value="CubicSpline">Cubic spline</Option>
                            <Option value="MonotoneSpline">Monotone spline</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
};

export default InterpolateSubForm;