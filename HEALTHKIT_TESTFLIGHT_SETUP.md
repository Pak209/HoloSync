# HealthKit & TestFlight Setup Guide

## Prerequisites
- Xcode 15+ installed
- Apple Developer Account ($99/year)
- Physical iOS device (HealthKit doesn't work in simulator)

## Step 1: Xcode Project Configuration

1. **Open the project in Xcode:**
   ```bash
   cd ios
   open HoloSync.xcworkspace
   ```

2. **Configure HealthKit Entitlements:**
   - Select your project in the navigator (HoloSync)
   - Select the "HoloSync" target
   - Go to "Signing & Capabilities"
   - Click "+ Capability" and add "HealthKit"
   - Ensure the entitlements file is linked: `HoloSync.entitlements`

3. **Verify Bundle Identifier:**
   - Ensure Bundle Identifier is: `com.holosync.app`
   - This should match your app.json configuration

4. **Set up Signing:**
   - In "Signing & Capabilities", select your development team
   - Ensure "Automatically manage signing" is checked
   - Verify provisioning profile is valid

## Step 2: Test HealthKit Integration

1. **Build and run on physical device:**
   ```bash
   cd ios
   xcodebuild -workspace HoloSync.xcworkspace -scheme HoloSync -destination 'generic/platform=iOS' build
   ```

2. **Or run from Xcode:**
   - Select your physical device as target
   - Press Cmd+R to build and run

3. **Test HealthKit permissions:**
   - Open the app on your device
   - Navigate to Fitness screen
   - Tap "Setup HealthKit"
   - Grant permissions when prompted
   - Verify step count appears

## Step 3: TestFlight Deployment

### A. Archive for Distribution

1. **In Xcode:**
   - Select "Any iOS Device" as target
   - Go to Product → Archive
   - Wait for archive to complete

2. **In Organizer (opens automatically):**
   - Select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the upload process

### B. App Store Connect Setup

1. **Create App Record:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "+" to create new app
   - Bundle ID: `com.holosync.app`
   - App Name: `HoloSync`

2. **Configure HealthKit:**
   - In App Information section
   - Under "Additional Information"
   - Check "Uses HealthKit"
   - Add HealthKit description: "This app integrates with HealthKit to track fitness data and convert steps into Sync Points for Holobot training."

3. **Upload Build:**
   - Your archive should appear in "TestFlight" tab
   - Add compliance information (likely "No" for encryption)

### C. TestFlight Configuration

1. **Internal Testing:**
   - Add yourself as internal tester
   - Upload build and submit for review
   - Share TestFlight link with testers

2. **Testing Checklist:**
   - [ ] HealthKit permissions prompt appears
   - [ ] Step count displays correctly
   - [ ] Sync Points calculation works
   - [ ] Manual sync button functions
   - [ ] Weekly stats accumulate
   - [ ] Streak tracking works

## Step 4: Common Issues & Solutions

### Error: "Missing com.apple.developer.healthkit entitlement"
**Solution:**
1. Open Xcode → HoloSync.xcworkspace
2. Select HoloSync project → HoloSync target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability" → Add "HealthKit"
5. Ensure `HoloSync.entitlements` file is linked
6. Clean and rebuild project

### Error: "initHealthKit is not a function"
**Solution:**
```bash
# Re-link react-native-health library
cd ios
pod install --repo-update
cd ..
npx react-native run-ios --device
```

### HealthKit Not Working:
- Ensure you're testing on physical device (not simulator)
- Check HealthKit capability is added in Xcode
- Verify Info.plist has usage descriptions
- Check entitlements file is properly linked

### Build Errors:
```bash
# Clean build if needed
cd ios
xcodebuild clean -workspace HoloSync.xcworkspace -scheme HoloSync
pod install
```

### TestFlight Upload Issues:
- Ensure bundle identifier matches exactly
- Check provisioning profile is valid
- Verify all required metadata is filled in App Store Connect

## Step 5: Production Deployment

Once TestFlight testing is successful:

1. **Update version numbers:**
   - `app.json`: increment version
   - Xcode: increment build number

2. **Submit for App Store Review:**
   - Complete all App Store Connect requirements
   - Add screenshots
   - Fill app description
   - Submit for review

## Testing Commands

```bash
# Install dependencies
npm install
cd ios && pod install

# Run on device
cd .. && npx react-native run-ios --device

# Build for archive
cd ios
xcodebuild -workspace HoloSync.xcworkspace -scheme HoloSync -archivePath HoloSync.xcarchive archive
```

## HealthKit Permissions Requested

- Steps (read)
- Distance Walking/Running (read)  
- Apple Exercise Time (read)
- Workouts (read)

These permissions allow the app to:
- Track daily step count
- Calculate Sync Points from steps
- Monitor weekly progress
- Sync workout data for bonus points 