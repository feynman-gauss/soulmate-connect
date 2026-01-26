# Cloudflare Tunnel Deployment Guide

This guide shows you how to deploy Soulmate Connect on the web using **Cloudflare Tunnel** (`cloudflared`). You'll get a free, secure, generic URL (like `random-name.trycloudflare.com`) without needing to buy a domain.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Machine                              │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  Frontend   │    │   Backend   │    │   MongoDB   │          │
│  │   (Vite)    │    │  (FastAPI)  │    │   (Docker)  │          │
│  │  Port 8080  │    │  Port 8000  │    │  Port 27017 │          │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘          │
│         │                  │                                     │
│         └────────┬─────────┘                                     │
│                  │                                               │
│           ┌──────▼──────┐                                        │
│           │    Nginx    │ ◄─── Reverse Proxy (Port 80)          │
│           └──────┬──────┘                                        │
│                  │                                               │
│           ┌──────▼──────┐                                        │
│           │ cloudflared │ ◄─── Cloudflare Tunnel                │
│           └──────┬──────┘                                        │
└──────────────────┼───────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  Cloudflare CDN  │
        │  your-app.trycloudflare.com
        └──────────────────┘
```

---

## Option A: Quick Start (Free Generic URL)

This option gives you a **quick, temporary URL** without any Cloudflare account.

### Step 1: Install cloudflared

**Windows (PowerShell as Administrator):**
```powershell
# Using winget (recommended)
winget install Cloudflare.cloudflared

# Or download directly from:
# https://github.com/cloudflare/cloudflared/releases/latest
```

**Verify installation:**
```powershell
cloudflared --version
```

### Step 2: Start the Application Stack

First, make sure Docker is running, then start all services:

```powershell
cd c:\Users\ASUS\Desktop\exploration\soulmate-connect

# Start all services (MongoDB, Redis, Backend, Frontend, Nginx)
docker-compose -f docker-compose.prod.yml up -d --build
```

Wait for all containers to be ready:
```powershell
docker-compose -f docker-compose.prod.yml ps
```

### Step 3: Create a Quick Tunnel

Run this command to get an instant public URL:

```powershell
cloudflared tunnel --url http://localhost:80
```

You'll see output like:
```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

> **Note:** This URL is temporary and changes each time you restart the tunnel.

---

## Option B: Persistent URL (Free Cloudflare Account Required)

This option gives you a **stable, persistent URL** that doesn't change.

### Step 1: Create a Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free)
2. No domain purchase required for tunnels

### Step 2: Login to Cloudflare

```powershell
cloudflared tunnel login
```

This opens a browser for authentication. After login, a certificate is saved locally.

### Step 3: Create a Named Tunnel

```powershell
cloudflared tunnel create soulmate-connect
```

This creates a tunnel with a unique ID. Note the tunnel ID (e.g., `abcd1234-5678-...`).

### Step 4: Configure the Tunnel

Create a config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: soulmate-connect
credentials-file: C:\Users\ASUS\.cloudflared\<TUNNEL_ID>.json

ingress:
  # Route all traffic to Nginx
  - service: http://localhost:80
```

### Step 5: Route DNS (Optional - If You Have a Domain)

If you later buy `tyagirishta.com` and add it to Cloudflare:

```powershell
cloudflared tunnel route dns soulmate-connect tyagirishta.com
```

### Step 6: Run the Tunnel

```powershell
cloudflared tunnel run soulmate-connect
```

Your app will be available at the Cloudflare-assigned URL or your custom domain.

---

## Local Development vs Production

### Local Development (Recommended for coding)

Run frontend and backend separately for hot-reloading:

**Terminal 1 - Backend:**
```powershell
cd backend
# Start MongoDB and Redis first
docker-compose up -d mongodb redis

# Run FastAPI with hot reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

Access at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/docs

### Production (Docker Compose)

Run everything through Docker with Nginx as reverse proxy:

```powershell
docker-compose -f docker-compose.prod.yml up -d --build
```

Access at: http://localhost (port 80)

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `docker-compose -f docker-compose.prod.yml up -d --build` | Start all services |
| `docker-compose -f docker-compose.prod.yml down` | Stop all services |
| `docker-compose -f docker-compose.prod.yml logs -f` | View logs |
| `cloudflared tunnel --url http://localhost:80` | Quick public URL |
| `cloudflared tunnel run soulmate-connect` | Run named tunnel |

---

## Troubleshooting

### "Connection refused" error
- Ensure all Docker containers are running: `docker-compose -f docker-compose.prod.yml ps`
- Check if Nginx is listening on port 80: `curl http://localhost`

### Tunnel not connecting
- Check your firewall settings
- Ensure cloudflared has network access
- Try restarting the tunnel

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly in the frontend environment

---

## Environment Variables

Before deploying, update these in your `docker-compose.prod.yml`:

```yaml
environment:
  - VITE_API_URL=https://your-tunnel-url.trycloudflare.com/api/v1
```

For production, also update:
- `MONGO_USER` and `MONGO_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET_KEY` (in backend .env)
