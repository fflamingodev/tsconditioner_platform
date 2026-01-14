// src/types/reportApi.ts

export interface ReportLatestJSON {
    generated_at: string;
    devices: ReportDevice[];
}

export interface ReportDevice {
    device: string;   // UUID
    serial: string;
    datasources: ReportDataSource[];
}

export interface ReportDataSource {
    name: string;
    last_time: string;     // RFC3339
    last_value: number;    // chez toi c'est parfois énorme, donc number (float64)
}