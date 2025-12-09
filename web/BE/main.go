// Package main Protein Analysis API
// @title           Protein Analysis API
// @version         1.0
// @description     This is a comprehensive API for protein data analysis and management.
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.basic  BasicAuth

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "go-crawler/web/BE/docs"
	"go-crawler/web/BE/internal/api"
	"go-crawler/web/BE/internal/domain/services"
	"go-crawler/web/BE/internal/infrastructure/config"
	"go-crawler/web/BE/internal/infrastructure/database"
	"go-crawler/web/BE/internal/infrastructure/repositories"
	"go-crawler/web/BE/internal/interfaces/handlers"
	"go-crawler/web/BE/internal/usecases"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func main() {
	// Load configuration
	cfg, _ := config.Load()

	// Initialize database connection
	db, err := database.NewDatabase(cfg.Database)
	if err != nil {
		log.Fatal(err)
	}
	
	// Initialize ML Handler (proxy to ML service)
	mlServiceURL := os.Getenv("ML_SERVICE_URL")
	if mlServiceURL == "" {
		mlServiceURL = "http://ml_service:5001" // Default Docker internal URL
	}
	mlHandler := handlers.NewMLHandler(mlServiceURL)
	
	// Initialize dependencies
	proteinHandler := handlers.NewProteinHandler(usecases.NewProteinUseCases(repositories.NewProteinRepository(db.Conn), services.NewProteinService()))

	// Setup Gin router
	gin.SetMode(cfg.Server.Mode)
	router := gin.Default()

	// Setup routes
	api.SetUpRoutes(router, proteinHandler, mlHandler)

	// Setup Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Create HTTP server
	serverAddr := cfg.Server.Host + ":" + cfg.Server.Port
	server := &http.Server{
		Addr:           serverAddr,
		Handler:        router,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		IdleTimeout:    60 * time.Second,
		MaxHeaderBytes: 1 << 20, // 1 MB
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on %s", serverAddr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Server is shutting down...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Println("Server exited gracefully")
	}
}
