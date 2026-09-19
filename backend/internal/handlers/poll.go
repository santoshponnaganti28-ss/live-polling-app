package handlers

import (
	"net/http"

	"live-poll-backend/internal/models"
	"live-poll-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type PollHandler struct {
	pollSvc *services.PollService
}

func NewPollHandler(svc *services.PollService) *PollHandler {
	return &PollHandler{pollSvc: svc}
}

func (h *PollHandler) CreatePoll(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to create a poll"})
		return
	}
	username, _ := c.Get("username")

	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid poll data: " + err.Error()})
		return
	}

	// Clean and validate options
	cleanedOptions := make([]string, 0, len(req.Options))
	seen := make(map[string]bool)
	for _, opt := range req.Options {
		if opt != "" && !seen[opt] {
			seen[opt] = true
			cleanedOptions = append(cleanedOptions, opt)
		}
	}

	if len(cleanedOptions) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A poll must have at least 2 distinct non-empty options"})
		return
	}
	req.Options = cleanedOptions

	poll, err := h.pollSvc.CreatePoll(c.Request.Context(), userID.(string), username.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create poll: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, poll)
}

func (h *PollHandler) GetPoll(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required"})
		return
	}

	poll, err := h.pollSvc.GetPoll(c.Request.Context(), pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, poll)
}

func (h *PollHandler) ListPolls(c *gin.Context) {
	category := c.Query("category")
	creatorID := c.Query("creatorId")

	// If dashboard requests current user's polls
	if c.Query("myPolls") == "true" {
		userID, exists := c.Get("userID")
		if exists {
			creatorID = userID.(string)
		}
	}

	polls, err := h.pollSvc.ListPolls(c.Request.Context(), category, creatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch polls: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"polls": polls,
		"count": len(polls),
	})
}

func (h *PollHandler) CastVote(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required"})
		return
	}

	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid vote request: " + err.Error()})
		return
	}

	// Identify voter
	voterKey := req.VoterKey
	if voterKey == "" {
		if userID, exists := c.Get("userID"); exists {
			voterKey = "user:" + userID.(string)
		} else {
			voterKey = "anon:" + c.ClientIP()
		}
	}

	clientIP := c.ClientIP()

	updateEvent, err := h.pollSvc.CastVote(c.Request.Context(), pollID, voterKey, req.OptionIDs, clientIP)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Vote recorded successfully",
		"result":  updateEvent,
	})
}

func (h *PollHandler) ClosePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	poll, err := h.pollSvc.ClosePoll(c.Request.Context(), pollID, userID.(string))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Poll closed successfully",
		"poll":    poll,
	})
}
