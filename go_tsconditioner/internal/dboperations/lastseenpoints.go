package dboperations

import (
	"context"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/types"
)

func ListLastSeenPoints(ctx context.Context, db *sqlx.DB) ([]types.LastTelemetryPoint, error) {

	const q = `
		SELECT DISTINCT ON (device, datasource)
			device,
			serial,
			datasource,
			time  AS last_time,
			value AS last_value
		FROM "Telemetry"
		WHERE time >= now() - interval '1 hour'
		ORDER BY device, datasource, time DESC;
	`

	var rows []types.LastTelemetryPoint
	if err := db.SelectContext(ctx, &rows, q); err != nil {
		return nil, err
	}

	return rows, nil
}
