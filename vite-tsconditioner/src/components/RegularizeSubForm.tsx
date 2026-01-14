// src/components/RegularizeForm.tsx
import { useEffect, useState } from "react";
import { Form, InputNumber, Select, Row, Col, Switch } from "antd";
import type { AggKind, FreqUnit } from "../types/regularize";

const { Option } = Select;

interface RegularizeSubFormProps {
    namePrefix: string; // ex: "regularize"
}

export const RegularizeSubForm = ({ namePrefix }: RegularizeSubFormProps) => {
    // état local : régularisation active ou non
    const [enabled, setEnabled] = useState<boolean>(false);

    // on récupère l'instance du Form parent
    const form = Form.useFormInstance();

    // à chaque changement de "enabled", on ajuste les valeurs
    useEffect(() => {
        if (!form) return;

        if (enabled) {
            // Si on active, on remet éventuellement des valeurs par défaut
            const current = form.getFieldValue(namePrefix) || {};
            form.setFieldsValue({
                [namePrefix]: {
                    freqValue: current.freqValue ?? 60,
                    freqUnit: current.freqUnit ?? "seconds",
                    aggKind: current.aggKind ?? "average",
                },
            });
        } else {
            // ✅ MODE NO → 0 et ""
            form.setFieldsValue({
                [namePrefix]: {
                    freqValue: 0,     // 👈 Go comprend : pas de régularisation
                    freqUnit: "seconds",
                    aggKind: "",      // 👈 Go comprend : pas d’agrégation
                },
            });
        }
    }, [enabled, form, namePrefix]);

    return (
        <>
            <h3>Regularization</h3>

            {/* Switch Yes/No */}
            <Form.Item label="Apply regularization ?">
                <Switch
                    checked={enabled}
                    onChange={setEnabled}
                    checkedChildren="Yes"
                    unCheckedChildren="No"
                />
            </Form.Item>

            {/* Sous-formulaire visible seulement si enabled = true */}
            {enabled && (
                <Row gutter={16} wrap={false} style={{ width: "100%" }}>
                    <Col flex="1">
                        <Form.Item
                            label="Fréquence"
                            name={[namePrefix, "freqValue"]}
                            rules={
                                enabled
                                    ? [{ required: true, message: "Fréquence obligatoire" }]
                                    : []
                            }
                        >
                            <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col flex="1">
                        <Form.Item
                            label="Unité"
                            name={[namePrefix, "freqUnit"]}
                            rules={
                                enabled
                                    ? [{ required: true, message: "Unité obligatoire" }]
                                    : []
                            }
                        >
                            <Select<FreqUnit>>
                                <Option value="seconds">Secondes</Option>
                                <Option value="minutes">Minutes</Option>
                                <Option value="hours">Heures</Option>
                                <Option value="days">Jours</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col flex="1">
                        <Form.Item
                            label="Agrégation"
                            name={[namePrefix, "aggKind"]}
                            rules={
                                enabled
                                    ? [{ required: true, message: "Choisis une agrégation" }]
                                    : []
                            }
                        >
                            <Select<AggKind>>
                                <Option value="average">Average</Option>
                                <Option value="maximum">Maximum</Option>
                                <Option value="minimum">Minimum</Option>
                                <Option value="last">Last</Option>
                                <Option value="countValid">Count valid</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>
            )}
        </>
    );
};

export default RegularizeSubForm;