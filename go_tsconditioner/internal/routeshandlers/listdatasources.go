package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"log"
	"net/http"
)

func ListDataSources(remoteDB *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ✅ 1) Lire le body JSON du POST
		type requestBody struct {
			DeviceID uuid.UUID `json:"device_id"`
		}
		var req requestBody
		if err := c.ShouldBindJSON(&req); err != nil {
			log.Printf("❌ Erreur bind JSON (ListDataSources): %v", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Requête invalide : device_id manquant ou mal formé",
			})
			return
		}

		// ✅ 2) Définir le type de réponse
		type dataSource struct {
			DataSourceName string `json:"datasource" db:"datasource"`
		}
		var rows []dataSource

		// ✅ 3) Requête SQL : toutes les datasources pour ce device
		const q = `
			SELECT DISTINCT datasource
			FROM "Telemetry"
			WHERE device = $1
			ORDER BY datasource;
		`

		if err := remoteDB.Select(&rows, q, req.DeviceID); err != nil {
			log.Printf("❌ Erreur SELECT in telemetry (ListDataSources): %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Erreur lors de la lecture de Telemetry (datasources)",
			})
			return
		}

		if len(rows) == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Aucune datasource pour ce device",
			})
			return
		}

		c.JSON(http.StatusOK, rows)
	}
}
