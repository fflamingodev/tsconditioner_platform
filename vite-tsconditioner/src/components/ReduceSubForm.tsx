// src/components/ReduceSubForm.tsx
import { useEffect } from "react";
import { Form, Checkbox } from "antd";

interface ReduceSubFormProps {
    namePrefix: string; // ex: "reduce"
}

export const ReduceSubForm = ({ namePrefix }: ReduceSubFormProps) => {
    const form = Form.useFormInstance();

    // valeur par défaut : false si non défini
    useEffect(() => {
        if (!form) return;

        const current = form.getFieldValue(namePrefix);
        if (current === undefined) {
            form.setFieldsValue({
                [namePrefix]: false,
            });
        }
    }, [form, namePrefix]);

    return (
        <>
            <h3>Reduce</h3>

            <Form.Item
                name={namePrefix}
                valuePropName="checked" // 👈 essentiel pour les bool
            >
                <Checkbox>
                    Apply Reduction (ON/OFF data only)
                </Checkbox>
            </Form.Item>
        </>
    );
};

export default ReduceSubForm;