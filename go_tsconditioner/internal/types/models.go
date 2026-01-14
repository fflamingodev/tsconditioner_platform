package types

import "github.com/google/uuid"

type Device struct {
	DeviceID    uuid.UUID    `json:"device_id" db:"device"`
	DeviceName  string       `json:"device_name" db:"serial"`
	DataSources []DataSource `json:"datasources"`
}

type DataSource struct {
	Name string `json:"name" db:"datasource"`
}
