# Complete Live Deployment Guide (100% Free & Fast)

Follow this step-by-step guide to deploy the **Go Backend**, **React Frontend**, **MongoDB Database**, and **Redis Realtime Engine** to live, public URLs for your submission before the deadline.

---

## Architecture of Deployed Services

```
[ Audience Browser ] ---- HTTPS / WSS ----> [ Vercel: React Frontend ]
         |                                            |
         +----------------- API / WebSockets ---------+
                                  |
                                  v
                   [ Render / Railway: Go Backend ]
                          |                |
                          v                v
                 [ MongoDB Atlas ]   [ Upstash Redis ]
```

---

## Step 1: Set Up Free Cloud MongoDB (2 Minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account (or log in).
2. Click **Create a Deployment** and choose the **M0 Free** cluster (select any nearby region e.g. Mumbai / AWS).
3. Under **Security Quickstart**:
   - Create a database user (e.g., Username: `polladmin`, Password: `YourStrongPassword123!`).
   - Under **Where would you like to connect from?**, select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** > **Drivers** (Go).
5. Copy your connection string. It will look like:
   ```
   mongodb+srv://polladmin:YourStrongPassword123!@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
   *(Save this as `MONGODB_URI`)*.

---

## Step 2: Set Up Free Cloud Redis (1 Minute)

1. Go to [Upstash](https://console.upstash.com/) and sign in with GitHub or Google.
2. Click **Create Database**:
   - Name: `livepoll-redis`
   - Type: **Regional** (choose AWS ap-south-1 or closest region)
   - Eviction: enabled
3. Once created, look at the **Connect** tab:
   - Copy the **`rediss://...`** URL from the **Go** or **Redis CLI** tab (starts with `rediss://default:...`).
   *(Save this as `REDIS_URL`)*.

---

## Step 3: Push Your Code to a Public GitHub Repository

In your terminal or PowerShell inside the project directory (`C:\Users\santo\.gemini\antigravity\scratch\live-poll-app`):

```bash
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit with a clean commit message
git commit -m "feat: complete live polling app with Go Gin, Redis pubsub, Mongo & React"

# 4. Create a new repository on GitHub named "live-polling-app" (Public)
# 5. Link and push:
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/live-polling-app.git
git push -u origin main
```

---

## Step 4: Deploy the Go Backend (Render.com — Free)

1. Go to [Render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your repository `live-polling-app`.
4. Configure the service settings:
   - **Name**: `live-poll-backend`
   - **Language**: `Go`
   - **Root Directory**: `backend`
   - **Build Command**: `go build -o server ./cmd/server`
   - **Start Command**: `./server`
   - **Instance Type**: `Free`
5. Click **Advanced** > **Add Environment Variable**:
   | Key | Value |
   |---|---|
   | `PORT` | `8080` |
   | `MONGODB_URI` | *Your MongoDB Atlas connection string from Step 1* |
   | `MONGODB_NAME` | `livepoll` |
   | `REDIS_URL` | *Your Upstash Redis URL from Step 2* |
   | `JWT_SECRET` | *Any random 32+ character string* |
   | `ALLOWED_ORIGINS` | `*` |
6. Click **Create Web Service**.
7. Render will build and deploy your Go Gin backend in ~2 minutes!
   You will get a live URL such as:
   `https://live-poll-backend-xxxx.onrender.com`
   *(Test it in your browser at `https://live-poll-backend-xxxx.onrender.com/health`)*.

---

## Step 5: Deploy the React Frontend (Vercel — Free)

1. Go to [Vercel.com](https://vercel.com/) and log in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your `live-polling-app` GitHub repository.
4. Configure Project:
   - **Root Directory**: Click edit and choose `frontend`.
   - **Framework Preset**: `Vite` (auto-detected).
5. Open **Environment Variables** and add:
   | Key | Value | Example |
   |---|---|---|
   | `VITE_API_URL` | `https://your-backend.onrender.com/api` | `https://live-poll-backend-xxxx.onrender.com/api` |
   | `VITE_WS_URL` | `wss://your-backend.onrender.com` | `wss://live-poll-backend-xxxx.onrender.com` |
6. Click **Deploy**.
7. In ~45 seconds, Vercel will give you your live URL:
   `https://live-poll-app-xxxx.vercel.app`

---

## Step 6: Verify the Live Deployment End-to-End

1. Open your Vercel live URL in two separate browser windows (or on your phone and laptop).
2. Register an account and create a poll (e.g., "Top Track Car").
3. Vote in Window A.
4. Watch Window B immediately update its vote percentage bar in real time with **zero page refresh**!
5. Copy the live link and test sharing it.

---

## Submission Checklist for `devhiring@hclguvi.com`

- [ ] **GitHub Repo Link**: `https://github.com/<your-username>/live-poll-app` (public)
- [ ] **Live Deployed URL**: `https://live-poll-app-xxxx.vercel.app` (publicly accessible)
- [ ] **Short Video (3-5 min)**: unlisted YouTube or Google Drive link (refer to `INTERVIEW_AND_VIDEO_GUIDE.md`)
