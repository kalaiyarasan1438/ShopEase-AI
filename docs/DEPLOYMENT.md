# 🚀 ShopEasy — Deployment Guide

## Overview

| Layer      | Service         | URL Pattern                          |
|------------|-----------------|--------------------------------------|
| Frontend   | Vercel          | `https://shopeasy.vercel.app`        |
| Backend    | Render/Railway  | `https://shopeasy-api.onrender.com`  |
| AI Service | Render          | `https://shopeasy-ai.onrender.com`   |
| Database   | Render Postgres | Managed PostgreSQL 15                |

---

## 1. Frontend → Vercel

### Step 1: Push to GitHub
```bash
cd shopeasy/frontend
git init && git add . && git commit -m "init: ShopEasy frontend"
git remote add origin https://github.com/<you>/shopeasy-frontend
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework preset: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### Step 3: Set Environment Variables
```
VITE_API_URL      = https://shopeasy-api.onrender.com
VITE_AI_API_URL   = https://shopeasy-ai.onrender.com
VITE_APP_NAME     = ShopEasy
```

### Step 4: Deploy
Click **Deploy** — Vercel handles the rest. Every `git push` auto-deploys.

---

## 2. Backend → Render

### Step 1: Create Managed PostgreSQL
1. Render Dashboard → **New PostgreSQL**
2. Name: `shopeasy-db` · Plan: Free
3. Copy the **Internal Database URL**

### Step 2: Deploy Spring Boot
1. Render → **New Web Service**
2. Connect GitHub repo (backend folder)
3. Runtime: **Java** · Build command: `./mvnw clean package -DskipTests`
4. Start command: `java -jar target/shopeasy-backend-1.0.0.jar`

### Step 3: Environment Variables (Render)
```
DB_HOST          = <render-postgres-host>
DB_PORT          = 5432
DB_NAME          = shopeasy
DB_USER          = <render-postgres-user>
DB_PASS          = <render-postgres-password>
JWT_SECRET       = <min-32-char-random-base64-string>
ALLOWED_ORIGINS  = https://shopeasy.vercel.app
AI_SERVICE_URL   = https://shopeasy-ai.onrender.com
PORT             = 8080
```

Generate a secure JWT secret:
```bash
openssl rand -base64 64
```

### Step 4: render.yaml (optional — Infrastructure as Code)
```yaml
services:
  - type: web
    name: shopeasy-backend
    runtime: java
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: java -jar target/shopeasy-backend-1.0.0.jar
    envVars:
      - key: DB_HOST
        fromDatabase:
          name: shopeasy-db
          property: host
      - key: DB_PASS
        fromDatabase:
          name: shopeasy-db
          property: password
      - key: JWT_SECRET
        generateValue: true
      - key: ALLOWED_ORIGINS
        value: https://shopeasy.vercel.app

databases:
  - name: shopeasy-db
    plan: free
```

---

## 3. AI Service → Render

### Step 1: Deploy FastAPI
1. Render → **New Web Service**
2. Runtime: **Python 3.11**
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 2: Environment Variables
```
GROQ_API_KEY     = gsk_...   (free at console.groq.com)
ALLOWED_ORIGINS  = https://shopeasy.vercel.app
BACKEND_URL      = https://shopeasy-api.onrender.com
PORT             = 8000
```

---

## 4. Railway (Alternative to Render)

### Backend on Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

Set env vars via Railway dashboard or:
```bash
railway variables set JWT_SECRET=<secret> DB_URL=<url>
```

---

## 5. Production Checklist

### Security
- [ ] JWT secret is at least 256 bits (32+ chars), stored in env var
- [ ] `spring.jpa.hibernate.ddl-auto=validate` in production
- [ ] HTTPS enforced on all services
- [ ] CORS `allowed-origins` is exact domain (not `*`)
- [ ] BCrypt strength ≥ 12 rounds
- [ ] Rate limiting on auth endpoints

### Performance
- [ ] Frontend bundle analyzed (`npm run build -- --report`)
- [ ] Images served via CDN (Cloudinary / S3 + CloudFront)
- [ ] Database connection pool sized correctly (HikariCP)
- [ ] Redis caching for product catalog (optional)
- [ ] Gzip enabled on Render (automatic)

### Database
- [ ] Run `DATABASE_SCHEMA.sql` once on fresh DB
- [ ] Indexes verified (`EXPLAIN ANALYZE` on slow queries)
- [ ] Regular backups enabled (Render: automatic daily)
- [ ] Connection string uses SSL: `?sslmode=require`

### Monitoring
- [ ] Sentry error tracking (add `sentry-spring-boot-starter`)
- [ ] Render health checks pointing to `/health`
- [ ] Uptime monitoring via UptimeRobot (free)
- [ ] Log aggregation via Papertrail or Logtail

---

## 6. Custom Domain

### Vercel
```
Settings → Domains → Add: shopeasy.com
```
Add CNAME `cname.vercel-dns.com` in your DNS provider.

### Render
```
Settings → Custom Domains → Add: api.shopeasy.com
```

---

## 7. CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy ShopEasy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: cd frontend && npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: cd backend && ./mvnw clean package -DskipTests
      - name: Trigger Render Deploy
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

---

## 8. Environment Summary

| Variable          | Frontend | Backend | AI Service |
|-------------------|----------|---------|------------|
| `VITE_API_URL`    | ✅       | ❌      | ❌         |
| `VITE_AI_API_URL` | ✅       | ❌      | ❌         |
| `JWT_SECRET`      | ❌       | ✅      | ❌         |
| `DB_HOST`         | ❌       | ✅      | ❌         |
| `DB_PASS`         | ❌       | ✅      | ❌         |
| `ALLOWED_ORIGINS` | ❌       | ✅      | ✅         |
| `GROQ_API_KEY`    | ❌       | ❌      | ✅         |
| `BACKEND_URL`     | ❌       | ❌      | ✅         |
