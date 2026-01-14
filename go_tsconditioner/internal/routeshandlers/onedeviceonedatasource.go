package routeshandlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/dboperations"
	"go_tsconditioner/internal/store"
	"go_tsconditioner/internal/types"
	"log"
	"net/http"
)

func OneDeviceOneDataSource(DB *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Lire le JSON envoyé par React
		var req types.OneDeviceOneDatasourceRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Printf("❌ Erreur bind JSON OneDeviceOneDatasourceRequest: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "JSON invalide ou incomplet",
			})
			return
		}

		if req.Device == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "paramètre 'device' manquant",
			})
			return
		}

		var rows []dboperations.Telemetry
		if req.DataSource == "" {
			log.Printf("❌ Erreur SELECT in telemetry (device only)")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erreur lors de la lecture de Telemetry",
			})
			return
		} else {
			sqlQuery := `
				SELECT *
				FROM "Telemetry"
				WHERE device = $1
					AND datasource = $2
					AND time>=$3
				  	AND time<=$4
			`
			if req.Limit > 0 {
				sqlQuery += fmt.Sprintf(" LIMIT %d", req.Limit)
			}
			if err := DB.Select(&rows, sqlQuery, req.Device, req.DataSource, req.From, req.To); err != nil {
				log.Printf("❌ Erreur SELECT in telemetry (device+datasource): %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Erreur lors de la lecture de Telemetry",
				})
				return
			}
		}

		if len(rows) == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Aucune donnée Telemetry pour ce device",
			})
			return
		}

		// Conversion Telemetry -> TimeSeries via la fonction du package dboperations
		//var tsc timeseries.TsContainer
		pts, err := dboperations.TelemetryRowsToTimeSeries(rows)
		if err != nil {
			log.Printf("❌ Erreur conversion Telemetry -> TimeSeries: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erreur lors de la conversion en TimeSeries",
			})
			return
		}
		pts.MemId = store.NewMemId()
		pts.Sort_Deltas_Stats()
		store.GlobalTsStore.Save(pts)
		c.JSON(http.StatusOK, pts.ToJSON())
	}
}
