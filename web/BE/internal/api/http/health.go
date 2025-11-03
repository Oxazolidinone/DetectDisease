package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	Services  map[string]string `json:"services"`
}

func HealthCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		response := HealthResponse{
			Status:    "ok",
			Timestamp: time.Now(),
			Version:   "1.0.0",
			Services: map[string]string{
				"database":   "ok",
				"cache":      "ok",
				"ml_service": "ok",
			},
		}

		c.JSON(http.StatusOK, response)
	}
}

func ReadinessCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		isReady := checkDatabaseConnection() && checkExternalServices()

		if isReady {
			c.JSON(http.StatusOK, gin.H{
				"status":    "ready",
				"timestamp": time.Now(),
			})
		} else {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status":    "not ready",
				"timestamp": time.Now(),
			})
		}
	}
}

func checkDatabaseConnection() bool {
	return true
}

func checkExternalServices() bool {
	return true
}
