# Build Production Android & iOS Apps

## Prerequisites

```bash
# Install EAS CLI
npm install -g eas-cli

# Install Expo CLI
npm install -g expo-cli

# Verify installations
eas --version
expo --version
```

## Android Build Configuration

### 1. Generate Upload Key

```bash
# Generate keystore for Play Store (one-time)
keytool -genkey -v -keystore ~/multicampro-upload-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias multicampro-key

# Store the keystore path and password securely
```

### 2. Configure EAS for Android

In `eas.json`, production build section:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "keystore": {
          "keystorePath": "~/multicampro-upload-key.jks",
          "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
          "keyAlias": "multicampro-key",
          "keyPassword": "YOUR_KEY_PASSWORD"
        }
      }
    }
  }
}
```

### 3. Build for Android

```bash
# Option 1: Android App Bundle (for Play Store)
eas build --platform android --auto-install

# Option 2: APK (for testing/direct distribution)
eas build --platform android --auto-install --app-id com.xuacha.multicampro

# Check build status
eas build:list
```

### 4. Download Build Artifacts

```bash
# Builds are automatically uploaded to EAS
# Download from console or:
eas build:download --id=build-id

# The APK/bundle will be in your project directory
```

## iOS Build Configuration

### 1. Create Apple Developer Account

- Go to [Apple Developer](https://developer.apple.com)
- Enroll in Apple Developer Program ($99/year)
- Create App ID: `com.xuacha.multicampro`

### 2. Generate Signing Certificates

**Option A: Automatic (Recommended)**

```bash
# EAS handles certificate generation automatically
# You'll be prompted during first build
eas build --platform ios --auto-install
```

**Option B: Manual**

```bash
# Create Certificate Signing Request in Keychain Access
# Upload to Apple Developer Portal
# Configure in eas.json:
{
  "build": {
    "production": {
      "ios": {
        "certificateType": "distribution",
        "signingMethod": "app-store"
      }
    }
  }
}
```

### 3. Build for iOS

```bash
# Build for App Store
eas build --platform ios --auto-install

# Monitor build
eas build:view

# Check for errors
eas build:list --platform ios
```

### 4. Download iOS Build

```bash
# Build is generated as .ipa file
# Download from EAS console or:
eas build:download --id=build-id --path ./builds

# File will be: builds/Unsigned_MultiCamPro.ipa
```

## App Store Configuration

### Google Play Store Setup

#### 1. Create Play Store Account

- Go to [Google Play Console](https://play.google.com/console)
- Pay $25 registration fee
- Create new app

#### 2. Configure App

```bash
# Set app details:
# - App name: MultiCamPro
# - App description
# - Screenshots (min 2)
# - Category: Media & Video
# - Ratings: Choose as needed
# - Privacy policy: https://multicampro.com/privacy
# - Terms of service: https://multicampro.com/terms
```

#### 3. Prepare Release

```bash
# Create signed APK/bundle
eas build --platform android

# Version code (increments each release)
# Version name (user-facing): 1.0.0
```

#### 4. Submit to Play Store

```bash
# Option A: Using EAS Submit
eas submit --platform android --latest

# Option B: Manual upload to Play Console
# - Internal Testing → Beta Testing → Production
# - Upload APK/bundle when ready
# - Complete store listing
# - Submit for review
```

#### 5. Monitor Review

- Google typically reviews in 2-4 hours
- You'll be notified via email
- App goes live immediately after approval

### Apple App Store Setup

#### 1. Create App Store Account

- Use Apple Developer account
- Go to [App Store Connect](https://appstoreconnect.apple.com)
- Create new app

#### 2. Configure App

```bash
# Set app information:
# - App name: MultiCamPro
# - Bundle ID: com.xuacha.multicampro
# - SKU: multicampro-1
# - Category: Photo & Video
# - Privacy policy: https://multicampro.com/privacy
# - Support URL
# - Pricing: Free or paid
```

#### 3. Prepare Version Release

```bash
# Create version:
# - Version: 1.0.0
# - Build: Select from available builds
# - Screenshots: 2 or more per screen size
# - Preview video: Optional
# - Description, keywords, supports URLs
```

#### 4. Submit for Review

```bash
# Option A: Using EAS Submit
eas submit --platform ios --latest

# Option B: Manual via App Store Connect
# - Complete version information
# - Add build
# - Save
# - Submit for Review
```

#### 5. Handle Review

- Apple typically reviews in 24-48 hours
- You'll be notified via email
- May request changes
- Resubmit if needed
- App goes live after approval

## Automated Submission with GitHub Actions

Create `.github/workflows/build-and-submit.yml`:

```yaml
name: Build and Submit Apps

on:
  workflow_dispatch:  # Manual trigger
  push:
    tags:
      - 'v*'  # Trigger on version tags

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Build Android
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas build --platform android --auto-install
      
      - name: Submit to Play Store
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas submit --platform android --latest

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Build iOS
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas build --platform ios --auto-install
      
      - name: Submit to App Store
        env:
          EAS_TOKEN: ${{ secrets.EAS_TOKEN }}
        run: eas submit --platform ios --latest
```

## Build Troubleshooting

### Android Issues

**Issue: Build fails with authentication error**
```bash
# Solution: Login to EAS
eas login
```

**Issue: Keystore not found**
```bash
# Verify keystore path in eas.json
# Store securely with GitHub Secrets
```

**Issue: Version code conflict**
```bash
# Increment version code in app.json
# versioning.appVersion in eas.json
```

### iOS Issues

**Issue: Certificate expired**
```bash
# Revoke old certificate in Apple Developer portal
# Let EAS generate new one
eas build --platform ios
```

**Issue: Bundle ID mismatch**
```bash
# Verify bundleIdentifier in app.json
# Must match App Store registered bundle
```

## Monitoring Builds

```bash
# View all builds
eas build:list

# View specific build details
eas build:view --id=build-id

# View build logs
eas build:log --id=build-id

# Detailed status
eas build:info --id=build-id
```

## Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH
  ↓     ↓      ↓
  1.0.0 - Initial release
  1.1.0 - Feature added
  1.0.1 - Bug fix

app.json:
{
  "expo": {
    "version": "1.0.0",
    "android": { "versionCode": 1 },
    "ios": { "buildNumber": "1" }
  }
}
```

### Update Checklist

- [ ] Bump version in app.json
- [ ] Bump build numbers (iOS/Android)
- [ ] Update CHANGELOG.md
- [ ] Tag release: `git tag -a v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Trigger builds
- [ ] Create release notes
- [ ] Submit to stores

## Success Metrics

After launch, track:
- ✅ Downloads per day
- ✅ Crash-free users %
- ✅ App store rating
- ✅ Installation conversion rate
- ✅ Day 1 / Day 7 retention

---

**Status**: ✅ Build Configuration Complete  
**Last Updated**: February 17, 2026
