package types

import "time"

type LastTelemetryPoint struct {
	Device     string    `db:"device" json:"device"`
	Serial     *string   `db:"serial,omitempty" json:"serial,omitempty"`
	DataSource string    `db:"datasource" json:"datasource"`
	LastTime   time.Time `db:"last_time" json:"last_time"`
	LastValue  *float64  `db:"last_value,omitempty" json:"last_value,omitempty"`
}
