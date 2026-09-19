package database

import (
	"context"
	"log"
	"time"

	"live-poll-backend/internal/config"

	"github.com/redis/go-redis/v9"
)

type RedisStore struct {
	Client *redis.Client
}

func InitRedis(cfg *config.Config) (*RedisStore, error) {
	var rdb *redis.Client

	if cfg.RedisURL != "" {
		opt, err := redis.ParseURL(cfg.RedisURL)
		if err != nil {
			log.Printf("[Redis] Failed to parse REDIS_URL: %v", err)
			return nil, err
		}
		rdb = redis.NewClient(opt)
	} else {
		rdb = redis.NewClient(&redis.Options{
			Addr:     cfg.RedisAddr,
			Password: cfg.RedisPassword,
			DB:       cfg.RedisDB,
		})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("[Redis] Warning: Ping to Redis failed: %v", err)
		return nil, err
	}

	log.Printf("[Redis] Successfully connected to Redis instance.")
	return &RedisStore{Client: rdb}, nil
}
