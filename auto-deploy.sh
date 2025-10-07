#!/bin/bash

echo "🚀 Auto Deploy Token Webhook Server"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized!"
    exit 1
fi

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Not on main branch. Current branch: $CURRENT_BRANCH"
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "There are uncommitted changes. Committing them..."
    git add .
    git commit -m "Auto-deploy: $(date)"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Code pushed to GitHub successfully!"
else
    print_error "Failed to push to GitHub!"
    exit 1
fi

# Check if Railway CLI is available
if command -v railway &> /dev/null; then
    print_status "Railway CLI found. Deploying to Railway..."
    railway login
    railway up
    print_success "Deployed to Railway!"
else
    print_warning "Railway CLI not found. Please install it or deploy manually."
fi

# Check if Render CLI is available
if command -v render &> /dev/null; then
    print_status "Render CLI found. Deploying to Render..."
    render deploy
    print_success "Deployed to Render!"
else
    print_warning "Render CLI not found. Please install it or deploy manually."
fi

print_success "Deployment process completed!"
print_status "Next steps:"
echo "1. Go to https://railway.app or https://render.com"
echo "2. Connect your GitHub repository: DuyNhat9/token-webhook-server"
echo "3. Set environment variables:"
echo "   - KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954"
echo "   - API_KEY = your-secret-api-key-123"
echo "   - WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook"
echo "   - CRON_SECRET = your-cron-secret-456"
echo "4. Deploy and get your server URL"
echo "5. Test with: curl https://your-app-url/health"
