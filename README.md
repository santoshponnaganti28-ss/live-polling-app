# ApexPoll — Live Polling System

A high-concurrency, real-time live polling application built with **React**, **Go (Gin)**, **MongoDB**, and **Redis**. 

Designed for high-throughput live audience participation where votes are recorded atomically, synchronized across distributed instances via Redis Pub/Sub, and streamed to audience browsers over WebSockets with **zero page refreshes**.

---

## System Architecture & Data Flow

```
   [ Audience Browser ] <==== WebSocket (Live Results) ==== [ Go Backend (Gin) ]
           |                                                        |
       POST /vote                                              HINCRBY (Atomic)
           |                                                   PUBLISH (Pub/Sub)
           v                                                        v
   [ REST Endpoint ] ====================================> [ Redis Engine ]
           |                                                        |
   (Async Durability)                                      (Channel Broadcast)
           v                                                        v
   [ MongoDB Store ]                                     [ Connected Clients ]
```

### Why Redis is Doing the Heavy Lifting
Rather than using Redis as a mere passive cache, Redis actively powers the real-time core of the application:
1. **Atomic In-Memory Counters (`HINCRBY`)**:
   - Each poll maintains a Redis Hash (`poll:<id>:counts`).
   - When a vote arrives, `HINCRBY poll:<id>:counts <option_id> 1` increments the counter atomically in sub-millisecond memory time.
   - This prevents race conditions and eliminates database lock contention during concurrent vote spikes.
2. **Realtime Broadcast Engine (`PUBLISH` / `SUBSCRIBE`)**:
   - As soon as counts increment, the server publishes a JSON payload to Redis channel `poll:<id>:channel`.
   - All Go WebSocket Hub listeners subscribed to this channel immediately broadcast the update to active client connections.
   - This decouples the HTTP voting handlers from WebSocket delivery and enables horizontal scaling across multiple backend instances.
3. **Voter Deduplication (`SADD` / `SISMEMBER`)**:
   - Redis Sets track client voter fingerprints (`poll:<id>:voters`) with TTL expiration, ensuring fast $O(1)$ single-vote enforcement.

### MongoDB for Durable Persistence
- **User Authentication**: Securely stores user credentials (passwords hashed using `bcrypt`).
- **Poll Metadata**: Stores poll questions, options, creator references, categories, and timestamps.
- **Audit Log**: An asynchronous write worker records each vote transaction to MongoDB collections without blocking the fast HTTP response.

---

## Tech Stack

| Layer | Technology | Key Responsibility |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS | Reactive UI, Alice Blue controls, live animated progress bars |
| **Backend** | Go 1.22+, Gin Framework | High-performance HTTP routing, JWT middleware, Gorilla WebSockets |
| **Database** | MongoDB 7.0 (Official Driver) | Durable document storage for polls, users, and audit records |
| **Realtime** | Redis 7.2 (`go-redis/v9`) | In-memory atomic counting (`HINCRBY`) and Redis Pub/Sub streaming |

---

## Key Features

- **Truly Real-Time Streaming**: Audience members see vote percentages adjust dynamically via WebSocket with smooth CSS animations—no manual refresh needed.
- **Creator Authentication**: Full JWT-based signup and login system. Only authenticated users can create and close polls.
- **Audience Voting (Public Access)**: Anyone with the link can participate; single-vote restriction is enforced on the server.
- **Automotive Aesthetic UI**: Sleek graphite and slate grey palette (`#0e1116`), aerodynamic background styling, and custom **Alice Blue** (`#F0F8FF`) interactive checkboxes, radio toggles, and glow highlights.
- **Graceful Fallbacks**: The backend includes intelligent in-memory fallback routines if Redis or MongoDB are temporarily offline during local sandbox testing.

---

## Project Structure

```
live-poll-app/
├── backend/
│   ├── cmd/server/main.go          # HTTP server, routing, WebSocket handler & shutdown
│   ├── internal/
│   │   ├── config/config.go        # Environment & configuration loader
│   │   ├── database/mongo.go       # MongoDB client initialization
│   │   ├── database/redis.go       # Redis client initialization (URL & host/port support)
│   │   ├── handlers/auth.go        # User registration, login, and profile handlers
│   │   ├── handlers/poll.go        # Poll CRUD, voting, and close handlers
│   │   ├── handlers/websocket.go   # WebSocket connection upgrade endpoint
│   │   ├── middleware/auth.go      # JWT verification and route protection middleware
│   │   ├── models/poll.go          # Poll, VoteRecord, and Realtime DTO models
│   │   ├── models/user.go          # User model and auth DTOs
│   │   └── services/               # Business logic, Redis Pub/Sub, and WebSocket hub
│   ├── go.mod
│   ├── go.sum
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, PollCard, CarBackground, LiveCharts
│   │   ├── context/AuthContext.jsx # React context managing auth state & JWT
│   │   ├── pages/                  # Home, CreatePoll, PollDetail, Dashboard, Login, Register
│   │   ├── services/api.js         # API client & WebSocket URL resolver
│   │   ├── App.jsx                 # Routes & layout structure
│   │   └── index.css               # Alice Blue custom controls & automotive styling
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml              # Single command Mongo + Redis local environment
├── DEPLOYMENT_GUIDE.md             # Free cloud deployment guide (Atlas, Upstash, Render, Vercel)
└── README.md
```

---

## Getting Started (Local Development)

### Option 1: Using Docker (Recommended for Local Mongo & Redis)

1. **Start MongoDB and Redis**:
   ```bash
   docker-compose up -d
   ```

2. **Run the Go Backend**:
   ```bash
   cd backend
   go run ./cmd/server
   ```
   *The backend starts at `http://localhost:8080`.*

3. **Run the React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

### Option 2: Running with Free Cloud Databases (Atlas & Upstash)
No local Docker or daemon installation needed! Simply configure connection strings in `backend/.env`:
```env
PORT=8080
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/livepoll?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379
JWT_SECRET=production-secret-key-2026
```
Then start the backend:
```bash
cd backend
go run ./cmd/server
```

---

## API Documentation

### Authentication
- `POST /api/auth/register` — Register a new account (`username`, `email`, `password`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Get current user profile (requires `Authorization: Bearer <token>`)

### Polls
- `GET /api/polls` — Retrieve active polls (supports `?category=` and `?myPolls=true`)
- `POST /api/polls` — Create a new poll (requires Auth; `title`, `options`, `allowMultiple`, `category`)
- `GET /api/polls/:id` — Retrieve poll details with real-time Redis vote counts
- `POST /api/polls/:id/vote` — Submit vote (`optionIds`, `voterKey`)
- `POST /api/polls/:id/close` — Close poll to new votes (requires creator Auth)

### WebSocket Stream
- `GET /ws/polls/:id` — Upgrade connection to receive live vote events (`VOTE_UPDATE`, `POLL_CLOSED`)

---

## Key Design Decisions & Challenges Solved

1. **Dual-Store Synchronization (Redis vs. MongoDB)**:
   High-concurrency voting applications can face write bottlenecks if every single vote triggers an immediate synchronous disk write to a document database. In this architecture, Redis handles the high-velocity write burst instantly using atomic `HINCRBY`, while an asynchronous worker handles MongoDB durability in the background. If a server cold-starts, it hydrates Redis from MongoDB.

2. **WebSocket Connection Resilience**:
   The frontend includes automatic exponential backoff reconnection. If a client experiences network jitter, the socket reconnects and immediately fetches the latest Redis count state to guarantee data consistency.

3. **Input Validation & Security**:
   All user inputs are sanitized and verified on the Go server before touching any datastore. Options are bounded (2 to 10 options, max length 100 characters), and multiple-choice constraints are strictly validated against the poll's schema.
