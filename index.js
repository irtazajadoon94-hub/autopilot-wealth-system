#!/usr/bin/env node

// 🤖 AUTOPILOT WEALTH SYSTEM - Main Controller
// Runs all money-making bots together

require('dotenv').config();
const tradingBot = require('./trading-bot');
const contentFactory = require('./content-factory');
const arbitrageBot = require('./arbitrage-bot');

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🤖 AUTOPILOT WEALTH SYSTEM 🤖                      ║
║                                                           ║
║        Automatic Money-Making Machine                     ║
║        Built by: Bhindi AI + Irtaza Jadoon              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Starting all systems...
`);

// System State
let systemStats = {
    startTime: Date.now(),
    totalEarnings: 0,
    activeBots: 0
};

// Update Total Earnings
function updateEarnings() {
    const trading = tradingBot.getPortfolio();
    const content = contentFactory.getStats();
    const arbitrage = arbitrageBot.getStats();

    systemStats.totalEarnings = 
        (trading.totalProfit || 0) + 
        (content.revenue || 0) + 
        (arbitrage.totalProfit || 0);

    return systemStats.totalEarnings;
}

// Display Dashboard
function displayDashboard() {
    const trading = tradingBot.getPortfolio();
    const content = contentFactory.getStats();
    const arbitrage = arbitrageBot.getStats();
    const totalEarnings = updateEarnings();
    const runtime = Math.floor((Date.now() - systemStats.startTime) / 1000 / 60); // minutes

    console.log(`\n
╔═══════════════════════════════════════════════════════════╗
║                    💰 LIVE DASHBOARD 💰                   ║
╚═══════════════════════════════════════════════════════════╝

⏱️  Runtime: ${runtime} minutes
💵 Total Earnings: $${totalEarnings.toFixed(2)}

📊 TRADING BOT:
   Balance: $${trading.balance?.toFixed(2) || '0.00'}
   Profit: $${trading.totalProfit?.toFixed(2) || '0.00'}
   Win Rate: ${trading.winRate?.toFixed(1) || '0'}%
   Open Positions: ${trading.positions?.length || 0}

📱 CONTENT FACTORY:
   Posts Published: ${content.postsPublished || 0}
   Total Views: ${content.totalViews?.toLocaleString() || 0}
   Revenue: $${content.revenue?.toFixed(2) || '0.00'}

💎 ARBITRAGE BOT:
   Opportunities: ${arbitrage.opportunitiesFound || 0}
   Trades: ${arbitrage.tradesExecuted || 0}
   Profit: $${arbitrage.totalProfit?.toFixed(2) || '0.00'}

═══════════════════════════════════════════════════════════
`);
}

// Start All Systems
async function startSystem() {
    try {
        // Start Trading Bot
        console.log('🤖 Starting Trading Bot...');
        tradingBot.startBot();
        systemStats.activeBots++;

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Start Content Factory
        console.log('📱 Starting Content Factory...');
        contentFactory.startFactory(tradingBot.getPortfolio());
        systemStats.activeBots++;

        // Wait 5 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Start Arbitrage Bot
        console.log('💎 Starting Arbitrage Bot...');
        arbitrageBot.startBot();
        systemStats.activeBots++;

        console.log(`\n✅ All ${systemStats.activeBots} bots are running!\n`);

        // Display dashboard every 5 minutes
        setInterval(displayDashboard, 5 * 60 * 1000);

        // Display initial dashboard after 1 minute
        setTimeout(displayDashboard, 60 * 1000);

    } catch (error) {
        console.error('❌ System Error:', error.message);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down Autopilot Wealth System...');
    displayDashboard();
    console.log('\n💰 Final Earnings: $' + updateEarnings().toFixed(2));
    console.log('\n👋 See you next time!\n');
    process.exit(0);
});

// Start the system
startSystem();

module.exports = { systemStats, updateEarnings };