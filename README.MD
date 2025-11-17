# TVWS - TradingView WebSocket Library

🚀 **Browser-compatible TradingView WebSocket API** with extensible event system for real-time market data.

[![npm version](https://badge.fury.io/js/tvws.svg)](https://badge.fury.io/js/tvws)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🌐 **Browser & CDN Ready** - Works seamlessly in browsers and available via CDN
- 🔄 **Multiple Endpoints** - Access different TradingView data sources
- 📊 **Comprehensive Market Data** - Forex, crypto, stocks, commodities, and more
- 🎯 **High Performance** - Optimized WebSocket connections with efficient data handling
- 🛡️ **Full TypeScript Support** - Complete type definitions included
- 🔐 **Optional Authentication** - Access premium data with TradingView session
- 📈 **Multiple Timeframes** - Support for all TradingView chart intervals
- ⚡ **Extensible Event System** - Composable handlers for studies, replay, quotes, and more
- 🧩 **Modular Architecture** - Clean handler registry for adding new TradingView features
- 📦 **Zero Dependencies** - Pure WebSocket API, no external runtime dependencies

## 📦 Installation

### NPM
```bash
npm install tvws
```

### Yarn
```bash
yarn add tvws
```

### Bun
```bash
bun add tvws
```

## 🚀 Quick Start

### ES Modules (Recommended)
```javascript
import { connect, getCandles } from 'tvws';

// Connect to TradingView
const connection = await connect({
  endpoint: 'data' // 'data' | 'prodata' | 'widgetdata' | 'charts-polygon'
});

// Fetch candlestick data
const candles = await getCandles({
  connection,
  symbols: ['FX:EURUSD', 'BINANCE:BTCUSDT.P'],
  amount: 100,
  timeframe: '1D'
});

console.log('Fetched candles:', candles);
await connection.close();
```

### CommonJS
```javascript
const { connect, getCandles } = require('tvws');

async function fetchData() {
  const connection = await connect();
  const candles = await getCandles({
    connection,
    symbols: ['FX:EURUSD'],
    amount: 100,
    timeframe: '1D'
  });
  console.log(candles);
  await connection.close();
}
```

## 🌐 CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';
    
    async function example() {
      const connection = await connect();
      const candles = await getCandles({
        connection,
        symbols: ['FX:EURUSD'],
        amount: 50,
        timeframe: '1h'
      });
      console.log('Candle data:', candles);
    }
    
    example();
  </script>
</head>
</html>
```

## 📊 API Reference

### `connect(options?)`
Create a WebSocket connection to TradingView.

**Parameters:**
```typescript
interface ConnectOptions {
  sessionId?: string;    // Optional TradingView session ID for premium data
  endpoint?: string;     // WebSocket endpoint (default: 'data')
  debug?: boolean;       // Enable debug logging (default: false)
}
```

**Available Endpoints:**
- `"data"` - Standard data endpoint (recommended)
- `"prodata"` - Premium data endpoint (requires authentication)
- `"widgetdata"` - Widget data endpoint
- `"charts-polygon"` - Polygon.io charts data

**Returns:** `Promise<TradingviewConnection>`

### `getCandles(params)`
Fetch historical candlestick data.

**Parameters:**
```typescript
interface GetCandlesParams {
  connection: TradingviewConnection;  // Active connection from connect()
  symbols: string[];                 // Array of trading symbols
  amount?: number;                   // Number of candles (default: maximum available)
  timeframe?: string | number;       // Chart timeframe (default: "1D")
}
```

**Returns:** `Promise<CandleData[][]>`

### `connection.close()`
Close the WebSocket connection.

### Event System
```javascript
const connection = await connect();

// Subscribe to events
const unsubscribe = connection.subscribe((event) => {
  console.log('Event:', event.name, event.params);
});

// Clean up
unsubscribe();
await connection.close();
```

## 📈 Supported Symbols

### Forex Pairs
```javascript
// Major pairs
'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY', 'FX:USDCHF'

// Cross pairs  
'FX:EURGBP', 'FX:EURJPY', 'FX:GBPJPY', 'FX:EURCHF'

// Exotics
'FX:USDTRY', 'FX:USDZAR', 'FX:USDMXN'
```

### Cryptocurrencies
```javascript
// Bitcoin
'CRYPTO:BTCUSD', 'CRYPTO:BTCUSDT', 'BINANCE:BTCUSDT.P'

// Ethereum
'CRYPTO:ETHUSD', 'CRYPTO:ETHUSDT', 'BINANCE:ETHUSDT.P'

// Altcoins
'CRYPTO:ADAUSD', 'BINANCE:ADAUSDT.P', 'BINANCE:SOLUSDT.P'
```

### Stocks
```javascript
// US Stocks
'NASDAQ:AAPL', 'NASDAQ:GOOGL', 'NASDAQ:MSFT'
'NYSE:TSLA', 'NYSE:BRK.A', 'NYSE:JPM'

// Indices
'AMEX:SPY', 'NASDAQ:QQQ', 'NYSEARCA:DIA'
```

### Commodities
```javascript
// Gold & Silver
'FOREXCOM:XAUUSD',  // Gold
'FOREXCOM:XAGUSD',  // Silver

// Oil
'NYMEX:CL1!',       // Crude Oil
'NYMEX:NG1!',       // Natural Gas
```

## ⏰ Supported Timeframes

### Intraday
```javascript
'1',   // 1 minute
'3',   // 3 minutes
'5',   // 5 minutes
'15',  // 15 minutes
'30',  // 30 minutes
'45',  // 45 minutes
'60',  // 1 hour
'120', // 2 hours
'180', // 3 hours
'240', // 4 hours
```

### Daily & Above
```javascript
'1D',   // Daily
'1W',   // Weekly
'1M',   // Monthly
```

## 📋 Response Data Structure

```typescript
interface CandleData {
  timestamp: number;    // Unix timestamp (seconds)
  open: number;         // Open price
  high: number;         // High price
  low: number;          // Low price
  close: number;        // Close price
  volume: number;       // Trading volume
}
```

**Example Response:**
```javascript
[
  {
    timestamp: 1640995200,
    open: 1.13500,
    high: 1.13750,
    low: 1.13400,
    close: 1.13650,
    volume: 1250
  },
  {
    timestamp: 1641081600,
    open: 1.13650,
    high: 1.13800,
    low: 1.13500,
    close: 1.13750,
    volume: 1380
  }
]
```

## 🚀 Advanced Features

### Studies
```javascript
import { createStudy, modifyStudy, removeStudy } from 'tvws';

const connection = await connect();

// Create a custom study
const studyData = await createStudy(connection, {
  symbol: 'BINANCE:BTCUSDT.P',
  studyId: 'my_rsi_study',
  script: `
    study("RSI Study")
    rsi = rsi(close, 14)
    plot(rsi)
  `,
  inputs: {
    length: 14,
    source: 'close'
  }
});
```

### Replay
```javascript
import { createReplay, ReplayController } from 'tvws';

const connection = await connect();
const replayState = await createReplay(connection, {
  symbols: ['BINANCE:BTCUSDT.P'],
  timeframe: '1h',
  speed: 1
});

const controller = new ReplayController(connection, replayState.sessionId);
controller.start(2); // Start at 2x speed
```

### Real-time Quotes
```javascript
import { getQuotes } from 'tvws';

const connection = await connect();
const quotes = await getQuotes(connection, {
  symbols: ['AAPL', 'GOOGL', 'MSFT'],
  fields: ['price', 'volume', 'change', 'change_percent']
});

console.log(quotes.get('AAPL')); // { price: 150.25, volume: 1000000, ... }
```

## 📚 Live Demo & Examples

For comprehensive examples and live demos, visit our **demo repository**:

🔗 **[tvws-demo](https://github.com/badsector666/tvws-demo)**

### Quick Start with Demo
```bash
git clone https://github.com/badsector666/tvws-demo.git
cd tvws-demo
npm install && npm run dev
```

Visit http://localhost:5173 for the live demo!

## 🔐 Authentication Guide

To access premium data, provide your TradingView session ID:

```javascript
const connection = await connect({
  endpoint: 'prodata',
  sessionId: 'your_tradingview_session_id_here'
});
```

### Getting Session ID
1. Open https://www.tradingview.com/chart/
2. Open Developer Tools (F12)
3. Go to **Application** → **Storage** → **Cookies** → **https://www.tradingview.com**
4. Find the `sessionid` cookie and copy its value

## 📝 TypeScript Support

Full TypeScript support is included with comprehensive type definitions:

```typescript
import { TradingviewConnection, CandleData, ConnectOptions } from 'tvws';

const connection: TradingviewConnection = await connect({
  endpoint: 'data',
  sessionId: undefined
});

const candles: CandleData[][] = await getCandles({
  connection,
  symbols: ['FX:EURUSD'],
  amount: 100,
  timeframe: '1D'
});
```

## 🌍 CDN & unpkg

The library is available via CDN for immediate use:

```html
<!-- Latest version -->
<script type="module" src="https://unpkg.com/tvws@latest/dist/index.js"></script>

<!-- Specific version -->
<script type="module" src="https://unpkg.com/tvws@0.0.11/dist/index.js"></script>
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/badsector666/tvws/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/badsector666/tvws/discussions)
- 📧 **Email**: badsectorkiller666@gmail.com

---

**⭐ Star this repository if it helped you!**

Made with ❤️ by [badsector666](https://github.com/badsector666)