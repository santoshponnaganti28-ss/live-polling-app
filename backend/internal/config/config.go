package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	MongoURI       string
	MongoDBName    string
	RedisAddr      string
	RedisPassword  string
	RedisDB        int
	RedisURL       string
	JWTSecret      string
	AllowedOrigins string
}

func LoadConfig() *Config {
	// Load .env if present (silently ignore if not found)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	mongoDBName := os.Getenv("MONGODB_NAME")
	if mongoDBName == "" {
		mongoDBName = "livepoll"
	}

	redisURL := os.Getenv("REDIS_URL")
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" && redisURL == "" {
		redisAddr = "localhost:6379"
	}
	redisPassword := os.Getenv("REDIS_PASSWORD")

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "development-secret-jwt-key-change-in-production-2026"
	}

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "*"
	}

	return &Config{
		Port:           port,
		MongoURI:       mongoURI,
		MongoDBName:    mongoDBName,
		RedisAddr:      redisAddr,
		RedisPassword:  redisPassword,
		RedisDB:        0,
		RedisURL:       redisURL,
		JWTSecret:      jwtSecret,
		AllowedOrigins: allowedOrigins,
	}
}
