package dboperations

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/timeseries"
	"go_tsconditioner/internal/types"
	"time"
)

// StartOfToday returns today's midnight in the given location.
func StartOfToday(loc *time.Location) time.Time {
	now := time.Now().In(loc)
	y, m, d := now.Date()
	return time.Date(y, m, d, 0, 0, 0, 0, loc)
}

func StartOfTomorrow(loc *time.Location) time.Time {
	return StartOfToday(loc).AddDate(0, 0, 1)
}

type telemetryRow struct {
	T time.Time `db:"time"`
	V float64   `db:"value"`
}

func LoadTimeSeriesForDeviceDataSourceToday(
	db *sqlx.DB,
	deviceID uuid.UUID,
	datasource string,
	loc *time.Location,
) (*timeseries.TimeSeries, error) {

	from := StartOfToday(loc)
	to := StartOfTomorrow(loc)

	const q = `
		SELECT time, value
		FROM "Telemetry"
		WHERE device = $1
		  AND datasource = $2
		  AND time >= $3
		  AND time <  $4
		ORDER BY time;
	`

	var rows []telemetryRow
	if err := db.Select(&rows, q, deviceID.String(), datasource, from, to); err != nil {
		return nil, fmt.Errorf("select telemetry today (device=%s, ds=%s): %w", deviceID, datasource, err)
	}

	ts := &timeseries.TimeSeries{
		Name:    datasource,
		Comment: fmt.Sprintf("Telemetry for %s (today)", datasource),
	}

	for _, r := range rows {
		du := timeseries.DataUnit{
			Chron: r.T,
			Meas:  r.V,
		}
		ts.AddDataUnit(du)

	}
	return ts, nil
}
func BuildTodayTsContainerForDevice(
	db *sqlx.DB,
	cachedDevices []types.Device,
	deviceID uuid.UUID,
	loc *time.Location,
) (*timeseries.TsContainer, error) {

	// 1) retrouver le device dans le cache
	var dev *types.Device
	for i := range cachedDevices {
		if cachedDevices[i].DeviceID == deviceID {
			dev = &cachedDevices[i]
			break
		}
	}
	if dev == nil {
		return nil, fmt.Errorf("device not found in cache: %s", deviceID)
	}

	// 2) container
	c := &timeseries.TsContainer{
		Name:    dev.DeviceName,
		Comment: "All datasources - today",
		Ts:      make(map[string]*timeseries.TimeSeries),
	}

	// 3) une TimeSeries par datasource
	for _, ds := range dev.DataSources {
		if ds.Name == "" {
			continue
		}
		ts, err := LoadTimeSeriesForDeviceDataSourceToday(db, dev.DeviceID, ds.Name, loc)
		if err != nil {
			return nil, err
		}
		c.Ts[ds.Name] = ts
	}

	return c, nil
}
