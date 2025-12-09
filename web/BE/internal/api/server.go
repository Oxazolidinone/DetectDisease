package api

import (
	"go-crawler/web/BE/internal/api/http"
	"go-crawler/web/BE/internal/interfaces/handlers"

	"github.com/gin-gonic/gin"
)

func SetUpRoutes(r *gin.Engine, proteinHandler *handlers.ProteinHandler, mlHandler *handlers.MLHandler) {
	r.Use(CORSMiddleware())
	r.Use(ErrorHandlingMiddleware())

	r.GET("/health", http.HealthCheck())
	r.GET("/ready", http.ReadinessCheck())

	api := r.Group("/api")
	{
		// ML Service Proxy Routes
		api.POST("/predict", mlHandler.PredictDisease)
		api.POST("/similarity", mlHandler.CalculateSimilarity)
		api.POST("/align", mlHandler.AlignSequences)
		api.GET("/ml/health", mlHandler.HealthCheck)
	}

	apiV1 := r.Group("/api/v1")
	{
		proteins := apiV1.Group("/proteins")
		{
			proteins.GET("", proteinHandler.SearchProteins)
			proteins.POST("", proteinHandler.CreateProtein)
			proteins.GET("/:id", proteinHandler.GetProteinByID)
			proteins.PUT("/:id", proteinHandler.UpdateProtein)
			proteins.DELETE("/:id", proteinHandler.DeleteProtein)
			proteins.POST("/compare", proteinHandler.CompareProteins)
			proteins.POST("/analyze", proteinHandler.AnalyzeSequence)
			proteins.GET("/stats", proteinHandler.GetProteinStats)
			proteins.POST("/bulk", proteinHandler.BulkCreateProteins)
		}
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
}

func ErrorHandlingMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			c.JSON(500, gin.H{
				"error":   "Internal Server Error",
				"details": c.Errors.String(),
			})
		}
	})
}
