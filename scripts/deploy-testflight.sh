#!/bin/bash

# HoloSync TestFlight Deployment Script
# This script builds and archives the iOS app for TestFlight distribution

set -e  # Exit on any error

echo "🚀 Starting HoloSync TestFlight deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is not installed or xcodebuild is not in PATH"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}🍎 Installing iOS pods...${NC}"
cd ios
pod install

echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
xcodebuild clean -workspace HoloSync.xcworkspace -scheme HoloSync

echo -e "${YELLOW}🔨 Building for device...${NC}"
xcodebuild -workspace HoloSync.xcworkspace \
           -scheme HoloSync \
           -destination 'generic/platform=iOS' \
           build

echo -e "${YELLOW}📦 Creating archive...${NC}"
xcodebuild -workspace HoloSync.xcworkspace \
           -scheme HoloSync \
           -archivePath "./build/HoloSync.xcarchive" \
           archive

echo -e "${GREEN}✅ Archive created successfully!${NC}"
echo ""
echo "📱 Next steps:"
echo "1. Open Xcode Organizer (Window → Organizer)"
echo "2. Select the HoloSync archive"
echo "3. Click 'Distribute App'"
echo "4. Choose 'App Store Connect'"
echo "5. Follow the upload process"
echo ""
echo "🌐 Then go to App Store Connect:"
echo "   https://appstoreconnect.apple.com"
echo ""
echo -e "${GREEN}🎉 Ready for TestFlight!${NC}" 