package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollOption struct {
	ID    string `bson:"id" json:"id"`
	Text  string `bson:"text" json:"text"`
	Votes int64  `bson:"votes" json:"votes"`
}

type Poll struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID     string             `bson:"creator_id" json:"creatorId"`
	CreatorName   string             `bson:"creator_name" json:"creatorName"`
	Title         string             `bson:"title" json:"title"`
	Description   string             `bson:"description" json:"description"`
	Category      string             `bson:"category" json:"category"`
	Options       []PollOption       `bson:"options" json:"options"`
	AllowMultiple bool               `bson:"allow_multiple" json:"allowMultiple"`
	IsActive      bool               `bson:"is_active" json:"isActive"`
	TotalVotes    int64              `bson:"total_votes" json:"totalVotes"`
	CreatedAt     time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updatedAt"`
	ClosedAt      *time.Time         `bson:"closed_at,omitempty" json:"closedAt,omitempty"`
}

type VoteRecord struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PollID    string             `bson:"poll_id" json:"pollId"`
	OptionIDs []string           `bson:"option_ids" json:"optionIds"`
	VoterID   string             `bson:"voter_id" json:"voterId"`
	IPHash    string             `bson:"ip_hash" json:"ipHash"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
}

type CreatePollRequest struct {
	Title         string   `json:"title" binding:"required,min=5,max=200"`
	Description   string   `json:"description" binding:"max=500"`
	Category      string   `json:"category"`
	Options       []string `json:"options" binding:"required,min=2,max=10,dive,min=1,max=100"`
	AllowMultiple bool     `json:"allowMultiple"`
}

type VoteRequest struct {
	OptionIDs []string `json:"optionIds" binding:"required,min=1"`
	VoterKey  string   `json:"voterKey"` // client fingerprint or session ID
}

type PollUpdateMessage struct {
	Type        string             `json:"type"`
	PollID      string             `json:"pollId"`
	TotalVotes  int64              `json:"totalVotes"`
	Counts      map[string]int64   `json:"counts"`
	Percentages map[string]float64 `json:"percentages"`
	Timestamp   time.Time          `json:"timestamp"`
}
