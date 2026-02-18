#!/bin/bash

# ============================================
# MultiCamPro Production Deployment Script
# Phase 3: Build Android & iOS Apps
# ============================================

set -e

echo "🚀 MULTICAMPRO PRODUCTION DEPLOYMENT - PHASE 3"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Check prerequisites
echo "${BLUE}[1/6]${NC} Checking prerequisites..."

if ! command -v eas &> /dev/null; then
    echo "${YELLOW}Installing EAS CLI...${NC}"
    npm install -g eas-cli
fi
echo "${GREEN}✓ EAS CLI available${NC}"

if ! command -v expo &> /dev/null; then
    echo "${YELLOW}Installing Expo CLI...${NC}"
    npm install -g expo-cli
fi
echo "${GREEN}✓ Expo CLI available${NC}"

if ! command -v git &> /dev/null; then
    echo "${RED}✗ Git not found${NC}"
    exit 1
fi
echo "${GREEN}✓ Git installed${NC}"
echo ""

# Step 2: Login to EAS
echo "${BLUE}[2/6]${NC} EAS authentication..."

if [ ! -f ~/.eas/credentials.json ]; then
    echo "${YELLOW}You need to login to EAS${NC}"
    eas login
else
    echo "${GREEN}✓ EAS credentials found${NC}"
fi
echo ""

# Step 3: Verify app configuration
echo "${BLUE}[3/6]${NC} Verifying app configuration..."

if [ ! -f "app.json" ]; then
    echo "${RED}✗ app.json not found${NC}"
    exit 1
fi
echo "${GREEN}✓ app.json found${NC}"

if [ ! -f "eas.json" ]; then
    echo "${RED}✗ eas.json not found${NC}"
    exit 1
fi
echo "${GREEN}✓ eas.json found${NC}"

# Extract version
APP_VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "${GREEN}✓ App version: $APP_VERSION${NC}"
echo ""

# Step 4: Build selection
echo "${BLUE}[4/6]${NC} Select platforms to build..."
echo ""
echo "Available options:"
echo "  1) Android only"
echo "  2) iOS only"
echo "  3) Both Android & iOS"
echo "  4) Cancel"
echo ""

read -p "Select option (1-4): " -n 1 -r
echo ""
echo ""

ANDROID=false
IOS=false

case $REPLY in
    1)
        ANDROID=true
        echo "Building Android app..."
        ;;
    2)
        IOS=true
        echo "Building iOS app..."
        ;;
    3)
        ANDROID=true
        IOS=true
        echo "Building both Android and iOS apps..."
        ;;
    4)
        echo "${YELLOW}⊘ Build cancelled${NC}"
        exit 0
        ;;
    *)
        echo "${RED}Invalid option${NC}"
        exit 1
        ;;
esac
echo ""

# Step 5: Install dependencies
echo "${BLUE}[5/6]${NC} Installing dependencies..."

if [ ! -d "node_modules" ]; then
    echo "Running npm install..."
    npm install
else
    echo "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 6: Build apps
echo "${BLUE}[6/6]${NC} Building production apps..."
echo ""

BUILD_SUMMARY=""

if [ "$ANDROID" = true ]; then
    echo "${GREEN}Building Android...${NC}"
    echo "This may take 10-15 minutes..."
    echo ""
    
    if eas build --platform android --auto-install; then
        echo ""
        echo "${GREEN}✓ Android build successful${NC}"
        BUILD_SUMMARY="$BUILD_SUMMARY
  ✓ Android APK built successfully"
    else
        echo ""
        echo "${RED}✗ Android build failed${NC}"
        BUILD_SUMMARY="$BUILD_SUMMARY
  ✗ Android build failed"
    fi
    echo ""
fi

if [ "$IOS" = true ]; then
    echo "${GREEN}Building iOS...${NC}"
    echo "This may take 15-20 minutes..."
    echo ""
    
    if eas build --platform ios --auto-install; then
        echo ""
        echo "${GREEN}✓ iOS build successful${NC}"
        BUILD_SUMMARY="$BUILD_SUMMARY
  ✓ iOS build completed successfully"
    else
        echo ""
        echo "${RED}✗ iOS build failed${NC}"
        BUILD_SUMMARY="$BUILD_SUMMARY
  ✗ iOS build failed"
    fi
    echo ""
fi

# Success
echo "=============================================="
echo "${GREEN}✅ PHASE 3 COMPLETE: Apps Built${NC}"
echo "=============================================="
echo ""
echo "Summary:$BUILD_SUMMARY"
echo ""
echo "Next steps:"
echo "  1. View builds: eas build:list"
echo "  2. Download builds: eas build:download --id=BUILD_ID"
echo "  3. Test on devices"
echo "  4. Submit to app stores: eas submit --platform android/ios"
echo ""
echo "App Stores:"
echo "  - Google Play: https://play.google.com/console"
echo "  - Apple App Store: https://appstoreconnect.apple.com"
echo ""
echo "For detailed store submission guide, see APP_BUILD_GUIDE.md"
echo ""
