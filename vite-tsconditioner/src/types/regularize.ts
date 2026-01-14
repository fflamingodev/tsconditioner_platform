// types/regularize.ts
export type AggKind =
    | "average"
    | "maximum"
    | "minimum"
    | "last"
    | "open"
    | "countValid"
    | "median"
    | "slope"
    | "integral"
    | "incrementalCounter";

export type FreqUnit = "seconds" | "minutes" | "hours" | "days";

