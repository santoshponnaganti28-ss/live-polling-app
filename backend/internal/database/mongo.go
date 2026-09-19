package database

import (
	"context"
	"log"
	"time"

	"live-poll-backend/internal/config"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

type MongoStore struct {
	Client   *mongo.Client
	Database *mongo.Database
	Users    *mongo.Collection
	Polls    *mongo.Collection
	Votes    *mongo.Collection
}

func InitMongo(cfg *config.Config) (*MongoStore, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOptions := options.Client().ApplyURI(cfg.MongoURI)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Printf("[MongoDB] Warning: Failed to connect to MongoDB at %s: %v", cfg.MongoURI, err)
		return nil, err
	}

	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Printf("[MongoDB] Warning: Ping to MongoDB failed: %v", err)
		return nil, err
	}

	log.Printf("[MongoDB] Successfully connected to database: %s", cfg.MongoDBName)
	db := client.Database(cfg.MongoDBName)

	return &MongoStore{
		Client:   client,
		Database: db,
		Users:    db.Collection("users"),
		Polls:    db.Collection("polls"),
		Votes:    db.Collection("votes"),
	}, nil
}
