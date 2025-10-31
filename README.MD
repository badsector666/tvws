# TVWS - TradingView WebSocket Library

Browser-compatible TradingView WebSocket API for fetching market data.

## Installation

```bash
npm install tvws
```

## Quick Start

```javascript
import { connect, getCandles } from 'tvws';

// Connect to TradingView
const connection = await connect();

// Fetch candlestick data
const candles = await getCandles({
  connection,
  symbols: ['FX:EURUSD'],
  amount: 100,
  timeframe: '1D'
});

console.log(candles);
await connection.close();
```

## CDN Usage

```html
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';
</script>
```

## API

### `connect(options?)`
Create a WebSocket connection to TradingView.

**Options:**
- `sessionId?: string` - Optional TradingView session ID for premium data
- `endpoint?: string` - WebSocket endpoint (`"data"`, `"prodata"`, `"widgetdata"`, `"charts-polygon"`)

### `getCandles(params)`
Fetch candlestick data.

**Parameters:**
- `connection: TradingviewConnection` - Active connection
- `symbols: string[]` - Trading symbols
- `amount?: number` - Number of candles (default: maximum available)
- `timeframe?: string|number` - Chart timeframe (default: "1D")

## Supported Symbols

```javascript
// Forex
'FX:EURUSD', 'FX:GBPUSD'

// Crypto  
'CRYPTO:BTCUSD', 'BINANCE:BTCUSDT.P'

// Stocks
'NASDAQ:AAPL', 'NYSE:TSLA'
```

## Supported Timeframes

```javascript
// Minutes
'1m', '5m', '15m', '30m', '45m'

// Hours  
'1h', '2h', '4h'

// Daily/Weekly/Monthly
'1D', '1W', '1M'
```

## Response Data

```javascript
{
  timestamp: 1640995200,  // Unix timestamp
  open: 1.13500,         // Open price
  high: 1.13750,         // High price  
  low: 1.13400,          // Low price
  close: 1.13650,        // Close price
  volume: 1250           // Trading volume
}
```

## Example

Run the included web example:

```bash
git clone https://github.com/badsector666/tvws.git
cd tvws
bun --port 3000 example/index.html
# Open http://localhost:3000
```

The example includes a complete interface for testing the library with multiple symbols, timeframes, and endpoints.

## Authentication

Optional authentication for premium data:

1. Open TradingView in your browser
2. Open Developer Tools (F12)
3. Go to Application → Cookies → tradingview.com  
4. Copy the `sessionid` cookie value
5. Use it in the `connect()` options

```javascript
const connection = await connect({
  sessionId: 'your_session_id_here'
});
```

## License

MIT