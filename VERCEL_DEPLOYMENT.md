# Vercel Deployment Guide

This repository contains both a Vite React frontend (`/frontend`) and a FastAPI Python backend (`/backend`). It is configured to deploy **both** to a single Vercel project seamlessly.

## Prerequisites
- A [Vercel](https://vercel.com) account connected to your GitHub repository.
- A MongoDB Atlas cluster (you need the connection URL).

## Step-by-Step Vercel Deployment

1. **Import Project**
   - Go to your Vercel Dashboard and click **Add New -> Project**.
   - Import this GitHub repository.

2. **Configure Project Settings**
   Leave the **Root Directory** as `./` (the default). Vercel will automatically detect the `vercel.json` at the root, which tells it how to route traffic between the Vite frontend and Python backend.

3. **Build & Development Settings**
   Expand the **Build and Output Settings** section and override the defaults with the following:
   - **Framework Preset**: Vite
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
   - **Install Command**: `cd frontend && npm install`

4. **Environment Variables**
   Add the following Environment Variables in the Vercel UI before deploying:

   | Name | Value | Description |
   |------|-------|-------------|
   | `MONGODB_URL` | `mongodb+srv://...` | Your MongoDB connection string |
   | `JWT_SECRET_KEY` | `your_secret_string` | Secret key for JWT tokens |
   | `ENVIRONMENT` | `production` | Tells FastAPI it's in production |
   | `VITE_USE_WS` | `false` | Disables WebSockets on the frontend (forces HTTP polling) |

5. **Deploy**
   Click **Deploy**. 
   
## How it works

- **API Requests**: Any request starting with `/api/*` is routed by Vercel to `api/index.py` (a Serverless Function). This file imports and runs the FastAPI app from the `/backend` folder.
- **Frontend Requests**: All other requests are served from the `frontend/dist` directory built by Vite.
- **WebSocket Fallback**: Vercel's Serverless Functions do not support persistent WebSockets. The real-time chat feature will detect the `VITE_USE_WS=false` flag and automatically fall back to fetching new messages every 3 seconds (HTTP Polling).
