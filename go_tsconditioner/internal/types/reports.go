package types

import (
	"time"
)

// Pour React (groupé)
type DeviceSummary struct {
	Device      string           `json:"device"`
	Serial      *string          `json:"serial,omitempty"`
	DataSources []DataSourceInfo `json:"datasources"`
}

type DataSourceInfo struct {
	Name      string    `json:"name"`
	LastTime  time.Time `json:"last_time"`
	LastValue *float64  `json:"last_value,omitempty"`
}

type Report struct {
	GeneratedAt  time.Time       `json:"generated_at"`
	Devices      []DeviceSummary `json:"devices"`
	CountDevices int             `json:"count_devices"`
	CountPairs   int             `json:"count_pairs"` // nb (device,datasource)
}
