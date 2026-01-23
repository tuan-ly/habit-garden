# Capacitor Mobile Build Guide

## Prerequisites
- Node.js 18+
- Xcode 15+ (for iOS, macOS only)
- Android Studio (for Android)
- CocoaPods (`sudo gem install cocoapods`)

## Quick Start

### 1. Build for Capacitor
```bash
# Build static export for Capacitor
npm run build:mobile

# Sync web assets to native projects
npx cap sync
```

### 2. Run on Device

**iOS (macOS only):**
```bash
npx cap open ios
# Then build/run from Xcode
```

**Android:**
```bash
npx cap open android
# Then build/run from Android Studio
```

## Development Workflow

### Live Reload (Optional)
1. Edit `capacitor.config.ts`:
   - Uncomment `url: 'http://YOUR_IP:3000'`
   - Set `cleartext: true`
2. Run `npm run dev`
3. Run `npx cap run android` or `npx cap run ios`

## Build for Production

### Android APK
```bash
npm run build:mobile
npx cap sync android
cd android && ./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/
```

### iOS IPA
1. Open Xcode: `npx cap open ios`
2. Product → Archive
3. Distribute App (App Store / Ad Hoc)

## Troubleshooting

- **White screen**: Ensure `output: 'export'` in next.config.ts
- **API errors**: Update Supabase URL if using local env
- **Build fails**: Run `npx cap sync` after web changes
