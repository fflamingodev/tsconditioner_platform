// src/hooks/usePolishing.ts
import { useCallback, useState } from "react";
import { message } from "antd";

import type { TsContainerJSON } from "../types/tstransports";
import type { PolishRequest } from "../types/polishing";

type UsePolishingOptions = {
    successMessage?: string;
    errorPrefix?: string;
};

export function usePolishing(
    postPolishing: (request: PolishRequest) => Promise<TsContainerJSON>,
    options?: UsePolishingOptions
) {
    const [tsContainerJSON, setTsContainerJSON] = useState<TsContainerJSON | null>(null);
    const [polishingBusy, setPolishingBusy] = useState<boolean>(false);

    const runPolishing = useCallback(
        async (request: PolishRequest) => {
            setPolishingBusy(true);
            try {
                const data = await postPolishing(request);
                setTsContainerJSON(data);
                message.success(options?.successMessage ?? "Processing completed successfully!");
                return data;
            } catch (err: unknown) {
                const msg =
                    typeof err === "object" && err !== null && "message" in err
                        ? String((err as { message?: unknown }).message ?? "Unknown error")
                        : "Unknown error";

                console.error("❌ Error in runPolishing:", err);
                message.error(`${options?.errorPrefix ?? "Processing failed"}: ${msg}`);
                return null;
            } finally {
                setPolishingBusy(false);
            }
        },
        [postPolishing, options?.successMessage, options?.errorPrefix]
    );

    return {
        tsContainerJSON,
        setTsContainerJSON, // utile si tu veux reset depuis une page
        polishingBusy,
        runPolishing,
    };
}