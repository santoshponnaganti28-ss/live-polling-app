package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"live-poll-backend/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type CustomClaims struct {
	UserID   string `json:"userId"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(cfg *config.Config, userID, username, email string) (string, error) {
	claims := CustomClaims{
		UserID:   userID,
		Username: username,
		Email:    email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(72 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "live-poll-app",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}

func ValidateToken(cfg *config.Config, tokenStr string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func AuthRequired(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format. Expected 'Bearer <token>'"})
			c.Abort()
			return
		}

		claims, err := ValidateToken(cfg, parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Next()
	}
}

func OptionalAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				claims, err := ValidateToken(cfg, parts[1])
				if err == nil {
					c.Set("userID", claims.UserID)
					c.Set("username", claims.Username)
					c.Set("email", claims.Email)
				}
			}
		}
		c.Next()
	}
}
