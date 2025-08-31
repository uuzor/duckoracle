# DuckOracle - Decentralized Prediction Markets

DuckOracle is a decentralized prediction market dApp built on DuckChain where users can create or bet on event outcomes with AI agents serving as oracles to resolve markets autonomously.

## Features

- **Decentralized Prediction Markets**: Create and participate in prediction markets on any topic
- **AI-Powered Oracles**: ChainGPT integration for autonomous market resolution
- **AMM Pricing**: Automated Market Maker for dynamic share pricing
- **$DUCK Token**: Native token for staking, betting, and rewards
- **Telegram Integration**: Native support for Telegram Mini Apps
- **Low Fees**: Built on DuckChain for minimal transaction costs

## User Flow

1. **Connect Wallet**: Connect DuckChain-compatible wallet (MetaMask with Arbitrum network)
2. **Browse Markets**: View active prediction markets with YES/NO outcomes
3. **Create Markets**: Deploy new markets with AI oracle resolution
4. **Place Bets**: Stake $DUCK tokens on market outcomes
5. **AI Resolution**: Automated resolution via ChainGPT oracles
6. **Claim Rewards**: Withdraw winnings from resolved markets

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Solidity smart contracts, Hardhat
- **Oracles**: ChainGPT integration for AI predictions
- **Network**: DuckChain (Arbitrum-compatible)
- **Wallet**: Farcaster integration, MetaMask support

## Smart Contracts

### DuckToken
ERC20 token with minting capabilities for the DuckOracle ecosystem.

### DuckOracle
Main prediction market contract with:
- Market creation and management
- AMM-based share trading
- AI oracle integration
- Automated resolution system

### ChainGPTOracle
Oracle contract for AI-powered market resolution using ChainGPT.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/duckoracle.git
cd duckoracle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Development

```bash
# Start the development server
npm run dev

# Compile smart contracts
npm run compile

# Deploy contracts locally
npm run deploy:contracts

# Deploy to DuckChain
npm run deploy:duckchain
```

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_NEYNAR_API_KEY=your_neynar_api_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_id
PRIVATE_KEY=your_deployment_private_key
DUCKCHAIN_RPC_URL=https://rpc.duckchain.io
```

## Smart Contract Deployment

1. **Compile contracts**:
   ```bash
   npm run compile
   ```

2. **Deploy to local network**:
   ```bash
   npm run deploy:contracts
   ```

3. **Deploy to DuckChain**:
   ```bash
   npm run deploy:duckchain
   ```

## Usage

### Creating a Market

1. Navigate to the "Create" tab
2. Enter your prediction question
3. Set resolution criteria
4. Choose data source (on-chain/off-chain)
5. Stake initial $DUCK tokens
6. Deploy the market

### Betting on Markets

1. Browse active markets
2. Select a market to view details
3. Choose YES or NO outcome
4. Enter your stake amount
5. Confirm the transaction

### AI Oracle Resolution

Markets are automatically resolved by AI agents that:
- Analyze market criteria
- Fetch relevant data sources
- Provide confidence scores
- Execute resolution transactions

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Smart Contracts │    │   AI Oracles    │
│   (Next.js)     │◄──►│   (Solidity)     │◄──►│   (ChainGPT)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DuckChain     │    │   $DUCK Token    │    │   Data Sources  │
│   (Blockchain)  │    │   (ERC20)        │    │   (APIs/Feeds)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Hackathon

Built for **DuckChain x AWS Hack: AI Unchained** - showcasing decentralized prediction markets with AI-powered oracles on DuckChain.

## Links

- [DuckChain Documentation](https://docs.duckchain.io)
- [ChainGPT API](https://chaingpt.org)
- [Farcaster Mini Apps](https://docs.farcaster.xyz/developers/frames/v2)
- [Live Demo](https://duckoracle.vercel.app)