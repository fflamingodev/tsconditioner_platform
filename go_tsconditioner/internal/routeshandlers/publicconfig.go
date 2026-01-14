package routeshandlers

import (
	"github.com/gin-gonic/gin"
	"go_tsconditioner/internal/config"
	"net/http"
)

func HandlePublicConfig(cfg config.PublicReactAuthConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, cfg)
	}
}
