// src/types/cleaning.ts
export type CleaningMethod = "None" | "fixedOutbounds" | "outerPercentile"|"lowerPercentile"|"upperPercentile" | "zScore" | "peirce";

export interface CleaningFormResult {
    method: CleaningMethod;
    min?: number;
    max?: number;
    percentile?: number;
    zScore?: number;
    removeStatus?: string[];
}