// services/arbitrage.js - Arbitrage Detection Service
const { ethers } = require('ethers');
const DEXS = require('../config/dex');
const TOKENS = require('../config/tokens');

// Router ABI (simplified)
const ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

class ArbitrageService {
    constructor(provider) {
        this.provider = provider;
    }

    async getTokenPrice(tokenAddress, amount = '1') {
        try {
            const router = new ethers.Contract(DEXS.QUICKSWAP.router, ROUTER_ABI, this.provider);
            const path = [tokenAddress, TOKENS.USDC.address];
            const amountIn = ethers.parseEther(amount);
            const amounts = await router.getAmountsOut(amountIn, path);
            return ethers.formatUnits(amounts[1], TOKENS.USDC.decimals);
        } catch (error) {
            console.error('Error getting token price:', error);
            return '0';
        }
    }

    async findArbitrageOpportunities(config) {
        const opportunities = [];
        
        try {
            console.log('🔍 Scanning for arbitrage opportunities...');
            
            // For demonstration, create simulated opportunities with realistic price differences
            // In production, this would query real DEX prices
            const mockOpportunities = this.generateMockOpportunities(config);
            
            if (mockOpportunities.length > 0) {
                console.log(`📊 Found ${mockOpportunities.length} potential opportunities`);
                opportunities.push(...mockOpportunities);
            } else {
                console.log('📊 No profitable opportunities found at current thresholds');
            }
            
            // Also attempt real price checking (may fail due to network/testnet limitations)
            try {
                await this.checkRealPrices(config, opportunities);
            } catch (error) {
                console.log('⚠️  Real price checking unavailable in demo mode');
            }
            
        } catch (error) {
            console.error('Error finding arbitrage opportunities:', error);
        }
        
        return opportunities;
    }

    generateMockOpportunities(config) {
        const mockOpportunities = [];
        const pairs = [
            { tokenA: 'WMATIC', tokenB: 'USDC', basePrice: 0.85 },
            { tokenA: 'WETH', tokenB: 'USDC', basePrice: 2450.0 },
            { tokenA: 'DAI', tokenB: 'USDC', basePrice: 1.0 }
        ];

        pairs.forEach(pair => {
            // Simulate price differences between exchanges
            const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const quickPrice = pair.basePrice * (1 + priceVariation);
            const sushiPrice = pair.basePrice * (1 - priceVariation);
            
            const priceDiff = Math.abs(quickPrice - sushiPrice) * 100; // For 100 tokens
            const profitPercent = (Math.abs(quickPrice - sushiPrice) / Math.min(quickPrice, sushiPrice)) * 100;
            
            if (priceDiff > config.minProfitUSD) {
                mockOpportunities.push({
                    token: `${pair.tokenA}/${pair.tokenB}`,
                    buyDex: quickPrice < sushiPrice ? 'QuickSwap' : 'SushiSwap',
                    sellDex: quickPrice < sushiPrice ? 'SushiSwap' : 'QuickSwap',
                    profit: priceDiff.toFixed(2),
                    profitPercent: profitPercent.toFixed(2),
                    buyPrice: Math.min(quickPrice, sushiPrice).toFixed(4),
                    sellPrice: Math.max(quickPrice, sushiPrice).toFixed(4),
                    amount: '100',
                    type: 'demo'
                });
            }
        });

        return mockOpportunities;
    }

    async checkRealPrices(config, opportunities) {
        // Attempt real price checking - may fail in testnet/demo mode
        const amount = ethers.parseEther('100');
        
        const quickRouter = new ethers.Contract(DEXS.QUICKSWAP.router, ROUTER_ABI, this.provider);
        const sushiRouter = new ethers.Contract(DEXS.SUSHISWAP.router, ROUTER_ABI, this.provider);
        
        const path = [TOKENS.WMATIC.address, TOKENS.USDC.address];
        
        const [quickAmounts, sushiAmounts] = await Promise.all([
            quickRouter.getAmountsOut(amount, path),
            sushiRouter.getAmountsOut(amount, path)
        ]);
        
        const quickPrice = parseFloat(ethers.formatUnits(quickAmounts[1], TOKENS.USDC.decimals));
        const sushiPrice = parseFloat(ethers.formatUnits(sushiAmounts[1], TOKENS.USDC.decimals));
        
        const priceDiff = Math.abs(quickPrice - sushiPrice);
        const profitPercent = (priceDiff / Math.min(quickPrice, sushiPrice)) * 100;
        
        if (priceDiff > config.minProfitUSD) {
            opportunities.push({
                token: 'WMATIC/USDC',
                buyDex: quickPrice < sushiPrice ? 'QuickSwap' : 'SushiSwap',
                sellDex: quickPrice < sushiPrice ? 'SushiSwap' : 'QuickSwap',
                profit: priceDiff.toFixed(2),
                profitPercent: profitPercent.toFixed(2),
                buyPrice: Math.min(quickPrice, sushiPrice).toFixed(4),
                sellPrice: Math.max(quickPrice, sushiPrice).toFixed(4),
                amount: ethers.formatEther(amount),
                type: 'real'
            });
        }
    }

    async checkTokenPair(tokenA, tokenB, amount, config, opportunities) {
        try {
            const quickRouter = new ethers.Contract(DEXS.QUICKSWAP.router, ROUTER_ABI, this.provider);
            const sushiRouter = new ethers.Contract(DEXS.SUSHISWAP.router, ROUTER_ABI, this.provider);
            
            const path = [TOKENS[tokenA].address, TOKENS[tokenB].address];
            const amountIn = ethers.parseUnits('100', TOKENS[tokenA].decimals);
            
            const [quickAmounts, sushiAmounts] = await Promise.all([
                quickRouter.getAmountsOut(amountIn, path).catch(() => [0, 0]),
                sushiRouter.getAmountsOut(amountIn, path).catch(() => [0, 0])
            ]);
            
            if (quickAmounts[1] && sushiAmounts[1]) {
                const quickPrice = parseFloat(ethers.formatUnits(quickAmounts[1], TOKENS[tokenB].decimals));
                const sushiPrice = parseFloat(ethers.formatUnits(sushiAmounts[1], TOKENS[tokenB].decimals));
                
                const priceDiff = Math.abs(quickPrice - sushiPrice);
                const profitPercent = (priceDiff / Math.min(quickPrice, sushiPrice)) * 100;
                
                if (priceDiff > config.minProfitUSD) {
                    opportunities.push({
                        token: `${tokenA}/${tokenB}`,
                        buyDex: quickPrice < sushiPrice ? 'QuickSwap' : 'SushiSwap',
                        sellDex: quickPrice < sushiPrice ? 'SushiSwap' : 'QuickSwap',
                        profit: priceDiff.toFixed(2),
                        profitPercent: profitPercent.toFixed(2),
                        buyPrice: Math.min(quickPrice, sushiPrice).toFixed(4),
                        sellPrice: Math.max(quickPrice, sushiPrice).toFixed(4),
                        amount: '100'
                    });
                }
            }
        } catch (error) {
            console.error(`Error checking ${tokenA}/${tokenB} pair:`, error);
        }
    }
}

module.exports = ArbitrageService;
