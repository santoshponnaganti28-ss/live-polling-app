package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for dev/live deployment flexibility
	},
}

type Client struct {
	Hub      *WebSocketHub
	Conn     *websocket.Conn
	Send     chan []byte
	PollID   string
	VoterKey string
}

type WebSocketHub struct {
	// Registered clients grouped by pollID
	rooms      map[string]map[*Client]bool
	broadcast  chan BroadcastMessage
	register   chan *Client
	unregister chan *Client
	lock       sync.RWMutex
	redis      *redis.Client
	subs       map[string]*redis.PubSub
	subsLock   sync.Mutex
}

type BroadcastMessage struct {
	PollID  string
	Payload []byte
}

func NewWebSocketHub(rdb *redis.Client) *WebSocketHub {
	return &WebSocketHub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan BroadcastMessage, 100),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		redis:      rdb,
		subs:       make(map[string]*redis.PubSub),
	}
}

func (h *WebSocketHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.lock.Lock()
			if _, exists := h.rooms[client.PollID]; !exists {
				h.rooms[client.PollID] = make(map[*Client]bool)
				// Start Redis subscriber for this room if Redis is connected
				go h.ensureRedisSubscription(client.PollID)
			}
			h.rooms[client.PollID][client] = true
			h.lock.Unlock()
			log.Printf("[WebSocket] Client joined poll room %s (total clients in room: %d)", client.PollID, len(h.rooms[client.PollID]))

		case client := <-h.unregister:
			h.lock.Lock()
			if room, exists := h.rooms[client.PollID]; exists {
				if _, ok := room[client]; ok {
					delete(room, client)
					close(client.Send)
					log.Printf("[WebSocket] Client disconnected from poll room %s", client.PollID)
					if len(room) == 0 {
						delete(h.rooms, client.PollID)
						h.stopRedisSubscription(client.PollID)
					}
				}
			}
			h.lock.Unlock()

		case msg := <-h.broadcast:
			h.lock.RLock()
			if room, exists := h.rooms[msg.PollID]; exists {
				for client := range room {
					select {
					case client.Send <- msg.Payload:
					default:
						close(client.Send)
						delete(room, client)
					}
				}
			}
			h.lock.RUnlock()
		}
	}
}

func (h *WebSocketHub) BroadcastToPoll(pollID string, payload []byte) {
	h.broadcast <- BroadcastMessage{
		PollID:  pollID,
		Payload: payload,
	}
}

func (h *WebSocketHub) ensureRedisSubscription(pollID string) {
	if h.redis == nil {
		return
	}

	h.subsLock.Lock()
	if _, ok := h.subs[pollID]; ok {
		h.subsLock.Unlock()
		return
	}

	channel := fmt.Sprintf("poll:%s:channel", pollID)
	pubsub := h.redis.Subscribe(context.Background(), channel)
	h.subs[pollID] = pubsub
	h.subsLock.Unlock()

	log.Printf("[Redis Pub/Sub] Subscribed to channel: %s", channel)

	ch := pubsub.Channel()
	for msg := range ch {
		// Broadcast redis message payload to all local clients in the room
		h.broadcast <- BroadcastMessage{
			PollID:  pollID,
			Payload: []byte(msg.Payload),
		}
	}
}

func (h *WebSocketHub) stopRedisSubscription(pollID string) {
	if h.redis == nil {
		return
	}

	h.subsLock.Lock()
	if pubsub, ok := h.subs[pollID]; ok {
		_ = pubsub.Close()
		delete(h.subs, pollID)
		log.Printf("[Redis Pub/Sub] Unsubscribed from poll channel %s", pollID)
	}
	h.subsLock.Unlock()
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(2048)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[WebSocket] Read error: %v", err)
			}
			break
		}

		// Handle any client ping/keepalive or client requests
		var clientMsg map[string]interface{}
		if err := json.Unmarshal(message, &clientMsg); err == nil {
			if clientMsg["type"] == "PING" {
				pongMsg, _ := json.Marshal(map[string]string{"type": "PONG"})
				c.Send <- pongMsg
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Drain queued messages
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *WebSocketHub, pollID, voterKey string, w http.ResponseWriter, r *http.Request) error {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WebSocket] Upgrade error: %v", err)
		return err
	}

	client := &Client{
		Hub:      hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		PollID:   pollID,
		VoterKey: voterKey,
	}

	client.Hub.register <- client

	go client.WritePump()
	go client.ReadPump()

	return nil
}
