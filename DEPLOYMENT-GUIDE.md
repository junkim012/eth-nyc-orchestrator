# 🚀 DigitalOcean Deployment Guide

## Quick Start (5 minutes)

### Step 1: Create DigitalOcean Droplet (2 minutes)

1. Go to [DigitalOcean](https://digitalocean.com) and sign up
2. Click "Create" → "Droplets"
3. Choose **"Node.js on Ubuntu 22.04"** from Marketplace
4. Select **$4/month Basic droplet** (1 GB RAM, 1 vCPU)
5. Choose a datacenter region (closest to you)
6. Add your SSH key or create a password
7. Click "Create Droplet"
8. **Copy the IP address** when ready

### Step 2: Deploy Your App (3 minutes)

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Clone your repository
git clone YOUR_REPO_URL orchestrator
cd orchestrator

# Make scripts executable
chmod +x deploy-digitalocean.sh
chmod +x setup-env.sh

# Set up environment variables
./setup-env.sh

# Deploy everything
./deploy-digitalocean.sh
```

### Step 3: Test Your Deployment

```bash
# Health check
curl http://YOUR_DROPLET_IP/health

# Test API
curl http://YOUR_DROPLET_IP/api/cached-monitoring-addresses
```

**That's it! Your app is live! 🎉**

---

## What You Need Before Starting

### Required Information
- **Ethereum RPC URL**: Get free from [Infura](https://infura.io) or [Alchemy](https://alchemy.com)
- **Router Contract Address**: Your deployed contract address
- **Admin Email/Password**: For PocketBase admin access

### Get Ethereum RPC URL (1 minute)
1. Go to [Infura.io](https://infura.io) → Sign up
2. Create new project → Copy endpoint URL
3. Format: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`

---

## Detailed Deployment Steps

### 1. DigitalOcean Setup

#### Droplet Configuration:
- **Image**: Node.js on Ubuntu 22.04 (Marketplace)
- **Plan**: Basic $4/month (sufficient for testing)
- **Size**: 1 GB RAM, 1 vCPU, 25 GB SSD
- **Region**: Choose closest to your location
- **Authentication**: SSH Key (recommended) or Password

#### After Creation:
- Note your droplet's **public IP address**
- SSH access: `ssh root@YOUR_IP`

### 2. Environment Setup

The `setup-env.sh` script will prompt you for:

```bash
# Ethereum Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Contract Addresses
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
ROUTER_ADDRESS=your-deployed-router-contract-address

# Database
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@yourapp.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password

# Server
PORT=3000
```

### 3. What the Deployment Script Does

The `deploy-digitalocean.sh` script automatically:

1. ✅ **Updates system packages**
2. ✅ **Installs nginx, PM2, and dependencies**
3. ✅ **Downloads and configures PocketBase**
4. ✅ **Sets up nginx reverse proxy**
5. ✅ **Builds your Node.js application**
6. ✅ **Starts both services with PM2**
7. ✅ **Configures auto-restart on server reboot**

### 4. Services Architecture

```
nginx (Port 80) → Routes traffic
├── /api/* → Node.js App (Port 3000)
├── /health → Node.js App (Port 3000)
└── /admin → PocketBase (Port 8090)
```

---

## Post-Deployment Setup

### 1. Import PocketBase Schema

```bash
# Access PocketBase admin
http://YOUR_IP/admin

# Create admin account when prompted
# Import pb_schema.json in the admin interface
```

### 2. Verify Everything Works

```bash
# Check services are running
pm2 status

# Test API endpoints
curl http://YOUR_IP/health
curl http://YOUR_IP/api/cached-monitoring-addresses

# Create a deposit address
curl -X POST http://YOUR_IP/api/create-deposit-address \
  -H "Content-Type: application/json" \
  -d '{"userPublicAddress": "0x1234567890abcdef1234567890abcdef12345678"}'
```

### 3. Monitor Services

```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor system resources
htop
```

---

## SSL Certificate (Optional but Recommended)

### Quick SSL with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Costs

### Monthly Costs:
- **DigitalOcean Droplet**: $4-6/month
- **Domain (optional)**: $10-15/year
- **Total**: ~$5-7/month

### Scaling:
- Start with $4/month droplet
- Upgrade to $12/month (2GB RAM) if needed
- Add monitoring droplet ($4/month) for production

---

## Troubleshooting

### Common Issues:

#### Services Not Starting
```bash
# Check logs
pm2 logs

# Restart services
pm2 restart all

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

#### Can't Access API
```bash
# Check firewall (DigitalOcean usually opens port 80)
sudo ufw status

# Check if services are running
pm2 status
curl localhost:3000/health
```

#### Database Issues
```bash
# Check PocketBase logs
pm2 logs pocketbase

# Restart PocketBase
pm2 restart pocketbase

# Access admin directly
curl localhost:8090
```

### Log Locations:
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **Application Logs**: `./logs/` (in your app directory)

---

## Useful Commands

```bash
# Service Management
pm2 status                    # Check service status
pm2 restart all               # Restart all services
pm2 logs                      # View logs
pm2 monit                     # Real-time monitoring

# System Management
htop                          # System resources
df -h                         # Disk usage
free -m                       # Memory usage

# Nginx Management
sudo nginx -t                 # Test nginx config
sudo systemctl reload nginx   # Reload nginx
sudo systemctl status nginx   # Check nginx status

# Updates
git pull                      # Update code
npm run build                 # Rebuild app
pm2 restart orchestrator-api  # Restart API only
```

---

## Next Steps After Deployment

1. ✅ **Test all API endpoints**
2. ✅ **Create a few deposit addresses**
3. ✅ **Monitor event listener logs**
4. ✅ **Set up monitoring/alerts** (optional)
5. ✅ **Configure backups** for PocketBase data
6. ✅ **Add domain name and SSL** (optional)

Your orchestrator is now live and ready to process USDC to pyUSD swaps! 🎉