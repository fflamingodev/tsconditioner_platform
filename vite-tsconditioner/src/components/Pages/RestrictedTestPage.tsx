import { useEffect, useState } from "react";
import { Card, Alert, Spin } from "antd";
import axios from "axios";

type AccessGranted = {
    ok: boolean;
    userId: string;
    username: string;
    roles: string[];
};

export const RestrictedTestPage = () => {
    const [data, setData] = useState<AccessGranted | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setErr(null);
                setData(null);

                // IMPORTANT: axios doit déjà injecter le Bearer token (interceptor)
                const res = await axios.get<AccessGranted>("/timeseries/restricted/accessgranted");
                setData(res.data);
            } catch (e: any) {
                const msg =
                    e?.response?.data?.error ||
                    e?.response?.statusText ||
                    e?.message ||
                    "unknown error";
                setErr(msg);
            }
        })();
    }, []);

    return (
        <Card title="Restricted test">
            {!data && !err && <Spin />}

            {err && (
                <Alert
                    type="error"
                    message="Access denied"
                    description={err}
                    showIcon
                />
            )}

            {data && (
                <Alert
                    type="success"
                    message="Access granted"
                    description={
                        <div>
                            <div><b>UserID:</b> {data.userId}</div>
                            <div><b>Username:</b> {data.username}</div>
                            <div><b>Roles:</b> {data.roles.join(", ")}</div>
                        </div>
                    }
                    showIcon
                />
            )}
        </Card>
    );
};