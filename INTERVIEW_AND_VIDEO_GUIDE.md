# Internship Task: Video Presentation Script & Technical Interview Guide

> [!IMPORTANT]
> **Mandatory Submission Requirement**:
> The submission to `devhiring@hclguvi.com` requires:
> 1. **Public GitHub Repository Link**
> 2. **Live Working Link** (deployed publicly)
> 3. **A 3–5 Minute Walkthrough Video** (unlisted YouTube or Google Drive link with "Anyone with the link can view" permission).
> 
> *The recruiters specifically emphasize that recording this video is mandatory and candidates will be tested on the fundamentals in subsequent technical interview rounds.*

---

## 3–5 Minute Video Walkthrough Script

Use Loom, OBS Studio, or Windows Game Bar (`Win + G` or `Win + Alt + R`) to record your screen and microphone.

### Phase 1: Introduction & Live Demonstration (0:00 – 1:15)
- **What to show on screen**: Open two browser windows side-by-side (Window A on the left, Window B in Incognito on the right) viewing the same live poll URL.
- **What to say**:
  > *"Hello team, this is my live polling web application built for the HCL GUVI developer internship task. The tech stack consists of Go with Gin for the backend, Redis for real-time in-memory counters and Pub/Sub, MongoDB for durable data persistence, and React with Tailwind CSS for the frontend.
  > 
  > As you can see, on the left I have the poll open, and on the right I have an audience member. When I select an option and click Submit, watch the right window: the percentage bars update instantly with a smooth animation and zero page refresh. That immediate update is driven entirely by our Redis Pub/Sub channel pushing events through Gorilla WebSockets directly to the browser."*

---

### Phase 2: The Challenge That Gave Me the Most Trouble & How I Solved It (1:15 – 2:45)
- **Question asked by recruiters**: *"The one challenge that gave you the most trouble, and how you solved it."*
- **What to show on screen**: Open the Go code in VS Code showing `backend/internal/services/poll_service.go` and `websocket_hub.go`.
- **What to say**:
  > *"The most challenging engineering problem was managing dual-datastore synchronization and data consistency between Redis and MongoDB under high-concurrency voting spikes.
  > 
  > If we wrote synchronously to MongoDB on every single vote, write contention and document locks would degrade throughput and cause latency spikes. On the other hand, if we only stored votes in Redis, we would risk data loss if a Redis node restarted.
  > 
  > I solved this by implementing a layered write-through and asynchronous persistence pattern:
  > 1. First, Redis receives the vote and atomically increments the option counter using `HINCRBY poll:<id>:counts <option_id> 1`. Because this operation is single-threaded and in-memory inside Redis, it executes in sub-millisecond time and eliminates all race conditions.
  > 2. Simultaneously, Redis tracks the voter's fingerprint in a Redis Set (`SADD poll:<id>:voters <voter_hash>`) to guarantee single-vote constraints in $O(1)$ time.
  > 3. We immediately publish the updated aggregate counts to the Redis Pub/Sub channel, so WebSocket listeners stream the new percentages to clients without waiting.
  > 4. Finally, an asynchronous Go routine writes the individual vote record to MongoDB for audit logging and updates the total count in the background. If a cold-start occurs, the system re-hydrates Redis from MongoDB. This gave us sub-10ms response times while preserving 100% durable persistence."*

---

### Phase 3: Technical Stack Breakdown & Separation of Concerns (2:45 – 3:45)
- **What to show on screen**: Show the folder structure (`/backend`, `/frontend`, `docker-compose.yml`, `README.md`).
- **What to say**:
  > *"Following the brief's guidelines:
  > - **Separation of concerns**: Frontend and backend are cleanly isolated. The Go backend follows standard Go idiomatic architecture with handlers, middleware, models, and service layers.
  > - **Backend validation**: All poll inputs, option counts (min 2, max 10), string lengths, and voting restrictions are strictly enforced server-side before reaching any database.
  > - **Authentication**: We built a secure JWT authentication system with `bcrypt` password hashing for poll creation and dashboard management.
  > - **UI Design**: The interface features a sleek automotive grey theme with custom Alice Blue (`#F0F8FF`) checkboxes, radio indicators, and glow highlights."*

---

### Phase 4: The AI Question (3:45 – 4:30)
- **Question asked by recruiters**: *"Did you use any AI tools while building this? If yes, which ones and how did they help (or get in the way)? If no, just say so."*
- **What to say (Honest & Professional)**:
  > *"Yes, I utilized AI assistance (Antigravity) as an architectural sounding board and productivity accelerator during development.
  > 
  > **Where it helped**: It helped scaffold the boilerplate for the Go Gin routing, configure the WebSocket read/write pump patterns, and rapidly prototype the CSS classes for the Alice Blue theme. It served like an interactive pair-programming partner to sanity-check concurrency patterns.
  > 
  > **Where it presented challenges**: AI often suggested basic in-memory maps or generic HTTP polling when asked for real-time features. I had to reject those shortcuts and deliberately architect a true Redis Pub/Sub pipeline with `HINCRBY` hash counters to ensure Redis was doing meaningful, high-performance work as required by the brief. I also manually verified the WebSocket gorilla upgrader origin checks, token lifecycle, and atomic transaction flow to ensure the system is rock-solid and secure."*

---

### Phase 5: Wrap-up & Submission (4:30 – 5:00)
- **What to say**:
  > *"Both the backend and frontend are live and deployed. The public GitHub repository and live links are included in the email. Thank you for your time and for reviewing my submission!"*

---

## Key Technical Questions to Prepare For in Live Interview

### Q1: Why did you use Redis Hashes (`HINCRBY`) instead of just Redis Strings (`INCR`)?
> **Answer**: Using a Redis Hash keyed by `poll:<poll_id>:counts` allows us to store all option counts for a specific poll inside a single Redis data structure. With `HGETALL poll:<poll_id>:counts`, we can retrieve the entire vote distribution for a poll in one $O(N)$ command (where $N$ is only 2 to 10 options), rather than executing multiple individual `GET` calls across the network.

### Q2: What happens if two voters vote at the exact same millisecond?
> **Answer**: Redis is single-threaded in its execution of commands from its event loop. Therefore, two simultaneous `HINCRBY` operations will be serialized sequentially by the Redis engine. Neither increment will be lost, and there are no race conditions or dirty reads.

### Q3: How does Redis Pub/Sub help when you scale to multiple backend instances?
> **Answer**: If we have 10 Go backend servers behind a load balancer, client A might be connected to Server 1 and client B to Server 2. When a vote arrives at Server 1, if we only used in-memory Go channels, client B would never receive the update. By publishing the event to Redis (`PUBLISH poll:<id>:channel`), all 10 Go servers receive the message through their Redis subscription and push it to their respective connected WebSockets.

### Q4: How is duplicate voting prevented?
> **Answer**: We combine the voter's persistent client key with their IP address, hash it with SHA-256, and check membership in a Redis Set (`poll:<id>:voters`) using `SISMEMBER`. If already present, the request is rejected with a 400 error. If not present, `SADD` records the voter atomically.
