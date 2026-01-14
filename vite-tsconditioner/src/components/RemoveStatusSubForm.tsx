// src/components/RemoveStatus.tsx
import {Form, Checkbox, Row, Col} from "antd";
import type { StatusString } from "../types/polishing.ts";

const statusOptions: { label: string; value: StatusString }[] = [
    { label: "StMissing", value: "StMissing" },
    { label: "StOutlier", value: "StOutlier" },
    { label: "StInvalid", value: "StInvalid" },
    { label: "StRejected", value: "StRejected" },
    // volontairement pas StOK
];

interface RemoveStatusSubFormProps {
    namePrefix: string; // ex: "removeStatus"
    title?: string;
}

export const RemoveStatusSubForm = ({ namePrefix, title }: RemoveStatusSubFormProps) => {
    return (
        <div style={{ marginTop: 24 }}>
            {title && <h3>{title}</h3>}

            <Row gutter={16} style={{ width: "100%" }}>
                <Col flex="1">
                    <Form.Item
                        label="Remove status"
                        name={[namePrefix, "removeStatuses"]}
                        initialValue={["StOutlier"]}
                    >
                        <Checkbox.Group options={statusOptions} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );
};

export default RemoveStatusSubForm;