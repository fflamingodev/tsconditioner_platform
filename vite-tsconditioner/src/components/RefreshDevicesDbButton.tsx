// src/components/RefreshDevicesDbButton.tsx
import { Button } from "antd";
import { useRefreshDevicesDB } from "../hooks/useRefreshDevicesDB";

type Props = {
    label?: string;
    type?: "primary" | "default" | "dashed" | "link" | "text";
};

export default function RefreshDevicesDbButton({ label = "Refresh Devices Database", type = "primary" }: Props) {
    const { refreshDevices, loading } = useRefreshDevicesDB();

    return (
        <Button type={type} onClick={refreshDevices} loading={loading}>
            {label}
        </Button>
    );
}