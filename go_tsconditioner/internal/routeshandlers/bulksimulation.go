package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"go_tsconditioner/internal/store"
	"go_tsconditioner/internal/timeseries"
	"go_tsconditioner/internal/types"
	"net/http"
	"time"
)

// dans ton package handlers ou similaire

func BulkSimulator(c *gin.Context) {
	var req types.BulkSimulRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	start, err := time.Parse(time.RFC3339, req.Start)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date"})
		return
	}

	period := time.Duration(req.PeriodSeconds) * time.Second

	// sécurisation / valeurs par défaut
	if req.Mean == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mean is required"})
		return
	}
	if req.StdDev == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "stdDev is required"})
		return
	}

	mean := *req.Mean
	stdDev := *req.StdDev

	jitter := time.Duration(0)
	if req.Jitter != nil {
		jitter = *req.Jitter
	}

	ts := timeseries.BulkSimul(
		req.Name,
		start,
		period,
		req.N,
		mean,
		stdDev,
		jitter,
	)
	ts.MemId = store.NewMemId()
	ts.Sort_Deltas_Stats()
	store.GlobalTsStore.Save(&ts)
	c.JSON(http.StatusOK, ts.ToJSON())
}
