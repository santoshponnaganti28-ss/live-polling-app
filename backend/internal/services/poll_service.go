package services

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"sync"
	"time"

	"live-poll-backend/internal/database"
	"live-poll-backend/internal/models"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type PollService struct {
	mongo      *database.MongoStore
	redis      *database.RedisStore
	hub        *WebSocketHub
	inMemUsers map[string]*models.User
	inMemPolls map[string]*models.Poll
	inMemVotes map[string][]string // pollId -> voterKeys
	inMemLock  sync.RWMutex
}

func NewPollService(m *database.MongoStore, r *database.RedisStore, hub *WebSocketHub) *PollService {
	svc := &PollService{
		mongo:      m,
		redis:      r,
		hub:        hub,
		inMemUsers: make(map[string]*models.User),
		inMemPolls: make(map[string]*models.Poll),
		inMemVotes: make(map[string][]string),
	}
	return svc
}

// User Authentication Services

func (s *PollService) RegisterUser(ctx context.Context, req models.RegisterRequest) (*models.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to encrypt password")
	}

	user := &models.User{
		ID:           primitive.NewObjectID(),
		Email:        req.Email,
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if s.mongo != nil {
		var existing models.User
		err := s.mongo.Users.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existing)
		if err == nil {
			return nil, errors.New("email is already registered")
		}

		_, err = s.mongo.Users.InsertOne(ctx, user)
		if err != nil {
			return nil, fmt.Errorf("failed to create user in database: %w", err)
		}
	} else {
		s.inMemLock.Lock()
		for _, u := range s.inMemUsers {
			if u.Email == req.Email {
				s.inMemLock.Unlock()
				return nil, errors.New("email is already registered")
			}
		}
		s.inMemUsers[user.ID.Hex()] = user
		s.inMemLock.Unlock()
	}

	return user, nil
}

func (s *PollService) AuthenticateUser(ctx context.Context, email, password string) (*models.User, error) {
	var user *models.User

	if s.mongo != nil {
		var found models.User
		err := s.mongo.Users.FindOne(ctx, bson.M{"email": email}).Decode(&found)
		if err != nil {
			return nil, errors.New("invalid email or password")
		}
		user = &found
	} else {
		s.inMemLock.RLock()
		for _, u := range s.inMemUsers {
			if u.Email == email {
				user = u
				break
			}
		}
		s.inMemLock.RUnlock()
		if user == nil {
			return nil, errors.New("invalid email or password")
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return user, nil
}

func (s *PollService) GetUserByID(ctx context.Context, idStr string) (*models.User, error) {
	if s.mongo != nil {
		objID, err := primitive.ObjectIDFromHex(idStr)
		if err != nil {
			return nil, errors.New("invalid user id format")
		}
		var user models.User
		err = s.mongo.Users.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
		if err != nil {
			return nil, errors.New("user not found")
		}
		return &user, nil
	}

	s.inMemLock.RLock()
	defer s.inMemLock.RUnlock()
	if u, ok := s.inMemUsers[idStr]; ok {
		return u, nil
	}
	return nil, errors.New("user not found")
}

// Poll Management & Realtime Redis Aggregation

func (s *PollService) CreatePoll(ctx context.Context, creatorID, creatorName string, req models.CreatePollRequest) (*models.Poll, error) {
	now := time.Now()
	pollOptions := make([]models.PollOption, len(req.Options))
	for i, optText := range req.Options {
		pollOptions[i] = models.PollOption{
			ID:    uuid.New().String()[:8],
			Text:  optText,
			Votes: 0,
		}
	}

	category := req.Category
	if category == "" {
		category = "General"
	}

	poll := &models.Poll{
		ID:            primitive.NewObjectID(),
		CreatorID:     creatorID,
		CreatorName:   creatorName,
		Title:         req.Title,
		Description:   req.Description,
		Category:      category,
		Options:       pollOptions,
		AllowMultiple: req.AllowMultiple,
		IsActive:      true,
		TotalVotes:    0,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	pollIDStr := poll.ID.Hex()

	// Persist to MongoDB
	if s.mongo != nil {
		_, err := s.mongo.Polls.InsertOne(ctx, poll)
		if err != nil {
			return nil, fmt.Errorf("failed to save poll to database: %w", err)
		}
	} else {
		s.inMemLock.Lock()
		s.inMemPolls[pollIDStr] = poll
		s.inMemLock.Unlock()
	}

	// Initialize Redis Hash for active vote counts
	if s.redis != nil {
		redisKey := fmt.Sprintf("poll:%s:counts", pollIDStr)
		initMap := make(map[string]interface{})
		for _, opt := range pollOptions {
			initMap[opt.ID] = 0
		}
		if err := s.redis.Client.HSet(ctx, redisKey, initMap).Err(); err != nil {
			log.Printf("[Redis] Warning: Failed to init Redis count hash: %v", err)
		}
		// Set TTL (e.g. 7 days)
		s.redis.Client.Expire(ctx, redisKey, 7*24*time.Hour)
	}

	return poll, nil
}

func (s *PollService) GetPoll(ctx context.Context, pollIDStr string) (*models.Poll, error) {
	var poll *models.Poll

	if s.mongo != nil {
		objID, err := primitive.ObjectIDFromHex(pollIDStr)
		if err != nil {
			return nil, errors.New("invalid poll ID format")
		}
		var found models.Poll
		err = s.mongo.Polls.FindOne(ctx, bson.M{"_id": objID}).Decode(&found)
		if err != nil {
			return nil, errors.New("poll not found")
		}
		poll = &found
	} else {
		s.inMemLock.RLock()
		if p, ok := s.inMemPolls[pollIDStr]; ok {
			poll = p
		}
		s.inMemLock.RUnlock()
		if poll == nil {
			return nil, errors.New("poll not found")
		}
	}

	// Sync live counts from Redis Hash if available
	if s.redis != nil {
		redisKey := fmt.Sprintf("poll:%s:counts", pollIDStr)
		counts, err := s.redis.Client.HGetAll(ctx, redisKey).Result()
		if err == nil && len(counts) > 0 {
			var total int64 = 0
			for i := range poll.Options {
				if cStr, ok := counts[poll.Options[i].ID]; ok {
					if cVal, parseErr := strconv.ParseInt(cStr, 10, 64); parseErr == nil {
						poll.Options[i].Votes = cVal
						total += cVal
					}
				}
			}
			poll.TotalVotes = total
		}
	}

	return poll, nil
}

func (s *PollService) ListPolls(ctx context.Context, category, creatorID string) ([]models.Poll, error) {
	var polls []models.Poll

	if s.mongo != nil {
		filter := bson.M{}
		if category != "" {
			filter["category"] = category
		}
		if creatorID != "" {
			filter["creator_id"] = creatorID
		}

		cursor, err := s.mongo.Polls.Find(ctx, filter)
		if err != nil {
			return nil, err
		}
		defer cursor.Close(ctx)

		if err := cursor.All(ctx, &polls); err != nil {
			return nil, err
		}
	} else {
		s.inMemLock.RLock()
		for _, p := range s.inMemPolls {
			if (category == "" || p.Category == category) && (creatorID == "" || p.CreatorID == creatorID) {
				polls = append(polls, *p)
			}
		}
		s.inMemLock.RUnlock()
	}

	// Overlay Redis counts for up-to-the-second accuracy
	if s.redis != nil {
		for i := range polls {
			redisKey := fmt.Sprintf("poll:%s:counts", polls[i].ID.Hex())
			counts, err := s.redis.Client.HGetAll(ctx, redisKey).Result()
			if err == nil && len(counts) > 0 {
				var total int64 = 0
				for j := range polls[i].Options {
					if cStr, ok := counts[polls[i].Options[j].ID]; ok {
						if cVal, parseErr := strconv.ParseInt(cStr, 10, 64); parseErr == nil {
							polls[i].Options[j].Votes = cVal
							total += cVal
						}
					}
				}
				polls[i].TotalVotes = total
			}
		}
	}

	if polls == nil {
		polls = []models.Poll{}
	}

	return polls, nil
}

// CastVote handles backend input validation, atomic Redis increment, MongoDB record, and Redis Pub/Sub broadcast.
func (s *PollService) CastVote(ctx context.Context, pollIDStr string, voterKey string, optionIDs []string, clientIP string) (*models.PollUpdateMessage, error) {
	poll, err := s.GetPoll(ctx, pollIDStr)
	if err != nil {
		return nil, err
	}

	if !poll.IsActive {
		return nil, errors.New("this poll is closed and no longer accepting votes")
	}

	if !poll.AllowMultiple && len(optionIDs) > 1 {
		return nil, errors.New("multiple selections are not permitted for this poll")
	}

	// Validate options belong to this poll
	validMap := make(map[string]bool)
	for _, opt := range poll.Options {
		validMap[opt.ID] = true
	}
	for _, optID := range optionIDs {
		if !validMap[optID] {
			return nil, fmt.Errorf("invalid option ID: %s", optID)
		}
	}

	// Construct unique voter fingerprint
	hasher := sha256.New()
	hasher.Write([]byte(fmt.Sprintf("%s:%s", voterKey, clientIP)))
	voterHash := hex.EncodeToString(hasher.Sum(nil))

	// Check single-vote constraint via Redis Set
	if s.redis != nil {
		votersKey := fmt.Sprintf("poll:%s:voters", pollIDStr)
		isMember, err := s.redis.Client.SIsMember(ctx, votersKey, voterHash).Result()
		if err == nil && isMember {
			return nil, errors.New("you have already submitted a vote for this poll")
		}
	} else {
		s.inMemLock.Lock()
		existing := s.inMemVotes[pollIDStr]
		for _, v := range existing {
			if v == voterHash {
				s.inMemLock.Unlock()
				return nil, errors.New("you have already submitted a vote for this poll")
			}
		}
		s.inMemVotes[pollIDStr] = append(s.inMemVotes[pollIDStr], voterHash)
		s.inMemLock.Unlock()
	}

	// Redis atomic increment: HINCRBY
	countsMap := make(map[string]int64)
	var totalVotes int64 = 0

	if s.redis != nil {
		redisKey := fmt.Sprintf("poll:%s:counts", pollIDStr)
		pipe := s.redis.Client.Pipeline()
		for _, optID := range optionIDs {
			pipe.HIncrBy(ctx, redisKey, optID, 1)
		}
		votersKey := fmt.Sprintf("poll:%s:voters", pollIDStr)
		pipe.SAdd(ctx, votersKey, voterHash)
		pipe.Expire(ctx, votersKey, 7*24*time.Hour)
		pipe.Expire(ctx, redisKey, 7*24*time.Hour)
		_, err := pipe.Exec(ctx)
		if err != nil {
			log.Printf("[Redis] Warning: Redis pipeline failed: %v", err)
		}

		// Read back all counts
		allCounts, err := s.redis.Client.HGetAll(ctx, redisKey).Result()
		if err == nil {
			for _, opt := range poll.Options {
				if valStr, ok := allCounts[opt.ID]; ok {
					val, _ := strconv.ParseInt(valStr, 10, 64)
					countsMap[opt.ID] = val
					totalVotes += val
				} else {
					countsMap[opt.ID] = 0
				}
			}
		}
	} else {
		s.inMemLock.Lock()
		for _, optID := range optionIDs {
			for i := range poll.Options {
				if poll.Options[i].ID == optID {
					poll.Options[i].Votes++
				}
			}
		}
		for _, opt := range poll.Options {
			countsMap[opt.ID] = opt.Votes
			totalVotes += opt.Votes
		}
		poll.TotalVotes = totalVotes
		s.inMemLock.Unlock()
	}

	// Calculate percentages
	percentages := make(map[string]float64)
	for optID, count := range countsMap {
		if totalVotes > 0 {
			percentages[optID] = (float64(count) / float64(totalVotes)) * 100.0
		} else {
			percentages[optID] = 0.0
		}
	}

	// Create real-time payload
	updateEvent := &models.PollUpdateMessage{
		Type:        "VOTE_UPDATE",
		PollID:      pollIDStr,
		TotalVotes:  totalVotes,
		Counts:      countsMap,
		Percentages: percentages,
		Timestamp:   time.Now(),
	}

	// Publish to Redis Pub/Sub channel
	eventBytes, _ := json.Marshal(updateEvent)
	if s.redis != nil {
		channel := fmt.Sprintf("poll:%s:channel", pollIDStr)
		if err := s.redis.Client.Publish(ctx, channel, string(eventBytes)).Err(); err != nil {
			log.Printf("[Redis] Warning: Failed to publish update to channel %s: %v", channel, err)
		}
	}

	// Broadcast directly to local WebSocket hub as well
	if s.hub != nil {
		s.hub.BroadcastToPoll(pollIDStr, eventBytes)
	}

	// Asynchronously record vote in MongoDB for durability
	go func() {
		asyncCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if s.mongo != nil {
			voteRecord := &models.VoteRecord{
				ID:        primitive.NewObjectID(),
				PollID:    pollIDStr,
				OptionIDs: optionIDs,
				VoterID:   voterKey,
				IPHash:    voterHash,
				CreatedAt: time.Now(),
			}
			_, _ = s.mongo.Votes.InsertOne(asyncCtx, voteRecord)

			// Update total votes in poll document
			objID, _ := primitive.ObjectIDFromHex(pollIDStr)
			_, _ = s.mongo.Polls.UpdateOne(asyncCtx, bson.M{"_id": objID}, bson.M{
				"$set": bson.M{
					"total_votes": totalVotes,
					"updated_at":  time.Now(),
				},
			})
		}
	}()

	return updateEvent, nil
}

func (s *PollService) ClosePoll(ctx context.Context, pollIDStr, userID string) (*models.Poll, error) {
	poll, err := s.GetPoll(ctx, pollIDStr)
	if err != nil {
		return nil, err
	}

	if poll.CreatorID != userID {
		return nil, errors.New("only the creator of the poll can close it")
	}

	now := time.Now()
	poll.IsActive = false
	poll.ClosedAt = &now

	if s.mongo != nil {
		objID, _ := primitive.ObjectIDFromHex(pollIDStr)
		_, err := s.mongo.Polls.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$set": bson.M{
				"is_active":  false,
				"closed_at":  now,
				"updated_at": now,
			},
		})
		if err != nil {
			return nil, err
		}
	} else {
		s.inMemLock.Lock()
		if p, ok := s.inMemPolls[pollIDStr]; ok {
			p.IsActive = false
			p.ClosedAt = &now
		}
		s.inMemLock.Unlock()
	}

	// Broadcast POLL_CLOSED event via Redis and WebSocket
	closeEvent := map[string]interface{}{
		"type":      "POLL_CLOSED",
		"pollId":    pollIDStr,
		"timestamp": now,
	}
	bytes, _ := json.Marshal(closeEvent)

	if s.redis != nil {
		channel := fmt.Sprintf("poll:%s:channel", pollIDStr)
		_ = s.redis.Client.Publish(ctx, channel, string(bytes)).Err()
	}
	if s.hub != nil {
		s.hub.BroadcastToPoll(pollIDStr, bytes)
	}

	return poll, nil
}
