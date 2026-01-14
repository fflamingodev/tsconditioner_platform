// src/pages/RestrictedTest.tsx
import { Card, Typography, Spin, Alert, Button, Space } from "antd";
import { useRestrictedTest } from "../hooks/useRestrictedTest";

export default function RestrictedTest() {
    const { data, loading, error, reload } = useRestrictedTest();

    if (loading) return <Spin />;

    if (error) {
        return (
            <Space direction="vertical" style={{ width: "100%" }}>
                <Alert type="error" message={error} />
                <Button onClick={reload}>Réessayer</Button>
            </Space>
        );
    }

    return (
        <Card
            title="Restricted API test"
            style={{ maxWidth: 600 }}
            extra={<Button onClick={reload}>Reload</Button>}
        >
            <Typography.Paragraph>
                <strong>Status :</strong> {data?.ok ? "OK" : "KO"}
            </Typography.Paragraph>
            <Typography.Paragraph>
                <strong>Scope :</strong> {data?.scope}
            </Typography.Paragraph>
            <Typography.Paragraph>
                <strong>Message :</strong> {data?.message}
            </Typography.Paragraph>
            <Typography.Paragraph>
                <strong>Server time :</strong> {data?.time}
            </Typography.Paragraph>
        </Card>
    );
}