package handlers

import (
	"net/http"

	"live-poll-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type WebSocketHandler struct {
	hub *services.WebSocketHub
}

func NewWebSocketHandler(hub *services.WebSocketHub) *WebSocketHandler {
	return &WebSocketHandler{hub: hub}
}

func (h *WebSocketHandler) HandlePollWS(c *gin.Context) {
	pollID := c.Param("id")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Poll ID is required for WebSocket stream"})
		return
	}

	voterKey := c.Query("voterKey")
	if voterKey == "" {
		voterKey = c.ClientIP()
	}

	err := services.ServeWs(h.hub, pollID, voterKey, c.Writer, c.Request)
	if err != nil {
		// Logged in ServeWs
		return
	}
}
