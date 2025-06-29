// commands/index.js - Telegram Bot Commands
const ArbitrageService = require('../services/arbitrage');
const TradingService = require('../services/trading');

let bot, provider, wallet, config, isTrading, tradingInterval;
let arbitrageService, tradingService;

function init(botInstance, dependencies) {
    bot = botInstance;
    provider = dependencies.provider;
    wallet = dependencies.wallet;
    config = dependencies.config;
    isTrading = dependencies.isTrading;
    tradingInterval = dependencies.tradingInterval;
    
    arbitrageService = new ArbitrageService(provider);
    tradingService = new TradingService(provider, wallet);
    
    setupCommands();
}

function setupCommands() {
    // Start command
    bot.start((ctx) => {
        const welcomeMessage = `
🤖 *Polygon Arbitrage Bot - Demo Mode*

Welcome! I'm your personal arbitrage trading assistant.

*Available Commands:*
/status - Check wallet and bot status
/scan - Find arbitrage opportunities
/startbot - Start automatic trading (demo mode)
/stopbot - Stop automatic trading
/config - View/modify settings
/balance - Check token balances
/help - Show this help message

*Demo Mode Features:*
• Simulated trading with realistic market data
• No real funds at risk
• Full functionality demonstration
• Live opportunity scanning

Ready to demonstrate arbitrage trading! 🚀
        `;
        
        ctx.replyWithMarkdown(welcomeMessage);
    });

    // Status command
    bot.command('status', async (ctx) => {
        try {
            let statusMessage = `📊 *Bot Status*\n\n`;
            
            if (wallet) {
                const balance = await provider.getBalance(wallet.address);
                const maticBalance = ethers.formatEther(balance);
                const gasInfo = await tradingService.checkGasPrice();
                
                statusMessage += `*Mode:* Demo Trading Enabled
*Wallet:* \`${wallet.address}\`
*MATIC Balance:* ${parseFloat(maticBalance).toFixed(4)} MATIC
*Gas Price:* ${parseFloat(gasInfo.gwei).toFixed(2)} Gwei
*Trading Status:* ${isTrading ? '🟢 Active (Demo)' : '🔴 Stopped'}`;
            } else {
                statusMessage += `*Mode:* Read-Only (Scanning Only)
*Trading Status:* ❌ Disabled (No wallet configured)
*Note:* Add PRIVATE_KEY to .env to enable trading`;
            }
            
            statusMessage += `\n\n*Configuration:*
• Min Profit: $${config.minProfitUSD}
• Max Gas: ${config.maxGasPrice} Gwei
• Slippage: ${config.slippage}%`;
            
            ctx.replyWithMarkdown(statusMessage);
        } catch (error) {
            ctx.reply(`❌ Error getting status: ${error.message}`);
        }
    });

    // Scan command
    bot.command('scan', async (ctx) => {
        ctx.reply('🔍 Scanning for arbitrage opportunities...');
        
        try {
            const opportunities = await arbitrageService.findArbitrageOpportunities(config);
            
            if (opportunities.length === 0) {
                ctx.reply('No profitable arbitrage opportunities found at the moment.');
                return;
            }
            
            let message = '💰 *Arbitrage Opportunities Found:*\n\n';
            
            opportunities.forEach((opp, index) => {
                message += `*${index + 1}. ${opp.token}*\n`;
                message += `Buy: ${opp.buyDex} @ $${opp.buyPrice}\n`;
                message += `Sell: ${opp.sellDex} @ $${opp.sellPrice}\n`;
                message += `Profit: $${opp.profit} (${opp.profitPercent}%)\n\n`;
            });
            
            ctx.replyWithMarkdown(message);
            
        } catch (error) {
            ctx.reply(`❌ Error scanning: ${error.message}`);
        }
    });

    // Start bot command
    bot.command('startbot', async (ctx) => {
        if (!wallet) {
            ctx.reply('❌ Trading not available in read-only mode. Add your PRIVATE_KEY to .env to enable trading.');
            return;
        }
        
        if (isTrading) {
            ctx.reply('🟡 Bot is already running!');
            return;
        }
        
        isTrading = true;
        ctx.reply('🟢 Demo arbitrage bot started! Monitoring opportunities and simulating trades...');
        
        tradingInterval = setInterval(async () => {
            try {
                const opportunities = await arbitrageService.findArbitrageOpportunities(config);
                
                for (const opp of opportunities) {
                    const result = await tradingService.executeArbitrage(opp, config);
                    
                    if (result.success) {
                        const demoLabel = opp.type === 'demo' ? '🎯 DEMO TRADE' : '✅ TRADE EXECUTED';
                        ctx.replyWithMarkdown(`
${demoLabel}

*Pair:* ${opp.token}
*Buy DEX:* ${result.buyDex} @ $${opp.buyPrice}
*Sell DEX:* ${result.sellDex} @ $${opp.sellPrice}
*Gross Profit:* $${opp.profit}
*Gas Cost:* $${result.gasCostUSD}
*Net Profit:* $${result.profit}
*Gas Used:* ${result.gasUsed} MATIC
*TX Hash:* \`${result.txHash}\`

${opp.type === 'demo' ? '*This is a simulated trade for demonstration*' : ''}
                        `);
                    } else if (result.error !== 'Gas price too high') {
                        console.log('Trade failed:', result.error);
                    }
                }
            } catch (error) {
                console.error('Trading error:', error);
            }
        }, 15000); // Check every 15 seconds for demo
    });

    // Stop bot command
    bot.command('stopbot', (ctx) => {
        if (!isTrading) {
            ctx.reply('🟡 Bot is not currently running.');
            return;
        }
        
        isTrading = false;
        if (tradingInterval) {
            clearInterval(tradingInterval);
            tradingInterval = null;
        }
        
        ctx.reply('🔴 Arbitrage bot stopped.');
    });

    // Config command
    bot.command('config', (ctx) => {
        const configMessage = `
⚙️ *Current Configuration*

*Min Profit:* $${config.minProfitUSD}
*Max Gas Price:* ${config.maxGasPrice} Gwei
*Slippage:* ${config.slippage}%

*To modify, use:*
/setprofit <amount> - Set minimum profit in USD
/setgas <price> - Set maximum gas price in Gwei
/setslippage <percent> - Set slippage tolerance
        `;
        
        ctx.replyWithMarkdown(configMessage);
    });

    // Balance command
    bot.command('balance', async (ctx) => {
        if (!wallet) {
            ctx.reply('❌ Balance check not available in read-only mode. Add your PRIVATE_KEY to .env to enable wallet features.');
            return;
        }
        
        try {
            ctx.reply('💰 Fetching token balances...');
            const balances = await tradingService.getTokenBalances();
            
            let message = '💰 *Token Balances:*\n\n';
            
            for (const [symbol, balance] of Object.entries(balances)) {
                const formatted = parseFloat(balance).toFixed(4);
                if (parseFloat(formatted) > 0) {
                    message += `${symbol}: ${formatted}\n`;
                }
            }
            
            if (message === '💰 *Token Balances:*\n\n') {
                message += 'No token balances found.';
            }
            
            ctx.replyWithMarkdown(message);
            
        } catch (error) {
            ctx.reply(`❌ Error getting balances: ${error.message}`);
        }
    });

    // Configuration commands
    bot.command('setprofit', (ctx) => {
        const amount = parseFloat(ctx.message.text.split(' ')[1]);
        if (isNaN(amount) || amount <= 0) {
            ctx.reply('❌ Please provide a valid profit amount: /setprofit 10');
            return;
        }
        
        config.minProfitUSD = amount;
        ctx.reply(`✅ Minimum profit set to $${amount}`);
    });

    bot.command('setgas', (ctx) => {
        const price = parseFloat(ctx.message.text.split(' ')[1]);
        if (isNaN(price) || price <= 0) {
            ctx.reply('❌ Please provide a valid gas price: /setgas 50');
            return;
        }
        
        config.maxGasPrice = price;
        ctx.reply(`✅ Maximum gas price set to ${price} Gwei`);
    });

    bot.command('setslippage', (ctx) => {
        const slippage = parseFloat(ctx.message.text.split(' ')[1]);
        if (isNaN(slippage) || slippage <= 0 || slippage > 10) {
            ctx.reply('❌ Please provide a valid slippage (0.1-10): /setslippage 0.5');
            return;
        }
        
        config.slippage = slippage;
        ctx.reply(`✅ Slippage tolerance set to ${slippage}%`);
    });

    // Help command
    bot.help((ctx) => {
        const helpMessage = `
🤖 *Polygon Arbitrage Bot Help*

*Trading Commands:*
/scan - Find current arbitrage opportunities
/startbot - Start automatic trading
/stopbot - Stop automatic trading

*Information Commands:*
/status - Check bot and wallet status
/balance - View token balances
/config - View configuration settings

*Configuration Commands:*
/setprofit <amount> - Set minimum profit in USD
/setgas <price> - Set max gas price in Gwei
/setslippage <percent> - Set slippage tolerance

*Tips:*
• Keep some MATIC for gas fees
• Start with small profit targets
• Monitor gas prices during high network activity
• The bot scans every 30 seconds when active

Need more help? Check the documentation or contact support.
        `;
        
        ctx.replyWithMarkdown(helpMessage);
    });
}

module.exports = { init };
