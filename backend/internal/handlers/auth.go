package handlers

import (
	"net/http"

	"live-poll-backend/internal/config"
	"live-poll-backend/internal/middleware"
	"live-poll-backend/internal/models"
	"live-poll-backend/internal/services"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	cfg     *config.Config
	pollSvc *services.PollService
}

func NewAuthHandler(cfg *config.Config, svc *services.PollService) *AuthHandler {
	return &AuthHandler{
		cfg:     cfg,
		pollSvc: svc,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration input: " + err.Error()})
		return
	}

	user, err := h.pollSvc.RegisterUser(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return
	}

	token, err := middleware.GenerateToken(h.cfg, user.ID.Hex(), user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User: models.UserDTO{
			ID:        user.ID.Hex(),
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login credentials format"})
		return
	}

	user, err := h.pollSvc.AuthenticateUser(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	token, err := middleware.GenerateToken(h.cfg, user.ID.Hex(), user.Username, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate authentication token"})
		return
	}

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User: models.UserDTO{
			ID:        user.ID.Hex(),
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
		},
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.pollSvc.GetUserByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User account not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": models.UserDTO{
			ID:        user.ID.Hex(),
			Email:     user.Email,
			Username:  user.Username,
			CreatedAt: user.CreatedAt,
		},
	})
}
