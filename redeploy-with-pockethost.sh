#!/bin/bash

# DigitalOcean Fresh Deployment Script with PocketHost
# Run this script on your DigitalOcean droplet to clean deploy with PocketHost

set -e

echo "🚀 Starting fresh deployment with PocketHost..."

# Step 1: Clean up existing deployment
echo "🧹 Cleaning up existing deployment..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo pkill -f pocketbase 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true

# Remove old directory
cd /root
if [ -d "eth-nyc-orchestrator" ]; then
    echo "Removing existing eth-nyc-orchestrator directory..."
    rm -rf eth-nyc-orchestrator
fi

# Step 2: Fresh deployment
echo "📥 Cloning repository..."
git clone https://github.com/junkim012/eth-nyc-orchestrator.git eth-nyc-orchestrator
cd eth-nyc-orchestrator

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "📝 Creating .env file with PocketHost configuration..."
cat > .env << 'EOF'
# Ethereum Configuration
ETHEREUM_RPC_URL=https://nd-489-221-744.p2pify.com/6179c84d7869593699be73681b4a96d9
PRIVATE_KEY=

# PocketBase Configuration
POCKETBASE_URL=https://labubank.pockethost.io/
POCKETBASE_ADMIN_EMAIL=junkim012@gmail.com
POCKETBASE_ADMIN_PASSWORD=ethglobalnycpocketbase

# Server Configuration
PORT=3000

# Contract Addresses
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
ROUTER_ADDRESS=0xc4B88dF36d721bC80F6Ce1e7373E9e0C38598555
EOF

echo "📁 Creating logs directory..."
mkdir -p logs

# Step 3: Update nginx configuration
echo "🌐 Updating nginx configuration..."
sudo tee /etc/nginx/sites-available/orchestrator > /dev/null <<'NGINX_EOF'
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

    # Default response
    location / {
        return 200 'Orchestrator API is running. Use /api endpoints.';
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Enable the site and test nginx configuration
sudo ln -sf /etc/nginx/sites-available/orchestrator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "🔧 Testing nginx configuration..."
sudo nginx -t
sudo systemctl reload nginx

# Step 4: Start services with PM2
echo "🚀 Starting API service with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "📊 Checking PM2 status..."
pm2 status

# Step 5: Test the deployment
echo "🧪 Testing deployment..."
sleep 5

echo "Testing health endpoint..."
if curl -f http://localhost:3000/health >/dev/null 2>&1; then
    echo "✅ Local health check passed"
else
    echo "❌ Local health check failed"
fi

echo "Testing cached monitoring addresses..."
if curl -f http://localhost:3000/api/cached-monitoring-addresses >/dev/null 2>&1; then
    echo "✅ Local API check passed"
else
    echo "❌ Local API check failed"
fi

# Get public IP for external testing
PUBLIC_IP=$(curl -s ifconfig.me)
echo "Testing external access..."
if curl -f http://$PUBLIC_IP/health >/dev/null 2>&1; then
    echo "✅ External health check passed"
else
    echo "❌ External health check failed"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your API is available at:"
echo "   Health: http://$PUBLIC_IP/health"
echo "   API: http://$PUBLIC_IP/api/cached-monitoring-addresses"
echo ""
echo "📊 Monitor services with:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""
echo "🗄️ PocketBase admin: https://labubank.pockethost.io/_/"
echo ""