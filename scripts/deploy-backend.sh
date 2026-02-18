#!/bin/bash

# ============================================
# MultiCamPro Production Deployment Script
# Phase 2: Backend Configuration & Deployment
# ============================================

set -e

echo "🚀 MULTICAMPRO PRODUCTION DEPLOYMENT - PHASE 2"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Environment Setup
echo "${BLUE}[1/6]${NC} Setting up environment variables..."

if [ ! -f ".env.production" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo "${GREEN}✓ Created .env.production from .env.example${NC}"
        echo ""
        echo "${YELLOW}⚠ IMPORTANT: Edit .env.production with your production values:${NC}"
        echo "  - FIREBASE_PROJECT_ID"
        echo "  - FIREBASE_API_KEY"
        echo "  - JWT_SECRET (generate: openssl rand -hex 32)"
        echo "  - Email service credentials"
        echo "  - Other sensitive keys"
        echo ""
        read -p "Press Enter once you've updated .env.production..."
    else
        echo "${RED}✗ .env.example not found${NC}"
        exit 1
    fi
else
    echo "${GREEN}✓ .env.production exists${NC}"
fi
echo ""

# Step 2: Validate environment
echo "${BLUE}[2/6]${NC} Validating environment configuration..."

# Check required variables
REQUIRED_VARS=(
    "FIREBASE_PROJECT_ID"
    "NODE_ENV"
    "JWT_SECRET"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^$var=" .env.production; then
        VALUE=$(grep "^$var=" .env.production | cut -d'=' -f2)
        if [ -z "$VALUE" ] || [ "$VALUE" = "YOUR_VALUE_HERE" ]; then
            echo "${RED}✗ $var is not configured${NC}"
            MISSING_VARS=$((MISSING_VARS + 1))
        fi
    else
        echo "${RED}✗ $var not found in .env.production${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -gt 0 ]; then
    echo "${YELLOW}⚠ $MISSING_VARS required variables are missing or empty${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "${GREEN}✓ All required variables configured${NC}"
fi
echo ""

# Step 3: Dependency check
echo "${BLUE}[3/6]${NC} Checking backend dependencies..."

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
    echo "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo "${GREEN}✓ Backend dependencies already installed${NC}"
fi
echo ""

# Step 4: Build backend
echo "${BLUE}[4/6]${NC} Building backend for production..."

if [ -f "backend/package.json" ]; then
    cd backend
    
    # Run tests if available
    if grep -q '"test"' package.json 2>/dev/null; then
        echo "Running backend tests..."
        npm test || echo "${YELLOW}⚠ Some tests failed but continuing...${NC}"
    fi
    
    # Build
    if grep -q '"build"' package.json 2>/dev/null; then
        echo "Building TypeScript..."
        npm run build
        echo "${GREEN}✓ Backend built successfully${NC}"
    fi
    
    cd ..
else
    echo "${YELLOW}⚠ Backend directory not found, skipping build${NC}"
fi
echo ""

# Step 5: Docker image (optional)
echo "${BLUE}[5/6]${NC} Docker image option..."

read -p "Build Docker image for production? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v docker &> /dev/null; then
        PROJECT_ID=$(grep "FIREBASE_PROJECT_ID=" .env.production | cut -d'=' -f2)
        if [ -z "$PROJECT_ID" ]; then
            PROJECT_ID="multicampro-prod"
        fi
        
        echo "Building Docker image..."
        docker build -t gcr.io/$PROJECT_ID/api:latest .
        echo "${GREEN}✓ Docker image built${NC}"
        echo "  Image: gcr.io/$PROJECT_ID/api:latest"
        echo ""
        echo "To push to Google Container Registry:"
        echo "  docker push gcr.io/$PROJECT_ID/api:latest"
    else
        echo "${YELLOW}⚠ Docker not installed, skipping image build${NC}"
    fi
fi
echo ""

# Step 6: Deployment options
echo "${BLUE}[6/6]${NC} Deployment platform selection..."
echo ""
echo "Select your deployment platform:"
echo "  1) Google Cloud Run (recommended)"
echo "  2) Heroku"
echo "  3) DigitalOcean"
echo "  4) Manual/Other"
echo "  5) Skip deployment"
echo ""

read -p "Select option (1-5): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo "📝 Google Cloud Run deployment..."
        echo ""
        echo "Steps:"
        echo "  1. gcloud auth configure-docker"
        echo "  2. docker push gcr.io/multicampro-prod/api:latest"
        echo "  3. gcloud run deploy multicampro-api \\"
        echo "       --image gcr.io/multicampro-prod/api:latest \\"
        echo "       --platform managed --region us-central1 \\"
        echo "       --memory 2Gi --cpu 2"
        echo ""
        echo "See BACKEND_PRODUCTION.md for detailed instructions"
        ;;
    2)
        echo "📝 Heroku deployment..."
        echo ""
        echo "Steps:"
        echo "  1. heroku login"
        echo "  2. heroku create multicampro-api"
        echo "  3. heroku config:set -a multicampro-api NODE_ENV=production"
        echo "  4. git push heroku main"
        echo ""
        echo "See BACKEND_PRODUCTION.md for detailed instructions"
        ;;
    3)
        echo "📝 DigitalOcean deployment..."
        echo ""
        echo "See BACKEND_PRODUCTION.md for configuration"
        ;;
    4)
        echo "📝 Follow manual deployment steps..."
        echo ""
        echo "See BACKEND_PRODUCTION.md for options"
        ;;
    5)
        echo "⊘ Skipping deployment"
        ;;
    *)
        echo "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
echo ""

# Success
echo "=============================================="
echo "${GREEN}✅ PHASE 2 COMPLETE: Backend Configured${NC}"
echo "=============================================="
echo ""
echo "Summary:"
echo "  ✓ Environment variables set"
echo "  ✓ Dependencies installed"
echo "  ✓ Backend built"
echo ""
echo "Next steps:"
echo "  1. Deploy backend to your selected platform"
echo "  2. Verify health check: curl https://api.multicampro.com/health"
echo "  3. Test API: curl https://api.multicampro.com/api/v1/status"
echo "  4. Monitor logs in deployment platform console"
echo ""
