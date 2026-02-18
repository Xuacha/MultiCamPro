# Backend Production Configuration for MultiCamPro

## Environment Setup

```bash
# Copy template to production
cp .env.example .env.production
```

## Environment Variables (.env.production)

### Firebase Configuration
```env
FIREBASE_PROJECT_ID=multicampro-prod
FIREBASE_DATABASE_URL=https://multicampro-prod.firebaseio.com
FIREBASE_STORAGE_BUCKET=multicampro-prod.appspot.com
FIREBASE_API_KEY=AIzaSyDxxx...xxx
FIREBASE_AUTH_DOMAIN=multicampro-prod.firebaseapp.com
```

### Application Settings
```env
NODE_ENV=production
APP_ENV=production
DEBUG=false
LOG_LEVEL=error
PORT=3000
HOSTNAME=0.0.0.0
```

### Security
```env
JWT_SECRET=(generate with: openssl rand -hex 32)
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d
API_KEY_HEADER=X-API-Key
CORS_ORIGIN=https://multicampro.com
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

### Services
```env
BACKEND_URL=https://api.multicampro.com
SIGNALING_SERVER_URL=wss://signal.multicampro.com
STORAGE_URL=https://storage.multicampro.com
```

### Features
```env
ENABLE_ANALYTICS=true
ENABLE_CRASHLYTICS=true
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_REMOTE_CONFIG=true
```

### Email Service
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxx...xxx
EMAIL_FROM=noreply@multicampro.com
EMAIL_FROM_NAME=MultiCamPro
```

### Storage
```env
MAX_FILE_UPLOAD_SIZE=5368709120
MAX_CONCURRENT_UPLOADS=5
REQUEST_TIMEOUT=30000
STORAGE_CLEANUP_DAYS=30
```

### Database
```env
FIRESTORE_EMULATOR_HOST=
FIRESTORE_AUTO_CREATE_INDEX=false
DB_CONNECTION_POOL=10
DB_IDLE_TIMEOUT=30000
```

### Monitoring & Observability
```env
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
LOG_AGGREGATION_ENDPOINT=https://logs.multicampro.com
HEALTH_CHECK_INTERVAL=60000
```

## Backend Deployment Options

### Option 1: Google Cloud Run (Recommended)

#### Prerequisites
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init
gcloud config set project multicampro-prod
```

#### Deploy Docker Container
```bash
# Build Docker image
docker build -t gcr.io/multicampro-prod/api:latest .

# Push to Google Container Registry
docker push gcr.io/multicampro-prod/api:latest

# Deploy to Cloud Run
gcloud run deploy multicampro-api \
  --image gcr.io/multicampro-prod/api:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars NODE_ENV=production \
  --allow-unauthenticated
```

#### Configure Auto-scaling
```bash
gcloud run services update multicampro-api \
  --min-instances 2 \
  --max-instances 10 \
  --region us-central1
```

### Option 2: Heroku

#### Prerequisites
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login
```

#### Deploy
```bash
# Create Heroku app
heroku create multicampro-api

# Set production environment variables
heroku config:set -a multicampro-api NODE_ENV=production
heroku config:set -a multicampro-api FIREBASE_PROJECT_ID=multicampro-prod
# ... set all other variables

# Deploy
git push heroku main
```

### Option 3: DigitalOcean App Platform

#### Setup
```bash
# Create app.yaml configuration
cat > app.yaml << 'EOF'
name: multicampro-api
services:
- name: api
  github:
    repo: Xuacha/MultiCamPro
    branch: main
  build_command: npm install && npm run build
  run_command: npm start
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: FIREBASE_PROJECT_ID
    scope: RUN_AND_BUILD_TIME
    value: multicampro-prod
EOF
```

#### Deploy via CLI
```bash
doctl apps create --spec app.yaml
```

## Backend Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build if needed
RUN npm run build || true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
EXPOSE 3000
CMD ["npm", "start"]
```

## Database Migrations

### Firestore Indexes
```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

### Seed Initial Data
```bash
# Create seed script at backend/scripts/seed.js
node backend/scripts/seed.js

# This should create:
# - Admin user
# - Default settings
# - System collections
```

## Verification Checklist

After deploying backend:

- [ ] Health check passes: `curl https://api.multicampro.com/health`
- [ ] API responds: `curl https://api.multicampro.com/api/v1/status`
- [ ] Database connected: Check Firestore in Firebase Console
- [ ] Storage accessible: Upload test file
- [ ] Error logging works: Check Sentry/Datadog
- [ ] Metrics collecting: Check monitoring dashboard
- [ ] Email service: Send test email
- [ ] Rate limiting: Test with rapid requests

## Monitoring Setup

### Cloud Run Metrics
```bash
# View logs
gcloud run services describe multicampro-api --region=us-central1

# Stream logs in real-time
gcloud beta run services describe multicampro-api --region=us-central1

# Check metrics in Cloud Console
# Navigation: Cloud Run → multicampro-api → Metrics
```

### Heroku Metrics
```bash
# View logs
heroku logs --tail -a multicampro-api

# View metrics
heroku metrics --app=multicampro-api
```

## Rollback Procedure

### Cloud Run Rollback
```bash
# Get previous revision
gcloud run revisions list --service multicampro-api --region us-central1

# Route traffic to previous version
gcloud run services update-traffic multicampro-api \
  --to-revisions PREVIOUS_REVISION_ID=100 \
  --region us-central1

# Complete rollback
gcloud run services stop-migrate-traffic multicampro-api \
  --region us-central1
```

### Heroku Rollback
```bash
# View releases
heroku releases -a multicampro-api

# Rollback to previous release
heroku rollback -a multicampro-api
```

## Auto-update Strategy

### Automated Deployments with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Cloud Run
        run: |
          gcloud auth configure-docker
          docker build -t gcr.io/multicampro-prod/api:${{ github.sha }} .
          docker push gcr.io/multicampro-prod/api:${{ github.sha }}
          gcloud run deploy multicampro-api \
            --image gcr.io/multicampro-prod/api:${{ github.sha }} \
            --region us-central1
```

## Next Steps

1. **Set Environment Variables**: Copy `.env.example` to `.env.production`
2. **Choose Deployment Platform**: Cloud Run, Heroku, or DigitalOcean
3. **Build Docker Image**: `docker build -t backend:latest .`
4. **Test Locally**: `docker run -p 3000:3000 backend:latest`
5. **Deploy**: Execute platform-specific commands
6. **Verify**: Run health checks and API tests
7. **Monitor**: Set up dashboards and alerts
8. **Document**: Update deployment runbook

---

**Status**: ✅ Ready for Backend Production Deployment  
**Last Updated**: February 17, 2026
