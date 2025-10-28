# TVWS - TradingView WebSocket Library

Browser-compatible TradingView WebSocket API with multiple endpoints and real-time data support.

## 🚀 Features

- ✅ **Browser Compatible** - Works in modern browsers with native WebSocket and Fetch APIs
- ✅ **CDN Ready** - Available via npm CDNs (unpkg, jsDelivr)
- ✅ **Bun Compatible** - Works with Bun bundler using dynamic imports
- ✅ **Multiple Endpoints** - Support for different TradingView WebSocket endpoints
- ✅ **Flexible Timeframes** - Supports various formats: "1m", "5m", "1h", "4h", "1D", etc.
- ✅ **Real-time Data** - Subscribe to live market data updates
- ✅ **Authentication Support** - Optional session-based authentication
- ✅ **Complete Web Interface** - Full-featured example with responsive design

## 📦 Installation

### NPM
```bash
npm install tvws
```

### CDN (Browser)
```html
<!-- Using unpkg -->
<script type="module">
import { connect, getCandles, ENDPOINTS } from 'https://unpkg.com/tvws@latest/dist/index.js';
</script>

<!-- Using jsDelivr -->
<script type="module">
import { connect, getCandles, ENDPOINTS } from 'https://cdn.jsdelivr.net/npm/tvws@latest/dist/index.js';
</script>
```

## ⚠️ Important: Bun Compatibility

If you're using **Bun** as your bundler or development server, you may encounter bundling issues with static CDN imports. The library includes built-in dynamic import support to handle this automatically.

**For Bun users:**
- The included example uses dynamic imports to avoid bundler issues
- No additional configuration required
- Works seamlessly with `bun run` and `bun dev`

**If you encounter bundler issues:**
```javascript
// Use dynamic imports instead of static imports
const { connect, getCandles, ENDPOINTS } = await import('https://unpkg.com/tvws@latest/dist/index.js');
```

## 🎯 Quick Start

### Basic Usage
```javascript
import { connect, getCandles } from 'tvws';

// Connect to TradingView
const connection = await connect();

// Fetch candlestick data
const candles = await getCandles({
  connection,
  symbols: ['FX:EURUSD'],
  amount: 10,
  timeframe: '1D'
});

console.log('Candles:', candles);
await connection.close();
```

### With Authentication
```javascript
import { connect, getCandles } from 'tvws';

const connection = await connect({
  sessionId: 'your_session_id_here' // From TradingView cookies
});

const candles = await getCandles({
  connection,
  symbols: ['NASDAQ:AAPL'],
  amount: 20,
  timeframe: '1h'
});

console.log('AAPL candles:', candles);
await connection.close();
```

### Dynamic Import (Recommended for Bun)
```javascript
// For Bun or environments with bundler restrictions
async function initTradingView() {
  const { connect, getCandles } = await import('https://unpkg.com/tvws@latest/dist/index.js');
  
  const connection = await connect();
  const candles = await getCandles({
    connection,
    symbols: ['FX:EURUSD'],
    amount: 10,
    timeframe: '1D'
  });
  
  return { connection, candles };
}
```

## 🌐 Live Example

The library includes a complete, production-ready web interface in the `example/` folder that now uses CDN for easy deployment:

### Features
- **CDN-Powered** - Uses npm CDN for hassle-free setup without local builds
- **Dynamic Import Support** - Automatic fallback to handle bundler limitations (Bun, etc.)
- **Multi-endpoint Support** - Switch between data, prodata, widgetdata endpoints
- **Authentication UI** - Optional session-based authentication with help guide
- **Real-time Connection Status** - Live connection monitoring and debugging
- **Symbol Selection** - Quick presets for popular crypto, forex, and stock symbols
- **Flexible Timeframes** - Support for all TradingView timeframes
- **Data Visualization** - Clean display of OHLCV data with statistics
- **Extended Data** - Optional VWAP and trade volume information
- **Debug Logging** - Comprehensive logging for troubleshooting

### Running the Example

#### Using Bun (Recommended)
```bash
# Clone the repository
git clone https://github.com/badsector666/tvws.git
cd tvws

# Start with Bun (uses dynamic imports automatically)
bun --port 3000 example/index.html
# then open http://localhost:3000
```

#### Using Other Servers
```bash
# Using Node.js serve
npx serve example/

# Using Python
python -m http.server 8000 --directory example

# Using any static server
# then open the appropriate URL
```

**Note:** The example uses dynamic imports and automatically handles CDN vs local module loading, so you can serve the `example/` folder directly without building the library first.

### Example Interface
The web example provides:
- **Quick Connect** - One-click connection with optimal settings
- **Endpoint Selection** - Choose between available TradingView endpoints
- **Authentication Options** - Optional session ID input with instructions
- **Query Configuration** - Symbol, timeframe, and amount selection
- **Results Display** - Formatted candlestick data with price statistics
- **Debug Console** - Real-time logging for troubleshooting

## 📊 Supported Data

### Symbol Formats
```javascript
// Forex
'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY'

// Crypto
'CRYPTO:BTCUSD', 'BINANCE:BTCUSDT.P', 'BINANCE:ETHUSDT.P'

// Stocks
'NASDAQ:AAPL', 'NASDAQ:TSLA', 'NYSE:GME'

// Custom brokers
'OANDA:EUR_USD', 'POLYGON:BTCUSD'
```

### Timeframe Formats
```javascript
// Intraday (supports all common timeframes)
'1m', '3m', '5m', '15m', '30m', '45m'  // Minutes
'1h', '2h', '3h', '4h', '8h', '12h'   // Hours

// Daily/Weekly/Monthly
'1D', '1W', '1M'

// Direct API values
1, 5, 15, 30, 60, 240, 'D', 'W', 'M'
```

### Response Data
Each candle includes:
```javascript
{
  timestamp: 1640995200,  // Unix timestamp
  open: 1.13500,         // Open price
  high: 1.13750,         // High price
  low: 1.13400,          // Low price
  close: 1.13650,        // Close price
  volume: 1250,          // Trading volume
  vwap: 1.13580,         // Volume Weighted Average Price (optional)
  trades: 450            // Number of trades (optional)
}
```

## 🔧 API Reference

### `connect(options?: ConnectionOptions): Promise<TradingviewConnection>`

Creates a new connection to TradingView WebSocket endpoints.

**Options:**
- `sessionId?: string` - Optional authentication token from TradingView cookies
- `endpoint?: string | TradingviewEndpoint` - WebSocket endpoint selection

**Endpoints:**
- `"data"` - Free user data (default)
- `"prodata"` - Premium user data
- `"widgetdata"` - Widget-specific data
- `"charts-polygon"` - Polygon.io chart data
- Custom WebSocket URLs (must start with `wss://`)

### `getCandles(params: GetCandlesParams): Promise<CandleData[]>`

Fetches historical candlestick data for specified symbols.

**Parameters:**
- `connection: TradingviewConnection` - Active connection instance
- `symbols: string[]` - Array of trading symbols
- `amount?: number` - Number of candles to fetch (1-500, default: maximum available)
- `timeframe?: string | number` - Chart timeframe (default: "1D")

**Returns:** Array of candle arrays, one per symbol in the order provided

### `TradingviewConnection`

Connection object with real-time capabilities:

**Methods:**
- `subscribe(handler: Subscriber): Unsubscriber` - Subscribe to WebSocket events
- `send(name: string, params: any[]): void` - Send commands to WebSocket
- `close(): Promise<void>` - Close the connection

**Example:**
```javascript
const connection = await connect();

// Subscribe to real-time events
const unsubscribe = connection.subscribe((event) => {
  console.log('Real-time event:', event.name, event.data);
});

// Send custom commands
connection.send('chart_create_session', ['session_id']);

// Clean up
await connection.close();
```

## 🔐 Authentication

### Getting Session ID
1. Open [TradingView](https://www.tradingview.com/chart/) in your browser
2. Open Developer Tools (F12)
3. Go to Application tab → Cookies → tradingview.com
4. Find and copy the `sessionid` cookie value
5. Use it as the `sessionId` parameter

### Authentication Limitations
- **Browser CORS**: Due to Cross-Origin Resource Sharing restrictions, authentication may not work in browsers
- **Workaround**: Use a server-side proxy for authentication if needed
- **Public Data**: Most data is available without authentication

## 🌍 Browser Compatibility

### ✅ Supported Browsers
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### ✅ Supported Runtimes
- **Node.js** - Full support
- **Bun** - Full support with dynamic imports
- **Deno** - Should work (not tested)

### ✅ Required Features
- Native WebSocket API
- ES2015+ modules
- Fetch API (for authentication)
- Modern JavaScript (Promise, async/await)

### ⚠️ Known Limitations
- Authentication blocked by CORS in most browsers
- Some corporate networks block WebSocket connections
- TradingView may rate-limit unauthenticated requests
- **Bun bundler**: Requires dynamic imports for external CDN modules

## 🚀 Deployment

### Production Usage
```html
<!-- Use specific version for production -->
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@0.0.5/dist/index.js';
</script>

<!-- Or use dynamic imports for better bundler compatibility -->
<script type="module">
async function initApp() {
  const { connect, getCandles } = await import('https://unpkg.com/tvws@0.0.5/dist/index.js');
  // Your app logic here
}
initApp();
</script>
```

### Server-Side Usage (Node.js/Bun)
```javascript
import { connect, getCandles } from 'tvws';

// Works in Node.js and Bun environments
const connection = await connect({
  endpoint: 'prodata',
  sessionId: process.env.TRADINGVIEW_SESSION
});

const data = await getCandles({
  connection,
  symbols: ['CRYPTO:BTCUSD'],
  timeframe: '1h',
  amount: 24
});

await connection.close();
```

## 🛠️ Development

### Building from Source
```bash
git clone https://github.com/badsector666/tvws.git
cd tvws
npm install
npm run build
```

### Development Workflow
This project uses **automated npm publishing** with GitHub Actions and **Bun** for optimal build performance.

#### Prerequisites
- Bun installed locally
- GitHub account with repository access
- npm account with publishing permissions

#### Automated Publishing Setup
The project includes a complete CI/CD pipeline that automatically publishes to npm when version tags are pushed.

**For Maintainers:**
```bash
# Update version and publish (automated)
npm version patch  # or minor/major
git push origin master --tags
```

**What happens automatically:**
1. GitHub Actions triggers on version tags (v*)
2. Runs type checking and builds with Bun minification
3. Publishes to npm using NPM_TOKEN secret
4. Creates GitHub release with installation instructions
5. Bundle size optimization (77% smaller than TypeScript build)

#### Build Scripts
```bash
# Production build with Bun minification
bun run build

# Development build with TypeScript
bun run build:dev

# Type checking only
bun run typecheck

# Prepare for npm publishing (typecheck + build)
bun run prepublishOnly
```

#### Bundle Size Optimization
The project uses Bun bundler with minification for optimal npm package size:
- **Before**: 52KB (TypeScript build with source maps)
- **After**: 12KB (Bun minified bundle)
- **Reduction**: 77% smaller

**Build Configuration:**
```bash
# Bun build command used in CI/CD
bun build src/index.ts --outfile dist/index.js --minify --target browser --format esm

# TypeScript declarations only
tsc --emitDeclarationOnly --declarationMap false
```

#### Repository Structure
```
tvws/
├── src/                      # TypeScript source code
├── dist/                     # Optimized bundle (12KB total)
│   ├── index.js             # Minified bundle (7.1KB)
│   └── index.d.ts           # TypeScript declarations (1.6KB)
├── example/                  # Complete web interface example
├── .github/workflows/        # GitHub Actions CI/CD
│   └── npm-publish.yml      # Automated publishing workflow
├── package.json             # Bun-optimized package configuration
├── bun.lock                 # Bun dependency lock file
└── tsconfig.json           # TypeScript configuration
```

#### Manual Publishing (Fallback)
If automated publishing fails, you can publish manually:

```bash
# Build first
bun run build

# Publish manually (requires OTP if enabled)
npm publish --access public

# Or with specific token (if configured)
npm publish --access public --token YOUR_TOKEN
```

**Important:** Do not commit `package-lock.json` as this project uses Bun for dependency management.

### Project Structure
```
tvws/
├── src/                 # TypeScript source code
├── dist/                # Compiled JavaScript distribution
├── example/             # Complete web interface example
│   ├── index.html      # Main example interface
│   ├── script.js       # Example functionality (with dynamic imports)
│   └── styles.css      # Responsive styling
└── package.json        # Project configuration
```

## 🔧 Troubleshooting

### Bun Bundler Issues
If you encounter `Failed to load bundled module` errors with Bun:

1. **Use the provided example** - It already includes dynamic import fixes
2. **Use dynamic imports** in your own code:
   ```javascript
   const { connect, getCandles } = await import('tvws');
   ```
3. **Avoid static CDN imports** that cause bundler issues

### Common Issues
- **Connection timeouts** - Check network connectivity and try different endpoints
- **No data received** - Verify symbol format and try different timeframes
- **CORS errors** - Authentication may not work in browsers due to CORS restrictions

### Debug Mode
Enable debug logging by using the example interface or adding console.log statements to track connection progress.

## 📝 Example Implementation Details

The `example/` folder demonstrates a complete, production-ready implementation:

### Key Features Demonstrated
- **Dynamic Import Handling** - Automatic CDN vs local module loading
- **Error Handling** - Comprehensive error catching and user feedback
- **Connection Management** - Automatic connection lifecycle management
- **User Interface** - Responsive design with modern CSS
- **Data Visualization** - Clean display of market data with statistics
- **Debugging Tools** - Real-time logging and troubleshooting guides
- **Authentication UI** - User-friendly authentication setup with help

### UI Components
- **Endpoint Selector** - Switch between different TradingView endpoints
- **Authentication Panel** - Optional session ID input with instructions
- **Symbol Presets** - Quick selection of popular trading symbols
- **Timeframe Options** - All supported TradingView timeframes
- **Results Display** - Formatted OHLCV data with price statistics
- **Debug Console** - Real-time connection and data logging

### Dynamic Import Implementation
The example includes a robust dynamic import system that:
1. **Tries CDN first** - Attempts to load from unpkg CDN
2. **Falls back to local** - Uses local build if CDN fails
3. **Handles errors gracefully** - Provides clear error messages
4. **Works with all bundlers** - Compatible with Bun, Vite, Webpack, etc.

This example serves as both a testing tool and a reference implementation for integrating the tvws library into web applications.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines and submit pull requests.

## 🔗 Links

- **Repository**: https://github.com/badsector666/tvws
- **NPM Package**: https://www.npmjs.com/package/tvws
- **Live Demo**: See `example/` folder for complete implementation

---

**tvws** - Unofficial TradingView WebSocket library with browser compatibility, Bun support, and complete web interface.