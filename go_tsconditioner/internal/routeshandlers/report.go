package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/dboperations"
	"go_tsconditioner/internal/types"
	"net/http"
	"sort"
	"time"
)

func LastSeenPoints_json(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := dboperations.ListLastSeenPoints(c.Request.Context(), db)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		rep := Build(rows)
		c.JSON(http.StatusOK, rep)
	}
}

func Build(rows []types.LastTelemetryPoint) types.Report {
	byDevice := map[string]*types.DeviceSummary{}

	for _, r := range rows {
		d, ok := byDevice[r.Device]
		if !ok {
			d = &types.DeviceSummary{
				Device:      r.Device,
				Serial:      r.Serial,
				DataSources: []types.DataSourceInfo{},
			}
			byDevice[r.Device] = d
		}

		d.DataSources = append(d.DataSources, types.DataSourceInfo{
			Name:      r.DataSource,
			LastTime:  r.LastTime,
			LastValue: r.LastValue,
		})
	}

	devices := make([]types.DeviceSummary, 0, len(byDevice))
	for _, d := range byDevice {
		sort.Slice(d.DataSources, func(i, j int) bool {
			return d.DataSources[i].Name < d.DataSources[j].Name
		})
		devices = append(devices, *d)
	}
	sort.Slice(devices, func(i, j int) bool { return devices[i].Device < devices[j].Device })

	return types.Report{
		GeneratedAt:  time.Now().UTC(),
		Devices:      devices,
		CountDevices: len(devices),
		CountPairs:   len(rows),
	}
}
