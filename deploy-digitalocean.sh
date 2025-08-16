#!/bin/bash

# DigitalOcean Deployment Script for USDC to pyUSD Orchestrator
# Run this script on your DigitalOcean droplet after creating a Node.js droplet

set -e

echo "🚀 Starting deployment on DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y nginx git curl unzip

# Install PM2 globally if not already installed
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create app directory
echo "📁 Setting up application directory..."
cd $HOME
APP_DIR="$HOME/eth-nyc-orchestrator"

# Clone the repository
echo "📥 Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "Directory exists, pulling latest changes..."
    cd $APP_DIR
    git pull
else
    git clone https://github.com/junkim012/eth-nyc-orchestrator.git eth-nyc-orchestrator
fi

cd $APP_DIR

# Install dependencies and build
echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env with your actual values:"
    echo "   nano .env"
    echo ""
    echo "Required environment variables:"
    echo "   - ETHEREUM_RPC_URL (get from Infura/Alchemy)"
    echo "   - ROUTER_ADDRESS (your deployed contract)"
    echo "   - POCKETBASE_ADMIN_EMAIL"
    echo "   - POCKETBASE_ADMIN_PASSWORD"
    echo ""
fi

# Download PocketBase
echo "📥 Downloading PocketBase..."
POCKETBASE_VERSION="0.22.20"
if [ ! -f "./pocketbase" ]; then
    wget "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    unzip "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    rm "pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip"
    chmod +x pocketbase
fi

# Create PocketBase data directory
mkdir -p pb_data

# Set up nginx configuration
echo "🌐 Setting up nginx..."
sudo tee /etc/nginx/sites-available/orchestrator > /dev/null <<EOL
server {
    listen 80;
    server_name _;

    # API endpoints
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # PocketBase admin (optional, for database management)
    location /admin {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Default response for other paths
    location / {
        return 200 'Orchestrator API is running. Use /api endpoints.';
        add_header Content-Type text/plain;
    }
}
EOL

# Enable the site
sudo ln -sf /etc/nginx/sites-available/orchestrator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Start services with PM2
echo "🚀 Starting services with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit your .env file: nano .env"
echo "2. Import PocketBase schema: ./pocketbase admin (then visit http://your-ip/admin)"
echo "3. Restart services: pm2 restart all"
echo ""
echo "🌐 Your API will be available at:"
echo "   http://$(curl -s ifconfig.me)/health"
echo "   http://$(curl -s ifconfig.me)/api/cached-monitoring-addresses"
echo ""
echo "📊 Monitor services:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""