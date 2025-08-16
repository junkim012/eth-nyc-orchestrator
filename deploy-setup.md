# Deployment Setup Guide

## Option 1: Railway (Recommended - Simplest)

### Step 1: Setup Railway
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`

### Step 2: Deploy
```bash
# In your project directory
railway login
railway init
railway add -d postgresql  # Adds PostgreSQL database
railway up                 # Deploys your app
```

### Step 3: Set Environment Variables
```bash
railway variables set ETHEREUM_RPC_URL="your-infura-or-alchemy-url"
railway variables set POCKETBASE_URL="http://localhost:8090"  # Will update this
railway variables set POCKETBASE_ADMIN_EMAIL="admin@yourapp.com"
railway variables set POCKETBASE_ADMIN_PASSWORD="your-secure-password"
railway variables set USDC_ADDRESS="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
railway variables set PYUSD_ADDRESS="0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
railway variables set ROUTER_ADDRESS="your-router-contract-address"
```

### Step 4: Setup PocketBase on Railway
```bash
# Add PocketBase service
railway add -d pocketbase
# Or manually deploy PocketBase container
```

---

## Option 2: Render (Alternative)

### Step 1: Setup Render
1. Go to [render.com](https://render.com) and connect GitHub
2. Create new Web Service from your GitHub repo

### Step 2: Configure Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Instance Type**: Starter ($7/month)

### Step 3: Add PostgreSQL Database
- Add PostgreSQL database in Render dashboard
- Get connection string and update your app to use it

---

## Option 3: AWS (More Control)

### Quick AWS Setup
1. Use AWS App Runner for the API
2. Use AWS RDS for PostgreSQL
3. Use AWS Lambda for the event listener (separate deployment)

---

## Environment Variables Needed

```bash
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POCKETBASE_URL=https://your-pocketbase-url.com
POCKETBASE_ADMIN_EMAIL=admin@yourapp.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
PYUSD_ADDRESS=0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
ROUTER_ADDRESS=your-deployed-router-contract-address
PORT=3000
```

## Post-Deployment Checklist

1. ✅ API endpoints responding (`/health`, `/api/create-deposit-address`)
2. ✅ Database connected and schema imported
3. ✅ Event listener running (check logs for "Starting Ethereum event listener...")
4. ✅ Cache initialization working
5. ✅ Test creating a deposit address
6. ✅ Test monitoring endpoint

## Quick Test Commands

```bash
# Health check
curl https://your-app-url.com/health

# Create deposit address
curl -X POST https://your-app-url.com/api/create-deposit-address \
  -H "Content-Type: application/json" \
  -d '{"userPublicAddress": "0x1234567890abcdef1234567890abcdef12345678"}'

# Check monitoring addresses
curl https://your-app-url.com/api/cached-monitoring-addresses
```