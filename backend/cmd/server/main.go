package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"live-poll-backend/internal/config"
	"live-poll-backend/internal/database"
	"live-poll-backend/internal/handlers"
	"live-poll-backend/internal/middleware"
	"live-poll-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("[Server] Starting Live Polling Engine on port %s...", cfg.Port)

	// Initialize MongoDB
	mongoStore, err := database.InitMongo(cfg)
	if err != nil {
		log.Printf("[MongoDB] Running in standalone in-memory persistence mode (MongoDB unreachable at %s).", cfg.MongoURI)
	} else {
		defer func() {
			if mongoStore.Client != nil {
				_ = mongoStore.Client.Disconnect(context.Background())
			}
		}()
	}

	// Initialize Redis
	redisStore, err := database.InitRedis(cfg)
	if err != nil {
		log.Printf("[Redis] Running in local pub/sub mode (Redis unreachable at %s).", cfg.RedisAddr)
	}

	// Initialize WebSocket Hub
	var hub *services.WebSocketHub
	if redisStore != nil {
		hub = services.NewWebSocketHub(redisStore.Client)
	} else {
		hub = services.NewWebSocketHub(nil)
	}
	go hub.Run()

	// Initialize Services & Handlers
	pollSvc := services.NewPollService(mongoStore, redisStore, hub)
	authHandler := handlers.NewAuthHandler(cfg, pollSvc)
	pollHandler := handlers.NewPollHandler(pollSvc)
	wsHandler := handlers.NewWebSocketHandler(hub)

	// Set Gin Mode
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept", "X-Requested-With"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	router.Use(cors.New(corsConfig))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"services": gin.H{
				"mongodb": mongoStore != nil,
				"redis":   redisStore != nil,
			},
		})
	})

	// API Routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", middleware.AuthRequired(cfg), authHandler.Me)
		}

		// Polls routes
		polls := api.Group("/polls")
		{
			polls.GET("", middleware.OptionalAuth(cfg), pollHandler.ListPolls)
			polls.POST("", middleware.AuthRequired(cfg), pollHandler.CreatePoll)
			polls.GET("/:id", middleware.OptionalAuth(cfg), pollHandler.GetPoll)
			polls.POST("/:id/vote", middleware.OptionalAuth(cfg), pollHandler.CastVote)
			polls.POST("/:id/close", middleware.AuthRequired(cfg), pollHandler.ClosePoll)
		}
	}

	// WebSocket Endpoint
	router.GET("/ws/polls/:id", wsHandler.HandlePollWS)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[Server] HTTP & WebSocket Server running at http://localhost:%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Server] Listen error: %s\n", err)
		}
	}()

	// Graceful shutdown handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[Server] Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[Server] Server forced to shutdown: %v", err)
	}

	fmt.Println("[Server] Server exited cleanly.")
}
