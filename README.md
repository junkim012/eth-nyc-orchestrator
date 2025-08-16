# USDC to pyUSD Orchestrator

A TypeScript service that allows users to create deposit addresses and automatically swaps received USDC to pyUSD via a custom Router contract.

## Features

- **API Endpoint**: `/create-deposit-address` - Creates a unique deposit address for each user
- **Database**: PocketBase integration for storing user-to-deposit address mappings
- **Event Listener**: Monitors Ethereum for USDC transfers to deposit addresses
- **Automated Swaps**: Automatically swaps USDC to pyUSD using custom Router contract

## Architecture

1. User calls `/create-deposit-address` with their public Ethereum address
2. System generates a new deposit wallet and stores the mapping in PocketBase
3. Event listener monitors for USDC transfers to any deposit address
4. When USDC is received, system automatically swaps to pyUSD and sends to user's address

## Setup

### Prerequisites

- Node.js 18+
- PocketBase instance
- Ethereum RPC endpoint (Infura, Alchemy, etc.)
- Private key with ETH for gas fees

### Installation

1. Clone and install dependencies:
```bash
cd orchestrator
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PocketBase:
```bash
# Download PocketBase from https://pocketbase.io/docs/
# Start PocketBase
./pocketbase serve

# Import the schema from pb_schema.json in the admin panel
# Or manually create the user_mappings collection with the required fields
```

4. Build and run:
```bash
npm run build
npm start

# For development:
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint |
| `PRIVATE_KEY` | Private key for gas payments |
| `POCKETBASE_URL` | PocketBase instance URL |
| `POCKETBASE_ADMIN_EMAIL` | PocketBase admin email |
| `POCKETBASE_ADMIN_PASSWORD` | PocketBase admin password |
| `PORT` | Server port (default: 3000) |
| `USDC_ADDRESS` | USDC contract address |
| `PYUSD_ADDRESS` | pyUSD contract address |
| `ROUTER_ADDRESS` | Custom Router contract address |

## API Endpoints

### POST /api/create-deposit-address

Creates a deposit address for a user.

**Request:**
```json
{
  "userPublicAddress": "0x1234...5678"
}
```

**Response:**
```json
{
  "depositAddress": "0xabcd...efgh",
  "userPublicAddress": "0x1234...5678",
  "message": "Deposit address created successfully"
}
```

### GET /health

Health check endpoint.

## Contract Addresses (Mainnet)

- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **pyUSD**: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- **Router**: `your-deployed-router-contract-address`

## Security Considerations

- Private keys are stored in PocketBase - ensure proper security measures
- Consider using AWS KMS or similar for key management in production
- Implement rate limiting and input validation
- Monitor for suspicious activity
- Set up proper logging and alerting

## Deployment

### AWS Lambda (Serverless)

1. Install serverless framework
2. Configure serverless.yml
3. Deploy with `serverless deploy`

### Docker

```bash
docker build -t orchestrator .
docker run -p 3000:3000 --env-file .env orchestrator
```

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Monitoring

- Logs are written to `logs/` directory
- Use `/health` endpoint for health checks
- Monitor Ethereum event processing for delays
- Set up alerts for failed swaps

## Troubleshooting

### Common Issues

1. **Event listener not working**: Check RPC endpoint and network connectivity
2. **Swaps failing**: Ensure sufficient ETH for gas and Router contract is properly deployed
3. **Database errors**: Verify PocketBase connection and schema
4. **Address validation**: Ensure proper Ethereum address format

### Logs

Check logs in the `logs/` directory:
- `error.log` - Error messages only
- `combined.log` - All log messages