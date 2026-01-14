package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"go_tsconditioner/internal/dboperations"
	"go_tsconditioner/internal/types"
	"time"
)

func TodayContainer(db *sqlx.DB, cachedDevices *[]types.Device) gin.HandlerFunc {
	return func(c *gin.Context) {
		deviceStr := c.Param("device")
		deviceID, err := uuid.Parse(deviceStr)
		if err != nil {
			c.JSON(400, gin.H{"error": "invalid device uuid"})
			return
		}

		loc, _ := time.LoadLocation("Europe/Luxembourg")

		container, err := dboperations.BuildTodayTsContainerForDevice(db, *cachedDevices, deviceID, loc)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, container.ToJSON())

	}
}
