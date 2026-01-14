package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/dboperations"
	"log"
	"net/http"
)

func RefreshDevicesDB(remoteDB *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		if _, err := dboperations.LoadDevicesWithDataSourcesRemote(remoteDB); err != nil {
			log.Printf("❌ Refresh devices failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"ok":    false,
				"error": err.Error(),
			})
			return
		}

		log.Println("✅ Devices database refreshed")
		c.JSON(http.StatusOK, gin.H{
			"ok": true,
		})
	}
}
