#!/bin/bash

# Environment Setup Script for Production
# This script helps you configure the .env file for production deployment

echo "🔧 Setting up production environment..."

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create .env from template
cp .env.example .env

echo ""
echo "📝 Please provide the following configuration values:"
echo ""

# Function to prompt for input with default value
prompt_with_default() {
    local var_name=$1
    local prompt_text=$2
    local default_value=$3
    local is_secret=$4
    
    if [ "$is_secret" = "true" ]; then
        echo -n "$prompt_text: "
        read -s user_input
        echo ""
    else
        read -p "$prompt_text [$default_value]: " user_input
    fi
    
    if [ -z "$user_input" ]; then
        user_input=$default_value
    fi
    
    # Update .env file
    if grep -q "^$var_name=" .env; then
        sed -i "s|^$var_name=.*|$var_name=$user_input|" .env
    else
        echo "$var_name=$user_input" >> .env
    fi
}

# Ethereum Configuration
echo "🔗 Ethereum Configuration:"
prompt_with_default "ETHEREUM_RPC_URL" "Ethereum RPC URL (get from Infura/Alchemy)" "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"

echo ""
echo "📄 Contract Addresses:"
prompt_with_default "USDC_ADDRESS" "USDC Contract Address" "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
prompt_with_default "PYUSD_ADDRESS" "pyUSD Contract Address" "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8"
prompt_with_default "ROUTER_ADDRESS" "Router Contract Address" "YOUR_ROUTER_CONTRACT_ADDRESS"

echo ""
echo "🗄️  Database Configuration:"
prompt_with_default "POCKETBASE_URL" "PocketBase URL" "http://localhost:8090"
prompt_with_default "POCKETBASE_ADMIN_EMAIL" "PocketBase Admin Email" "admin@yourapp.com"
prompt_with_default "POCKETBASE_ADMIN_PASSWORD" "PocketBase Admin Password" "" "true"

echo ""
echo "🌐 Server Configuration:"
prompt_with_default "PORT" "Server Port" "3000"

echo ""
echo "✅ Environment configuration complete!"
echo ""
echo "📁 Your .env file has been created with the following structure:"
echo ""
cat .env | sed 's/=.*/=***/' | grep -v "PASSWORD"
echo ""
echo "🔒 Passwords and sensitive data have been hidden in this output."
echo ""
echo "🚀 Next steps:"
echo "1. Review your .env file: nano .env"
echo "2. Make sure all values are correct"
echo "3. Run the deployment script: ./deploy-digitalocean.sh"
echo ""