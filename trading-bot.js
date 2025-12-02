// 🤖 AUTOPILOT WEALTH SYSTEM - AI Trading Bot
// Automatically trades crypto using AI price predictions

const axios = require('axios');

// Configuration
const CONFIG = {
    mode: process.env.MODE || 'demo', // 'demo' or 'live'
    riskPerTrade: 0.02, // Risk 2% per trade
    minProfitTarget: 0.015, // 1.5% minimum profit
    stopLoss: 0.01, // 1% stop loss
    tradingPairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    checkInterval: 60000, // Check every 60 seconds
};

// Trading State
let portfolio = {
    balance: 1000, // Start with $1000 in demo mode
    positions: [],
    totalProfit: 0,
    trades: [],
    winRate: 0
};

// AI Price Prediction (Simplified - will enhance with ML)
async function predictPrice(symbol) {
    try {
        // Fetch historical data
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${symbol}/market_chart`, {
            params: {
                vs_currency: 'usd',
                days: 7,
                interval: 'hourly'
            }
        });

        const prices = response.data.prices.map(p => p[1]);
        
        // Simple moving average prediction
        const sma20 = calculateSMA(prices, 20);
        const sma50 = calculateSMA(prices, 50);
        const currentPrice = prices[prices.length - 1];
        
        // Calculate momentum
        const momentum = (currentPrice - prices[prices.length - 24]) / prices[prices.length - 24];
        
        // Predict direction
        let prediction = {
            symbol,
            currentPrice,
            predictedChange: 0,
            confidence: 0,
            signal: 'HOLD'
        };

        // Bullish signals
        if (sma20 > sma50 && momentum > 0.02) {
            prediction.predictedChange = 0.03; // Predict 3% up
            prediction.confidence = 0.7;
            prediction.signal = 'BUY';
        }
        // Bearish signals
        else if (sma20 < sma50 && momentum < -0.02) {
            prediction.predictedChange = -0.03; // Predict 3% down
            prediction.confidence = 0.7;
            prediction.signal = 'SELL';
        }

        return prediction;

    } catch (error) {
        console.error('Price prediction error:', error.message);
        return null;
    }
}

// Calculate Simple Moving Average
function calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

// Execute Trade
async function executeTrade(prediction) {
    if (prediction.signal === 'HOLD') return;

    const tradeAmount = portfolio.balance * CONFIG.riskPerTrade;
    
    if (prediction.signal === 'BUY' && prediction.confidence > 0.6) {
        // Open long position
        const position = {
            symbol: prediction.symbol,
            type: 'LONG',
            entryPrice: prediction.currentPrice,
            amount: tradeAmount,
            targetPrice: prediction.currentPrice * (1 + CONFIG.minProfitTarget),
            stopLoss: prediction.currentPrice * (1 - CONFIG.stopLoss),
            timestamp: Date.now()
        };

        portfolio.positions.push(position);
        portfolio.balance -= tradeAmount;

        console.log(`🟢 OPENED LONG: ${prediction.symbol} at $${prediction.currentPrice}`);
        console.log(`   Target: $${position.targetPrice.toFixed(2)} | Stop: $${position.stopLoss.toFixed(2)}`);
        
        return position;
    }
}

// Check Open Positions
async function checkPositions() {
    for (let i = portfolio.positions.length - 1; i >= 0; i--) {
        const position = portfolio.positions[i];
        
        // Get current price
        const prediction = await predictPrice(position.symbol);
        if (!prediction) continue;

        const currentPrice = prediction.currentPrice;
        const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

        // Check if target hit
        if (currentPrice >= position.targetPrice) {
            closePosition(position, currentPrice, 'TARGET_HIT');
        }
        // Check if stop loss hit
        else if (currentPrice <= position.stopLoss) {
            closePosition(position, currentPrice, 'STOP_LOSS');
        }
        // Check if position is old (close after 24 hours)
        else if (Date.now() - position.timestamp > 24 * 60 * 60 * 1000) {
            closePosition(position, currentPrice, 'TIME_EXIT');
        }
    }
}

// Close Position
function closePosition(position, exitPrice, reason) {
    const profit = (exitPrice - position.entryPrice) * (position.amount / position.entryPrice);
    const profitPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

    portfolio.balance += position.amount + profit;
    portfolio.totalProfit += profit;
    
    portfolio.trades.push({
        ...position,
        exitPrice,
        profit,
        profitPercent,
        reason,
        closedAt: Date.now()
    });

    // Remove from positions
    const index = portfolio.positions.indexOf(position);
    portfolio.positions.splice(index, 1);

    // Update win rate
    const wins = portfolio.trades.filter(t => t.profit > 0).length;
    portfolio.winRate = (wins / portfolio.trades.length) * 100;

    console.log(`${profit > 0 ? '✅' : '❌'} CLOSED: ${position.symbol} | Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%) | Reason: ${reason}`);
    console.log(`   Portfolio: $${portfolio.balance.toFixed(2)} | Total Profit: $${portfolio.totalProfit.toFixed(2)} | Win Rate: ${portfolio.winRate.toFixed(1)}%`);
}

// Main Trading Loop
async function tradingLoop() {
    console.log('\n🤖 AI Trading Bot Running...');
    console.log(`Mode: ${CONFIG.mode.toUpperCase()} | Balance: $${portfolio.balance.toFixed(2)}\n`);

    // Check existing positions
    await checkPositions();

    // Look for new opportunities
    for (const pair of CONFIG.tradingPairs) {
        const symbol = pair.split('/')[0].toLowerCase();
        const prediction = await predictPrice(symbol);
        
        if (prediction) {
            console.log(`📊 ${pair}: $${prediction.currentPrice.toFixed(2)} | Signal: ${prediction.signal} | Confidence: ${(prediction.confidence * 100).toFixed(0)}%`);
            
            // Execute trade if signal is strong
            if (prediction.confidence > 0.6 && portfolio.positions.length < 3) {
                await executeTrade(prediction);
            }
        }

        // Wait between API calls
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n💰 Current Portfolio: $${portfolio.balance.toFixed(2)} | Open Positions: ${portfolio.positions.length}`);
}

// Start Bot
async function startBot() {
    console.log('🚀 Starting Autopilot Wealth System - Trading Bot\n');
    
    // Run immediately
    await tradingLoop();
    
    // Then run every interval
    setInterval(tradingLoop, CONFIG.checkInterval);
}

// Export for use in main system
module.exports = {
    startBot,
    getPortfolio: () => portfolio,
    CONFIG
};

// Run if executed directly
if (require.main === module) {
    startBot();
}