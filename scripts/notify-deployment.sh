#!/bin/bash

# macOS System Notification Script
# Run this after successful deployments

PROJECT_NAME="Padel Booking"
DEPLOYMENT_URL=$1

if [ -z "$DEPLOYMENT_URL" ]; then
    DEPLOYMENT_URL="https://your-app.vercel.app"
fi

# Send macOS notification
osascript -e "display notification \"Deployment successful! 🎉\" with title \"$PROJECT_NAME\" subtitle \"Ready to test\" sound name \"Glass\""

# Optional: Open the deployed site
# open "$DEPLOYMENT_URL"

echo "✅ Notification sent for $PROJECT_NAME deployment"