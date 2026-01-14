// src/types/tstransports.ts

export interface BasicStatsJSON {
    len: number;

    chmin: string;          // time.Time -> RFC3339 string
    valAtChmin: number;

    chmax: string;
    valAtChmax: number;

    chmed: string;
    chmean: string;
    chstd: string;

    msmin: number;
    chAtMsmin: string;

    msmax: number;
    chAtMsmax: string;

    msmean: number;
    msmed: number;
    msstd: number;

    // Durées en nanosecondes (time.Duration)
    dChmin_ns: number;
    chAtDChmin: string;

    dChmax_ns: number;
    chAtDChmax: string;

    dChmean_ns: number;
    dChmed_ns: number;
    dChstd_ns: number;

    dMsmin: number;
    dMsmax: number;
    dMsmed: number;
    dMsmean: number;
    dMsstd: number;

    nbreOfNaN: number;
}
export interface TimeSeriesJSON {
    id:number
    name: string;
    comment?: string;
    chron: string[];                // dates en string RFC3339
    meas: (number | null)[];        // null quand NaN côté Go
    dchron_ns: number[];             // Durées en ns
    dmeas: (number | null)[];
    status: number[];
    stats: BasicStatsJSON;          // <<— nouveau champ pour BasicStats
}
export interface TsContainerJSON {
    name: string;
    comment?: string;
    series: Record<string, TimeSeriesJSON>; // Accepted / Original / Rejected
}
export interface DeviceJSON {
    device_id: string;
    device_name: string; // serial
    datasources: DataSourcesJSON[];
}
export interface DataSourcesJSON {
    name: string;
}