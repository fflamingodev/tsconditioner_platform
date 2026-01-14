// PolishForm.tsx
import { Button, Form, Row, Col, Card } from "antd";

import CleaningSubForm from "./CleaningSubForm";
import { RegularizeSubForm } from "./RegularizeSubForm";
import RemoveStatusSubForm from "./RemoveStatusSubForm";
import InterpolateSubForm from "./InterpolateSubForm";
import ReduceSubForm from "./ReduceSubForm";

import type { CleaningFormResult } from "../types/cleaning";
import type { AggKind, FreqUnit } from "../types/regularize";
import type { PolishRequest, RemoveStatusResult } from "../types/polishing.ts";

interface PolishFormInnerValues {
    memId: number;
    reduce: boolean;
    regularize: {
        freqValue: number | null;
        freqUnit: FreqUnit | null;
        aggKind: AggKind | null;
    };

    cleaning1: CleaningFormResult;
    cleaning2: CleaningFormResult;

    removeStatus: RemoveStatusResult;
    interp: {
        method: string;
    };
}

interface PolishFormProps {
    memId: number;
    onSubmit: (payload: PolishRequest) => Promise<void> | void;
}

const unitToSeconds: Record<FreqUnit, number> = {
    seconds: 1,
    minutes: 60,
    hours: 3600,
    days: 86400,
};

export const PolishForm = ({ memId, onSubmit }: PolishFormProps) => {
    const [form] = Form.useForm<PolishFormInnerValues>();

    const handleFinish = (values: PolishFormInnerValues) => {
        const { regularize, cleaning1, cleaning2 } = values;

        let freqSeconds: number | null = null;
        let agg: AggKind | null = null;

        if (
            regularize &&
            regularize.freqValue != null &&
            regularize.freqUnit != null &&
            regularize.aggKind != null
        ) {
            freqSeconds = regularize.freqValue * unitToSeconds[regularize.freqUnit];
            agg = regularize.aggKind;
        }

        const payload: PolishRequest = {
            memId,
            freqSeconds,
            agg,
            reduce: values.reduce,

            method1: cleaning1.method,
            min1: cleaning1.min ?? 0,
            max1: cleaning1.max ?? 0,
            percent1: cleaning1.percentile ?? 0,
            lvl1: cleaning1.zScore ?? 0,

            method2: cleaning2.method,
            min2: cleaning2.min ?? 0,
            max2: cleaning2.max ?? 0,
            percent2: cleaning2.percentile ?? 0,
            lvl2: cleaning2.zScore ?? 0,

            interp: values.interp.method,
        };

        onSubmit(payload);
    };

    return (
        <Form<PolishFormInnerValues>
            form={form}
            layout="vertical"
            initialValues={{
                memId,
                reduce: false,
                regularize: { freqValue: 60, freqUnit: "seconds", aggKind: "average" },
                cleaning1: { method: "None" },
                cleaning2: { method: "None" },
                removeStatus: { removeStatuses: [] },
                interp: { method: "None" },
            }}
            onFinish={handleFinish}
        >
            {/* ✅ Reduce dans une Card pleine largeur (même largeur que la grille dessous) */}
            {/* ✅ Reduce = largeur d’une colonne */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card size="small" title="Reduce">
                        <ReduceSubForm namePrefix="reduce" />
                    </Card>
                </Col>
            </Row>

            {/* ✅ 3 colonnes : Cleaning1 / Regularize / Cleaning2 */}
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                <Col xs={24} md={8}>
                    <Card size="small" title="Cleaning 1">
                        {/* si CleaningSubForm affiche déjà un titre en interne, neutralise-le */}
                        <CleaningSubForm namePrefix="cleaning1" title={undefined as never} />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    {/* ✅ "Regularization" UNE SEULE FOIS : ici, dans la Card */}
                    <Card size="small" title="">
                        {/* si RegularizeSubForm affiche un titre interne, neutralise-le (si prop existe) */}
                        <RegularizeSubForm namePrefix="regularize" />
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card size="small" title="Cleaning 2">
                        <CleaningSubForm namePrefix="cleaning2" title={undefined as never} />
                    </Card>
                </Col>
            </Row>

            {/* Le reste en dessous */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} md={12}>
                    <Card size="small" title="Remove status">
                        <RemoveStatusSubForm namePrefix="removeStatus" title={undefined as never} />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card size="small" title="Interpolate">
                        <InterpolateSubForm namePrefix="interp" />
                    </Card>
                </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit">
                    Process
                </Button>
            </Form.Item>
        </Form>
    );
};