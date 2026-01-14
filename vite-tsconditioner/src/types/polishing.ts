
export type StatusString = "StOK" | "StMissing" | "StOutlier" | "StInvalid" | "StRejected";

export interface RemoveStatusResult {
    removeStatuses: StatusString[];
}

export interface PolishRequest {
    memId: number;
    reduce: boolean;
    freqSeconds: number | null;
    agg: string | null;

    method1: string;
    min1: number;
    max1: number;
    percent1: number;
    lvl1: number;

    method2: string;
    min2: number;
    max2: number;
    percent2: number;
    lvl2: number;

    interp: string;
}