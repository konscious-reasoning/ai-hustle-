# Polygon Arbitrage Bot

A sophisticated Telegram-controlled cryptocurrency arbitrage trading bot for the Polygon network. The bot automatically detects price differences across multiple DEXs (QuickSwap, SushiSwap, Uniswap V3) and executes profitable trades.

## Features

- 🤖 **Telegram Interface**: Full bot control via Telegram commands
- 🔍 **Real-time Scanning**: Continuous monitoring for arbitrage opportunities
- ⚡ **Automated Trading**: Execute trades automatically when opportunities arise
- 🛡️ **Risk Management**: Configurable profit thresholds, gas limits, and slippage protection
- 💰 **Multi-DEX Support**: Integration with QuickSwap, SushiSwap, and Uniswap V3
- 📊 **Portfolio Tracking**: Real-time balance monitoring and trade reporting

## Supported Tokens

- WMATIC (Wrapped MATIC)
- USDC (USD Coin)
- USDT (Tether USD)
- WETH (Wrapped Ethereum)
- DAI (Dai Stablecoin)

## Quick Start

### Prerequisites

1. **Telegram Bot**: Create a bot via [@BotFather](https://t.me/BotFather) and get your bot token
2. **Polygon Wallet**: Have a wallet with MATIC for gas fees and tokens for trading
3. **Node.js**: Version 14 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/polygon-arbitrage-bot.git
   cd polygon-arbitrage-bot
   ```

2. **Install dependencies**:
   ```bash
   npm install telegraf ethers dotenv
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   POLYGON_RPC_URL=https://polygon-rpc.com
   PRIVATE_KEY=your_private_key_here
   ```

4. **Start the bot**:
   ```bash
   node index.js
   ```

## Bot Commands

### Trading Commands
- `/scan` - Find current arbitrage opportunities
- `/startbot` - Start automatic trading
- `/stopbot` - Stop automatic trading

### Information Commands
- `/status` - Check bot and wallet status
- `/balance` - View token balances
- `/config` - View configuration settings

### Configuration Commands
- `/setprofit <amount>` - Set minimum profit in USD
- `/setgas <price>` - Set maximum gas price in Gwei
- `/setslippage <percent>` - Set slippage tolerance

## Configuration

The bot can be configured via Telegram commands or environment variables:

| Setting | Command | Description | Default |
|---------|---------|-------------|---------|
| Min Profit | `/setprofit 10` | Minimum profit in USD to execute trade | $5 |
| Max Gas | `/setgas 50` | Maximum gas price in Gwei | 50 Gwei |
| Slippage | `/setslippage 0.5` | Slippage tolerance percentage | 0.5% |

## Security

⚠️ **Important Security Notes**:

- Never share your private key or bot token
- Use a dedicated wallet for trading with limited funds
- Test with small amounts first
- Monitor gas prices during high network activity
- Keep your environment variables secure

## Architecture
