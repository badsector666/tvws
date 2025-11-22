// Real-time Trading Dashboard Simulation
// Demonstrates practical usage of TVWS for a trading application
// Run with: node examples/trading-dashboard.cjs

const { createClient, EventEmitter } = require('../dist/tvws.cjs');

console.log('📊 TVWS Trading Dashboard Simulation');
console.log('===================================');

class TradingDashboard extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map();
    this.portfolios = new Map();
    this.alerts = [];
    this.marketData = new Map();
    this.activeTrades = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Market data handlers
    this.on('market:price', this.handlePriceUpdate.bind(this));
    this.on('market:volume', this.handleVolumeUpdate.bind(this));
    this.on('market:trend', this.handleTrendAnalysis.bind(this));

    // Portfolio handlers
    this.on('portfolio:update', this.handlePortfolioUpdate.bind(this));
    this.on('trade:executed', this.handleTradeExecution.bind(this));
    this.on('position:opened', this.handlePositionOpened.bind(this));
    this.on('position:closed', this.handlePositionClosed.bind(this));

    // Alert handlers
    this.on('alert:price', this.handlePriceAlert.bind(this));
    this.on('alert:volume', this.handleVolumeAlert.bind(this));
    this.on('alert:trend', this.handleTrendAlert.bind(this));
  }

  // Market Data Management
  setupMarketData(symbols) {
    console.log(`📈 Setting up market data for ${symbols.length} symbols`);

    const client = createClient();
    const chart = client.createChart();
    const quote = client.createQuote();

    symbols.forEach(symbol => {
      quote.addSymbol(symbol);
      this.marketData.set(symbol, {
        symbol,
        price: null,
        volume: null,
        change: null,
        trend: null,
        lastUpdate: null
      });
    });

    // Set up real-time data simulation
    this.simulateMarketData(quote, symbols);

    this.clients.set('market', { client, chart, quote });
    return { client, chart, quote };
  }

  simulateMarketData(quote, symbols) {
    console.log('🔄 Starting market data simulation...');

    setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = this.getBasePrice(symbol);
        const variation = (Math.random() - 0.5) * basePrice * 0.02; // ±2% variation
        const price = basePrice + variation;
        const volume = Math.floor(Math.random() * 1000000) + 100000;
        const change = ((price - basePrice) / basePrice) * 100;

        const marketData = this.marketData.get(symbol);
        if (marketData) {
          marketData.price = price;
          marketData.volume = volume;
          marketData.change = change;
          marketData.lastUpdate = new Date();

          // Emit market events
          this.emit('market:price', { symbol, price, change });
          this.emit('market:volume', { symbol, volume });

          // Analyze trends
          if (Math.random() > 0.7) {
            const trend = change > 1 ? 'bullish' : change < -1 ? 'bearish' : 'neutral';
            marketData.trend = trend;
            this.emit('market:trend', { symbol, trend, change });
          }
        }
      });
    }, 2000); // Update every 2 seconds
  }

  getBasePrice(symbol) {
    const basePrices = {
      'BTCUSD': 50000,
      'ETHUSD': 3000,
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 150.50,
      'AAPL': 180.00,
      'GOOGL': 140.00,
      'MSFT': 380.00
    };
    return basePrices[symbol] || 100;
  }

  // Portfolio Management
  createPortfolio(name, initialBalance = 10000) {
    const portfolio = {
      name,
      balance: initialBalance,
      positions: new Map(),
      trades: [],
      value: initialBalance,
      lastUpdate: new Date()
    };

    this.portfolios.set(name, portfolio);
    console.log(`💼 Created portfolio: ${name} with $${initialBalance}`);
    this.emit('portfolio:created', portfolio);
    return portfolio;
  }

  executeTrade(portfolioName, symbol, type, amount) {
    const portfolio = this.portfolios.get(portfolioName);
    if (!portfolio) {
      console.error(`❌ Portfolio not found: ${portfolioName}`);
      return false;
    }

    const marketData = this.marketData.get(symbol);
    if (!marketData || !marketData.price) {
      console.error(`❌ No market data for symbol: ${symbol}`);
      return false;
    }

    const price = marketData.price;
    const value = amount * price;

    if (type === 'buy' && portfolio.balance < value) {
      console.error(`❌ Insufficient balance in portfolio: ${portfolioName}`);
      return false;
    }

    // Execute trade
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      portfolio: portfolioName,
      symbol,
      type,
      amount,
      price,
      value,
      timestamp: new Date(),
      status: 'executed'
    };

    // Update portfolio
    if (type === 'buy') {
      portfolio.balance -= value;
      const currentAmount = portfolio.positions.get(symbol) || 0;
      portfolio.positions.set(symbol, currentAmount + amount);
    } else {
      const currentAmount = portfolio.positions.get(symbol) || 0;
      if (currentAmount < amount) {
        console.error(`❌ Insufficient position for ${symbol}`);
        return false;
      }
      portfolio.balance += value;
      portfolio.positions.set(symbol, currentAmount - amount);

      // Remove position if empty
      if (portfolio.positions.get(symbol) === 0) {
        portfolio.positions.delete(symbol);
      }
    }

    portfolio.trades.push(trade);
    portfolio.lastUpdate = new Date();

    // Calculate portfolio value
    this.calculatePortfolioValue(portfolio);

    // Emit events
    this.emit('trade:executed', trade);
    this.emit('portfolio:update', portfolio);

    if (type === 'buy') {
      this.emit('position:opened', {
        symbol,
        amount,
        price,
        portfolio: portfolioName
      });
    } else {
      this.emit('position:closed', {
        symbol,
        amount,
        price,
        portfolio: portfolioName
      });
    }

    console.log(`✅ Trade executed: ${portfolioName} ${type} ${amount} ${symbol} @ $${price}`);
    return trade;
  }

  calculatePortfolioValue(portfolio) {
    let totalValue = portfolio.balance;

    portfolio.positions.forEach((amount, symbol) => {
      const marketData = this.marketData.get(symbol);
      if (marketData && marketData.price) {
        totalValue += amount * marketData.price;
      }
    });

    portfolio.value = totalValue;
    return totalValue;
  }

  // Alert System
  createPriceAlert(portfolioName, symbol, condition, threshold) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'price',
      portfolio: portfolioName,
      symbol,
      condition, // 'above', 'below', 'change_above', 'change_below'
      threshold,
      active: true,
      created: new Date()
    };

    this.alerts.push(alert);
    console.log(`🚨 Created price alert: ${symbol} ${condition} ${threshold}`);
    return alert;
  }

  // Event Handlers
  handlePriceUpdate(data) {
    // Check price alerts
    this.alerts.forEach(alert => {
      if (alert.type === 'price' && alert.active && alert.symbol === data.symbol) {
        const triggered = this.checkPriceAlert(alert, data);
        if (triggered) {
          alert.active = false;
          alert.triggered = new Date();
          this.emit('alert:price', { alert, marketData: data });
        }
      }
    });

    // Update active trades
    this.activeTrades.forEach((trade, tradeId) => {
      if (trade.symbol === data.symbol && trade.status === 'active') {
        const pnl = this.calculatePnL(trade, data.price);
        trade.currentPnL = pnl;
        trade.currentPrice = data.price;

        if (trade.takeProfit && pnl >= trade.takeProfit) {
          this.closeTrade(tradeId, 'take_profit');
        } else if (trade.stopLoss && pnl <= trade.stopLoss) {
          this.closeTrade(tradeId, 'stop_loss');
        }
      }
    });
  }

  handleVolumeUpdate(data) {
    // Check volume alerts
    this.alerts.forEach(alert => {
      if (alert.type === 'volume' && alert.active && alert.symbol === data.symbol) {
        if (data.volume > alert.threshold) {
          alert.active = false;
          alert.triggered = new Date();
          this.emit('alert:volume', { alert, marketData: data });
        }
      }
    });
  }

  handleTrendAnalysis(data) {
    // Trend-based trading signals
    if (data.trend === 'bullish' && Math.random() > 0.8) {
      this.emit('trading:signal', {
        type: 'buy',
        symbol: data.symbol,
        reason: 'bullish_trend',
        confidence: 0.75
      });
    } else if (data.trend === 'bearish' && Math.random() > 0.8) {
      this.emit('trading:signal', {
        type: 'sell',
        symbol: data.symbol,
        reason: 'bearish_trend',
        confidence: 0.75
      });
    }
  }

  handlePortfolioUpdate(portfolio) {
    // Portfolio performance alerts
    const initialBalance = 10000; // Default for demo
    const returnPercent = ((portfolio.value - initialBalance) / initialBalance) * 100;

    if (Math.abs(returnPercent) > 5) {
      this.emit('alert:performance', {
        portfolio: portfolio.name,
        value: portfolio.value,
        returnPercent,
        status: returnPercent > 0 ? 'profit' : 'loss'
      });
    }
  }

  handleTradeExecution(trade) {
    console.log(`📊 Trade executed: ${trade.type.toUpperCase()} ${trade.amount} ${trade.symbol} @ $${trade.price}`);
  }

  handlePositionOpened(position) {
    console.log(`📈 Position opened: ${position.symbol} (${position.amount}) in ${position.portfolio}`);
  }

  handlePositionClosed(position) {
    console.log(`📉 Position closed: ${position.symbol} in ${position.portfolio}`);
  }

  handlePriceAlert(alertData) {
    console.log(`🚨 PRICE ALERT: ${alertData.alert.symbol} ${alertData.alert.condition} ${alertData.alert.threshold} (Current: $${alertData.marketData.price})`);
  }

  handleVolumeAlert(alertData) {
    console.log(`🚨 VOLUME ALERT: ${alertData.alert.symbol} volume ${alertData.marketData.volume.toLocaleString()} (Threshold: ${alertData.alert.threshold.toLocaleString()})`);
  }

  handleTrendAlert(alertData) {
    console.log(`🚨 TREND ALERT: ${alertData.alert.symbol} trend changed to ${alertData.alert.trend}`);
  }

  // Utility Methods
  calculatePnL(trade, currentPrice) {
    const priceDiff = currentPrice - trade.entryPrice;
    return (priceDiff / trade.entryPrice) * 100; // Return percentage
  }

  createActiveTrade(portfolioName, symbol, type, amount, takeProfit = null, stopLoss = null) {
    const marketData = this.marketData.get(symbol);
    if (!marketData || !marketData.price) return null;

    const trade = {
      id: `active_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      portfolio: portfolioName,
      symbol,
      type,
      amount,
      entryPrice: marketData.price,
      currentPrice: marketData.price,
      currentPnL: 0,
      takeProfit,
      stopLoss,
      status: 'active',
      created: new Date()
    };

    this.activeTrades.set(trade.id, trade);
    console.log(`🎯 Active trade created: ${trade.type} ${trade.amount} ${trade.symbol} @ $${trade.entryPrice}`);
    return trade;
  }

  closeTrade(tradeId, reason = 'manual') {
    const trade = this.activeTrades.get(tradeId);
    if (!trade) return null;

    const marketData = this.marketData.get(trade.symbol);
    if (!marketData || !marketData.price) return null;

    // Execute closing trade
    const closeType = trade.type === 'buy' ? 'sell' : 'buy';
    const closingTrade = this.executeTrade(trade.portfolio, trade.symbol, closeType, trade.amount);

    if (closingTrade) {
      trade.status = 'closed';
      trade.closeReason = reason;
      trade.closePrice = marketData.price;
      trade.finalPnL = this.calculatePnL(trade, marketData.price);
      trade.closed = new Date();

      this.activeTrades.delete(tradeId);

      console.log(`🏁 Trade closed: ${trade.symbol} (${reason}) - PnL: ${trade.finalPnL.toFixed(2)}%`);
      return trade;
    }

    return null;
  }

  // Dashboard Display
  displayDashboard() {
    console.log('\n📊 TRADING DASHBOARD');
    console.log('====================');

    // Market Data
    console.log('\n💰 MARKET DATA:');
    this.marketData.forEach((data, symbol) => {
      const change = data.change ? data.change.toFixed(2) : 'N/A';
      const trend = data.trend ? ` (${data.trend})` : '';
      console.log(`   ${symbol}: $${data.price?.toFixed(2) || 'N/A'} (${change}%)${trend}`);
    });

    // Portfolios
    console.log('\n💼 PORTFOLIOS:');
    this.portfolios.forEach((portfolio, name) => {
      const returnPercent = ((portfolio.value - 10000) / 10000) * 100;
      console.log(`   ${name}: $${portfolio.value.toFixed(2)} (${returnPercent.toFixed(2)}%)`);
      console.log(`     Balance: $${portfolio.balance.toFixed(2)}`);
      console.log(`     Positions: ${portfolio.positions.size}`);

      portfolio.positions.forEach((amount, symbol) => {
        const marketData = this.marketData.get(symbol);
        const value = marketData ? (amount * marketData.price).toFixed(2) : 'N/A';
        console.log(`       ${symbol}: ${amount} ($${value})`);
      });
    });

    // Active Trades
    console.log('\n🎯 ACTIVE TRADES:');
    if (this.activeTrades.size === 0) {
      console.log('   No active trades');
    } else {
      this.activeTrades.forEach((trade) => {
        console.log(`   ${trade.id}: ${trade.type} ${trade.amount} ${trade.symbol}`);
        console.log(`     Entry: $${trade.entryPrice.toFixed(2)}, Current: $${trade.currentPrice?.toFixed(2) || 'N/A'}`);
        console.log(`     PnL: ${trade.currentPnL?.toFixed(2) || 'N/A'}%`);
        if (trade.takeProfit) console.log(`     Take Profit: ${trade.takeProfit}%`);
        if (trade.stopLoss) console.log(`     Stop Loss: ${trade.stopLoss}%`);
      });
    }

    // Recent Alerts
    console.log('\n🚨 RECENT ALERTS:');
    const recentAlerts = this.alerts.filter(alert =>
      alert.triggered && (Date.now() - alert.triggered.getTime()) < 60000
    );

    if (recentAlerts.length === 0) {
      console.log('   No recent alerts');
    } else {
      recentAlerts.slice(0, 5).forEach(alert => {
        console.log(`   ${alert.symbol}: ${alert.condition} ${alert.threshold} (${alert.triggered?.toLocaleTimeString()})`);
      });
    }

    console.log('\n' + '='.repeat(50));
  }
}

// ============================================================================
// MAIN DEMO EXECUTION
// ============================================================================

async function runTradingDashboard() {
  console.log('🚀 Starting Trading Dashboard Demo...\n');

  // Create dashboard
  const dashboard = new TradingDashboard();

  // Set up market data for various symbols
  const symbols = ['BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'AAPL', 'GOOGL'];
  dashboard.setupMarketData(symbols);

  // Create portfolios
  const cryptoPortfolio = dashboard.createPortfolio('CryptoTrader', 20000);
  const forexPortfolio = dashboard.createPortfolio('ForexTrader', 15000);
  const stockPortfolio = dashboard.createPortfolio('StockTrader', 25000);

  // Set up price alerts
  dashboard.createPriceAlert('CryptoTrader', 'BTCUSD', 'above', 52000);
  dashboard.createPriceAlert('CryptoTrader', 'ETHUSD', 'below', 2800);
  dashboard.createPriceAlert('StockTrader', 'AAPL', 'change_above', 3);

  // Execute some sample trades
  setTimeout(() => {
    console.log('\n🎯 Executing sample trades...');
    dashboard.executeTrade('CryptoTrader', 'BTCUSD', 'buy', 0.2);
    dashboard.executeTrade('CryptoTrader', 'ETHUSD', 'buy', 1.5);
    dashboard.executeTrade('ForexTrader', 'EURUSD', 'buy', 10000);
    dashboard.executeTrade('StockTrader', 'AAPL', 'buy', 50);
  }, 5000);

  // Create active trades with targets
  setTimeout(() => {
    console.log('\n🎯 Creating active trades with profit/loss targets...');
    dashboard.createActiveTrade('CryptoTrader', 'BTCUSD', 'buy', 0.1, 5, -3); // 5% profit, 3% loss
    dashboard.createActiveTrade('ForexTrader', 'EURUSD', 'buy', 5000, 2, -1.5);
  }, 10000);

  // Display dashboard periodically
  const dashboardInterval = setInterval(() => {
    dashboard.displayDashboard();
  }, 10000);

  // Stop after 2 minutes
  setTimeout(() => {
    clearInterval(dashboardInterval);

    // Close all active trades
    console.log('\n🏁 Closing all active trades...');
    const tradeIds = Array.from(dashboard.activeTrades.keys());
    tradeIds.forEach(tradeId => {
      dashboard.closeTrade(tradeId, 'demo_end');
    });

    // Final dashboard display
    dashboard.displayDashboard();

    console.log('\n🎉 Trading Dashboard Demo Complete!');
    console.log('====================================');
    console.log('✅ Market data streaming');
    console.log('✅ Portfolio management');
    console.log('✅ Trade execution');
    console.log('✅ Alert system');
    console.log('✅ Risk management');
    console.log('✅ Real-time monitoring');

    process.exit(0);
  }, 120000); // 2 minutes

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dashboard...');
    clearInterval(dashboardInterval);
    process.exit(0);
  });
}

// Event listeners for dashboard events
const dashboard = new TradingDashboard();

dashboard.on('trading:signal', (signal) => {
  console.log(`📈 Trading Signal: ${signal.type.toUpperCase()} ${signal.symbol} (${signal.reason}, confidence: ${signal.confidence})`);
});

dashboard.on('alert:performance', (alert) => {
  console.log(`📊 Performance Alert: ${alert.portfolio} ${alert.status} ${alert.returnPercent.toFixed(2)}%`);
});

// Start the demo
runTradingDashboard().catch(console.error);
