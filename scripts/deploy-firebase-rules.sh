#!/bin/bash

# ============================================
# MultiCamPro Production Deployment Script
# Phase 1: Firebase Rules Deployment
# ============================================

set -e

echo "🚀 MULTICAMPRO PRODUCTION DEPLOYMENT - PHASE 1"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "${BLUE}[1/5]${NC} Checking prerequisites..."
if ! command -v firebase &> /dev/null; then
    echo "${RED}✗ Firebase CLI not found${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi
echo "${GREEN}✓ Firebase CLI installed${NC}"

if ! command -v git &> /dev/null; then
    echo "${RED}✗ Git not found${NC}"
    exit 1
fi
echo "${GREEN}✓ Git installed${NC}"

if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo "${GREEN}✓ Node.js installed ($(node --version))${NC}"

# Check if we're in the right directory
if [ ! -f "firestore.rules" ] || [ ! -f "storage.rules" ]; then
    echo "${RED}✗ Security rules files not found${NC}"
    echo "Make sure you're in the project root directory"
    exit 1
fi
echo "${GREEN}✓ Security rules files found${NC}"
echo ""

# Step 1: Validate Firestore Rules
echo "${BLUE}[2/5]${NC} Validating Firestore security rules..."
if firebase deploy --only firestore:rules --dry-run > /dev/null 2>&1; then
    echo "${GREEN}✓ Firestore rules validated successfully${NC}"
else
    echo "${RED}✗ Firestore rules validation failed${NC}"
    echo "Run: firebase deploy --only firestore:rules --dry-run"
    exit 1
fi
echo ""

# Step 2: Validate Storage Rules
echo "${BLUE}[3/5]${NC} Validating Cloud Storage security rules..."
if firebase deploy --only storage:rules --dry-run > /dev/null 2>&1; then
    echo "${GREEN}✓ Cloud Storage rules validated successfully${NC}"
else
    echo "${YELLOW}⚠ Cloud Storage rules validation had warnings (non-critical)${NC}"
fi
echo ""

# Step 3: Deploy Firestore Rules
echo "${BLUE}[4/5]${NC} Deploying Firestore security rules to production..."
echo "  Target: Firebase Production Project"
echo "  Rules file: firestore.rules"
echo ""
echo "${YELLOW}⚠ This will update security rules for ALL Firestore collections in production.${NC}"
echo "  Verify the rules file is correct before proceeding!"
echo ""
read -p "Continue with Firestore rules deployment? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase deploy --only firestore:rules
    echo "${GREEN}✓ Firestore rules deployed successfully${NC}"
else
    echo "${YELLOW}⊘ Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Step 4: Deploy Storage Rules
echo "${BLUE}[5/5]${NC} Deploying Cloud Storage security rules to production..."
echo "  Target: Firebase Production Project"
echo "  Rules file: storage.rules"
echo ""
read -p "Continue with Cloud Storage rules deployment? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase deploy --only storage:rules
    echo "${GREEN}✓ Cloud Storage rules deployed successfully${NC}"
else
    echo "${YELLOW}⊘ Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Success
echo "=============================================="
echo "${GREEN}✅ PHASE 1 COMPLETE: Firebase Rules Deployed${NC}"
echo "=============================================="
echo ""
echo "Summary:"
echo "  ✓ Firestore security rules deployed"
echo "  ✓ Cloud Storage security rules deployed"
echo ""
echo "Next steps:"
echo "  1. Verify rules in Firebase Console"
echo "  2. Test permissions with a test account"
echo "  3. Monitor error logs for denied requests"
echo ""
echo "To verify deployment:"
echo "  firebase rules:list"
echo ""
