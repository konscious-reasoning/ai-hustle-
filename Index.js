require('dotenv').config();
const { Telegraf } = require('telegraf');
const { ethers } = require('ethers');
const cron = require('node-cron');

// Import services
const ArbitrageService = require('./Services/arbitrage');
const TradingService = require('./Services/trading');

// Import commands
const commands = require('./Commands/index');

// Import config
const { TOKENS } = require('./Config/tokens');
const { DEXS } = require('./Config/dex');

class PolygonArbitrageBot {
    constructor() {
        this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        this.provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        
        this.config = {
            minProfitUSD: parseFloat(process.env.MIN_PROFIT_USD) || 5,
            maxGasGwei: parseInt(process.env.MAX_GAS_GWEI) || 50,
            slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 0.5,
            isRunning: false
        };

        this.arbitrageService = new ArbitrageService(this.provider, this.wallet);
        this.tradingService = new TradingService(this.provider, this.wallet);
        
        this.initializeCommands();
        this.startCronJobs();
    }

    initializeCommands() {
        // Initialize all bot commands
        commands.init(this.bot, this);
        
        // Error handling
        this.bot.catch((err, ctx) => {
            console.error('Bot error:', err);
            ctx.reply('❌ An error occurred. Please try again.');
        });
    }

    startCronJobs() {
        // Scan for opportunities every 30 seconds when bot is running
        cron.schedule('*/30 * * * * *', async () => {
            if (this.config.isRunning) {
                try {
                    await this.scanAndTrade();
                } catch (error) {
                    console.error('Cron job error:', error);
                }
            }
        });
    }

    async scanAndTrade() {
        try {
            const opportunities = await this.arbitrageService.findOpportunities(this.config);
            
            for (const opportunity of opportunities) {
                if (opportunity.profitUSD >= this.config.minProfitUSD) {
                    console.log(`Found profitable opportunity: ${opportunity.profitUSD} USD`);
                    
                    const result = await this.tradingService.executeTrade(opportunity, this.config);
                    
                    if (result.success) {
                        console.log('Trade executed successfully:', result);
                    } else {
                        console.log('Trade failed:', result.error);
                    }
                }
            }
        } catch (error) {
            console.error('Scan and trade error:', error);
        }
    }

    async getBalance(tokenAddress) {
        try {
            if (tokenAddress === ethers.constants.AddressZero) {
                // Native MATIC balance
                const balance = await this.provider.getBalance(this.wallet.address);
                return ethers.utils.formatEther(balance);
            } else {
                // ERC20 token balance
                const tokenContract = new ethers.Contract(
                    tokenAddress,
                    ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
                    this.provider
                );
                
                const balance = await tokenContract.balanceOf(this.wallet.address);
                const decimals = await tokenContract.decimals();
                return ethers.utils.formatUnits(balance, decimals);
            }
        } catch (error) {
            console.error(`Error getting balance for ${tokenAddress}:`, error);
            return '0';
        }
    }

    async start() {
        try {
            console.log('🤖 Starting Polygon Arbitrage Bot...');
            
            // Test connection
            const network = await this.provider.getNetwork();
            console.log(`📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
            
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`💰 Wallet balance: ${ethers.utils.formatEther(balance)} MATIC`);
            
            await this.bot.launch();
            console.log('✅ Bot is running!');
            
            // Graceful shutdown
            process.once('SIGINT', () => this.bot.stop('SIGINT'));
            process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
            
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }
}

// Start the bot
const bot = new PolygonArbitrageBot();
bot.start();
