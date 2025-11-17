# TVWS - TradingView WebSocket Library

🚀 **Browser-compatible TradingView WebSocket API** with extensible event system for real-time market data and advanced TradingView features.

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

## 🔧 Development Setup

This project uses Bun for a minimal, fast development and build process.

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+) or [Node.js](https://nodejs.org/) (v16+)
- Git

### Clone & Install
```bash
git clone https://github.com/badsector666/tvws.git
cd tvws
bun install  # or npm install
```

### Build for Production
```bash
# Build all formats (ESM, UMD, CJS) and TypeScript definitions
bun run build

# Build individual formats
bun run build:umd     # UMD for browsers/CDN
bun run build:cjs     # CommonJS for Node.js
bun run build:types   # TypeScript definitions only
```

### Available Scripts
```bash
bun run build        # Build all formats and type definitions
bun run build:umd    # Build UMD format for browser/CDN use
bun run build:cjs    # Build CommonJS format for Node.js
bun run build:types  # Build TypeScript type definitions only
bun run typecheck    # TypeScript type checking
bun run clean        # Clean dist directory
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

**Returns:** `Promise<CandleData[]>`

### `connection.close()`
Close the WebSocket connection.

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
'1m',   // 1 minute
'3m',   // 3 minutes
'5m',   // 5 minutes
'15m',  // 15 minutes
'30m',  // 30 minutes
'45m',  // 45 minutes
'1h',   // 1 hour
'2h',   // 2 hours
'3h',   // 3 hours
'4h',   // 4 hours
```

### Daily & Above
```javascript
'1D',   // Daily
'1W',   // Weekly
'1M',   // Monthly
```

### Numeric Timeframes
```javascript
1,      // 1 minute
5,      // 5 minutes
15,     // 15 minutes
60,     // 1 hour
240,    // 4 hours
1440,   // 1 day
10080   // 1 week
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
Create and manage custom technical studies on TradingView charts.

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

// Modify an existing study
modifyStudy(connection, 'my_rsi_study', {
  inputs: { length: 21 }
});

// Remove a study
removeStudy(connection, 'my_rsi_study');
```

### Replay
Control historical data playback for backtesting and analysis.

```javascript
import { createReplay, ReplayController } from 'tvws';

const connection = await connect();

// Create a replay session
const replayState = await createReplay(connection, {
  symbols: ['BINANCE:BTCUSDT.P'],
  timeframe: '1h',
  startTime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
  endTime: Date.now(),
  speed: 1 // 1x speed
});

// Control replay playback
const controller = new ReplayController(connection, replayState.sessionId);
controller.start(2); // Start at 2x speed
controller.step(5);  // Move forward 5 bars
controller.pause();  // Pause playback
controller.reset();  // Reset to beginning
```

### Real-time Quotes
Get real-time quote data for multiple symbols with custom fields.

```javascript
import { getQuotes, addQuoteSymbols, setQuoteFields } from 'tvws';

const connection = await connect();

// Get real-time quotes
const quotes = await getQuotes(connection, {
  symbols: ['AAPL', 'GOOGL', 'MSFT'],
  fields: ['price', 'volume', 'change', 'change_percent', 'bid', 'ask']
});

console.log(quotes.get('AAPL')); // { price: 150.25, volume: 1000000, ... }

// Add more symbols to existing quote session
addQuoteSymbols(connection, quotes.sessionId, ['TSLA', 'AMZN']);

// Change quote fields
setQuoteFields(connection, quotes.sessionId, ['price', 'volume', 'market_cap']);
```

### Event-Driven Architecture
The library uses a composable event handler system for extensibility.

```javascript
import { connect } from 'tvws';

const connection = await connect();

// Subscribe to specific event types only
const unsubscribe = connection.subscribe(
  (event) => {
    console.log('Custom event handler:', event);
  },
  // Filter for specific events
  (event) => ['timescale_update', 'study_completed'].includes(event.name),
  // Priority (higher = called first)
  10
);

// Add multiple handlers with different priorities
connection.subscribe(console.log, null, 5);  // Lower priority
connection.subscribe(console.log, null, 15); // Higher priority

// Clean up when done
unsubscribe();
```

## 📚 Examples & Demos

For comprehensive examples and live demos, visit our **demo repository**:

🔗 **[tvws-demo](https://github.com/badsector666/tvws-demo)**

### Available Examples
- **Live Demo** - Interactive trading interface with real-time data
- **WebSocket Connection** - Connect to TradingView endpoints
- **Authentication** - Optional session-based authentication
- **Multiple Symbols** - Query multiple trading pairs simultaneously
- **All Timeframes** - Support for every TradingView timeframe
- **Performance Metrics** - Connection and data performance monitoring
- **Error Handling** - Comprehensive error management

### Quick Start with Demo
```bash
git clone https://github.com/badsector666/tvws-demo.git
cd tvws-demo
npm install && npm run dev
```

Visit http://localhost:5173 for the live demo!

## 🎯 Advanced Usage Examples

### Multiple Symbols & Timeframes
```javascript
import { connect, getCandles } from 'tvws';

const connection = await connect({ endpoint: 'data' });

// Fetch data for multiple symbols and timeframes
const results = await Promise.all([
  getCandles({
    connection,
    symbols: ['FX:EURUSD', 'FX:GBPUSD'],
    timeframe: '1h',
    amount: 100
  }),
  getCandles({
    connection,
    symbols: ['BINANCE:BTCUSDT.P'],
    timeframe: '15m',
    amount: 200
  }),
  getCandles({
    connection,
    symbols: ['NASDAQ:AAPL'],
    timeframe: '1D',
    amount: 30
  })
]);

console.log('EURUSD 1H:', results[0]);
console.log('BTC 15m:', results[1]);
console.log('AAPL Daily:', results[2]);

await connection.close();
```

### With Authentication (Premium Data)
```javascript
import { connect, getCandles } from 'tvws';

const connection = await connect({
  endpoint: 'prodata',
  sessionId: 'your_tradingview_session_id_here'
});

// Access premium data with authentication
const premiumData = await getCandles({
  connection,
  symbols: ['FOREXCOM:XAUUSD'], // Gold with premium data
  timeframe: '1m',
  amount: 1000
});

await connection.close();
```

### Error Handling
```javascript
import { connect, getCandles } from 'tvws';

async function fetchDataWithRetry() {
  try {
    const connection = await connect({
      endpoint: 'data',
      debug: true // Enable debug logging
    });
    
    const candles = await getCandles({
      connection,
      symbols: ['FX:EURUSD'],
      timeframe: '1h',
      amount: 100
    });
    
    console.log('Success:', candles);
    await connection.close();
    
  } catch (error) {
    console.error('Error fetching data:', error.message);
    
    // Retry with different endpoint
    try {
      const backupConnection = await connect({ endpoint: 'widgetdata' });
      const candles = await getCandles({
        connection: backupConnection,
        symbols: ['FX:EURUSD'],
        timeframe: '1h',
        amount: 100
      });
      console.log('Backup success:', candles);
      await backupConnection.close();
    } catch (retryError) {
      console.error('Retry failed:', retryError.message);
    }
  }
}
```

### Real-time Updates
```javascript
import { connect, getCandles } from 'tvws';

const connection = await connect();

// Set up real-time updates
connection.on('candle_update', (data) => {
  console.log('New candle:', data);
});

// Fetch initial data
const initialCandles = await getCandles({
  connection,
  symbols: ['BINANCE:BTCUSDT.P'],
  timeframe: '1m',
  amount: 100
});

console.log('Initial candles loaded:', initialCandles.length);
```

## 🌐 Web Example

This project includes a complete web interface for testing the library:

### Features
- 🎨 **Modern UI** with DaisyUI + Tailwind CSS
- 📊 **Interactive Dashboard** for testing all features
- 🔐 **Authentication Support** with helpful setup guide
- 📈 **Multiple Timeframes** selection with custom candle amounts
- 🔍 **Real-time Debug Log** with configurable log levels
- 📊 **Performance Metrics** and connection monitoring
- 📱 **Responsive Design** for all devices

### Running the Example

#### Development Mode (with hot reload)
```bash
cd tvws
bun run dev
# Open http://localhost:5173
```

#### Production Mode
```bash
cd tvws
bun run build    # Build once
bun run preview  # Preview production build
# Open http://localhost:4173
```

#### Custom Server
```bash
cd tvws
bun run build
cd dist
python -m http.server 8080
# Open http://localhost:8080
```

### Example Features
- ✅ **Multiple Endpoints**: Test all TradingView WebSocket endpoints
- ✅ **Symbol Selection**: Add multiple symbols with real-time validation
- ✅ **Timeframe Grid**: Choose from 13 different timeframes
- ✅ **Custom Amounts**: Set custom candle amounts per timeframe
- ✅ **Authentication**: Easy setup with visual guide
- ✅ **Performance Monitoring**: Track request times and success rates
- ✅ **Error Handling**: Comprehensive error reporting
- ✅ **Real-time Logging**: Filterable debug information
- ✅ **Data Export**: Export candle data to various formats

## 🔐 Authentication Guide

To access premium data or certain symbols, you'll need to provide your TradingView session ID:

### Method 1: Browser Extension
1. Install "EditThisCookie" or similar extension
2. Go to tradingview.com
3. Find and copy the `sessionid` cookie value
4. Use it in your connection

### Method 2: Browser Developer Tools
1. Open https://www.tradingview.com/chart/
2. Open Developer Tools (F12)
3. Go to **Application** → **Storage** → **Cookies** → **https://www.tradingview.com**
4. Find the `sessionid` cookie and copy its value
5. Use it in the connect options:

```javascript
const connection = await connect({
  endpoint: 'prodata', // or 'data'
  sessionId: 'qsxh1x2yz9i4x8x2...' // Your session ID
});
```

### Method 3: Using the Web Example
The built-in web example includes an interactive authentication helper with step-by-step instructions.

## 🛠️ Project Structure

```
tvws/
├── src/                    # Library source code
│   ├── index.ts           # Main library entry point
│   ├── connection.ts      # WebSocket connection handling
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Utility functions
├── example/               # Web example application
│   ├── index.html         # Main HTML file
│   ├── script.js          # JavaScript implementation
│   ├── styles.css         # Custom CSS styles
│   └── main.css           # Tailwind + DaisyUI integration
├── dist/                  # Built files (generated)
│   ├── index.js           # Built library
│   ├── index.d.ts         # Type definitions
│   └── assets/            # Built example assets
├── tests/                 # Test files
├── docs/                  # Documentation
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.mjs     # PostCSS configuration
├── package.json           # Project dependencies
└── README.MD              # This file
```

## 🧪 Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Type checking
bun run typecheck
```

## 📝 TypeScript Support

Full TypeScript support is included with comprehensive type definitions:

```typescript
import { TradingviewConnection, CandleData, ConnectOptions } from 'tvws';

const connection: TradingviewConnection = await connect({
  endpoint: 'data',
  sessionId: undefined
});

const candles: CandleData[] = await getCandles({
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
<script type="module" src="https://unpkg.com/tvws@0.0.10/dist/index.js"></script>
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup for Contributors
```bash
git clone https://github.com/badsector666/tvws.git
cd tvws
bun install
bun run dev
```

## 📊 Performance Tips

### Connection Reuse
```javascript
// ✅ Good: Reuse connections
const connection = await connect();
const data1 = await getCandles({ connection, symbols: ['FX:EURUSD'] });
const data2 = await getCandles({ connection, symbols: ['FX:GBPUSD'] });
await connection.close();

// ❌ Avoid: Multiple connections
const conn1 = await connect(); // Creates new WebSocket
const conn2 = await connect(); // Creates another WebSocket
```

### Batch Requests
```javascript
// ✅ Good: Batch symbol requests
const candles = await getCandles({
  connection,
  symbols: ['FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY'], // Multiple symbols
  timeframe: '1h',
  amount: 100
});

// ❌ Avoid: Multiple individual requests
const eurusd = await getCandles({ connection, symbols: ['FX:EURUSD'] });
const gbpusd = await getCandles({ connection, symbols: ['FX:GBPUSD'] });
```

### Timeframe Optimization
```javascript
// ✅ Recommended amounts per timeframe
const timeframeAmounts = {
  '1m': 1000,    // High frequency
  '5m': 1000,    // High frequency  
  '15m': 500,    // Medium frequency
  '1h': 200,     // Medium frequency
  '1D': 30,      // Low frequency
  '1W': 52,      // Year of weekly data
  '1M': 24       // 2 years of monthly data
};
```

## 🔒 Security & Rate Limiting

- **No API Keys Required**: Uses TradingView's public WebSocket endpoints
- **Rate Limiting**: Be mindful of request frequency to avoid being blocked
- **Session Security**: Session IDs are sensitive - don't expose them in public code
- **Connection Limits**: Avoid creating too many simultaneous connections

## 🐛 Troubleshooting

### Common Issues

#### "Failed to resolve import" errors
```bash
# Make sure dependencies are installed
bun install

# Clear node_modules and reinstall
rm -rf node_modules bun.lockb
bun install
```

#### WebSocket connection fails
- Check your internet connection
- Try different endpoints: `data`, `prodata`, `widgetdata`
- Verify symbol names are correct

#### CORS errors in browser
- Use HTTPS in production
- Some browsers require secure context for WebSocket connections

#### Authentication not working
- Ensure session ID is current and valid
- Check that the session has access to requested data
- Try without authentication first to verify basic functionality

### Debug Mode
```javascript
// Enable debug logging
const connection = await connect({
  debug: true  // Shows detailed connection logs
});
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- TradingView for providing the WebSocket API
- The open-source community for WebSocket libraries and tools
- DaisyUI and Tailwind CSS for the beautiful UI components

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/badsector666/tvws/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/badsector666/tvws/discussions)
- 📧 **Email**: badsectorkiller666@gmail.com

---

**⭐ Star this repository if it helped you!**

Made with ❤️ by [badsector666](https://github.com/badsector666)