package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"go_tsconditioner/internal/types"
	"net/http"
)

func DevicesListHandler(devices []types.Device) gin.HandlerFunc {
	return func(c *gin.Context) {
		if len(devices) == 0 {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Aucun device trouvé dans Telemetry (cache vide)",
			})
			return
		}
		c.JSON(http.StatusOK, devices)
	}

}
