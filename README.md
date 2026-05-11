---
title: GDK Gym API
emoji: 🏋️
colorFrom: blue
colorTo: navy
sdk: docker
app_port: 7860
pinned: false
---

# GDK Gym Platform - Cloud API

This is the backend API for the GDK Gym Platform, deployed on Hugging Face Spaces using Docker.

## 🚀 Deployment Info
- **SDK**: Docker
- **Port**: 7860
- **Database**: Supabase (Remote)

## 🛠️ Local Development
To run this locally:
1. `npm install`
2. `npm start`

## 🔒 Environment Variables
Ensure the following are set in Hugging Face Space Secrets:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`
