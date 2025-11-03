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

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	_ "go-crawler/web/BE/docs"
	"go-crawler/web/BE/internal/api"
	"go-crawler/web/BE/internal/domain/services"
	"go-crawler/web/BE/internal/infrastructure/Repositories"
	"go-crawler/web/BE/internal/infrastructure/config"
	"go-crawler/web/BE/internal/infrastructure/database"
	"go-crawler/web/BE/internal/interfaces/handlers"
	"go-crawler/web/BE/internal/usecases"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database connection
	db, err := database.NewDatabase(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Run database migrations
	if err := database.RunMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Load initial data if needed
	loadInitialData(db)

	// Initialize dependencies
	container := initDependencies(db)

	// Setup Gin router
	gin.SetMode(cfg.Server.Mode)
	router := gin.Default()

	// Setup routes
	api.SetUpRoutes(router, container.ProteinHandler)

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

// Container holds all application dependencies
type Container struct {
	// Repositories
	ProteinRepo *Repositories.ProteinRepositories

	// Services
	ProteinService services.ProteinDomainService
	MLService      services.MLPredictionService

	// Use Cases
	ProteinUseCases usecases.ProteinUseCases

	// Handlers
	ProteinHandler *handlers.ProteinHandler
}

// initDependencies initializes all application dependencies using dependency injection
func initDependencies(db *database.Database) *Container {
	// Initialize repositories
	proteinRepo := Repositories.NewProteinRepository(db)

	// Initialize domain services
	proteinService := services.NewProteinService()

	// Initialize use cases
	proteinUseCases := usecases.NewProteinUseCases(proteinRepo, proteinService)

	// Initialize handlers
	proteinHandler := handlers.NewProteinHandler(proteinUseCases)

	return &Container{
		ProteinRepo:     proteinRepo,
		ProteinService:  proteinService,
		ProteinUseCases: proteinUseCases,
		ProteinHandler:  proteinHandler,
	}
}

// loadInitialData loads initial protein data from CSV if the database is empty
func loadInitialData(db *database.Database) {
	// Check if proteins table has data
	var count int
	err := db.Conn.QueryRow("SELECT COUNT(*) FROM proteins").Scan(&count)
	if err != nil {
		log.Printf("Error checking protein count: %v", err)
		return
	}

	if count > 0 {
		log.Printf("Database already contains %d proteins, skipping initial data load", count)
		return
	}

	log.Println("Database is empty, loading initial protein data...")

	// Try to load from the cleaned dataset first, fallback to original
	dataPath := "/ml/protein_features_cleaned_combine.csv"
	if _, err := os.Stat(dataPath); os.IsNotExist(err) {
		dataPath = "/ml/protein_features.csv"
		if _, err := os.Stat(dataPath); os.IsNotExist(err) {
			log.Println("No CSV data files found, skipping initial data load")
			return
		}
	}

	log.Printf("Loading protein data from: %s", dataPath)
	if err := database.ProcessCompleteDataset(db.Conn, dataPath); err != nil {
		log.Printf("Failed to load initial data: %v", err)
	} else {
		log.Println("Initial protein data loaded successfully")
	}
}
