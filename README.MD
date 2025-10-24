## Tradingview websockets integration
Unofficial library to interact with websockets on Tradingview. Now **browser compatible**!

P.S. Check out this awesome trading journal app https://tradinglog.app.

## Features
- ✅ **Browser Compatible** - Works in modern browsers with native WebSocket and Fetch APIs
- ✅ **CDN Ready** - Available via npm CDNs (unpkg, jsDelivr)
- Realtime data from Tradingview
- Authorization with session id from cookies
- Fetching candlesticks for any symbol with any available timeframe

## Installation

### NPM
```bash
npm install tvws
```

### CDN (Browser)
```html
<!-- Using unpkg -->
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';
</script>

<!-- Using jsDelivr -->
<script type="module">
import { connect, getCandles } from 'https://cdn.jsdelivr.net/npm/tvws@latest/dist/index.js';
</script>
```

## Examples

### Node.js
```ts
import { connect, getCandles } from 'tvws'

(async function() {
  const connection = await connect()
  const candles = await getCandles({
    connection,
    symbols: ['FX:AUDCAD', 'FX:AUDCHF'],
    amount: 10_000,
    timeframe: 60
  })
  await connection.close()
  console.log(`Candles for AUDCAD:`, candles[0])
  console.log(`Candles for AUDCHF:`, candles[1])
}());
```

### Browser (HTML)
```html
<!DOCTYPE html>
<html>
<head>
    <title>TradingView WebSocket Example</title>
</head>
<body>
    <div id="app">
        <h1>TradingView Data</h1>
        <button onclick="loadData()">Load EUR/USD Data</button>
        <div id="results"></div>
    </div>

    <script type="module">
        import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';

        window.loadData = async function() {
            try {
                const connection = await connect();
                const candles = await getCandles({
                    connection,
                    symbols: ['FX:EURUSD'],
                    amount: 10,
                    timeframe: '1D'
                });

                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = candles[0].map(candle =>
                    `<div>Date: ${new Date(candle.timestamp * 1000).toLocaleDateString()},
                     Close: ${candle.close.toFixed(5)}</div>`
                ).join('');

                await connection.close();
            } catch (error) {
                console.error('Error:', error);
            }
        };
    </script>
</body>
</html>
```

### Browser with Authentication
```javascript
// Note: Authentication may not work in browsers due to CORS restrictions
// You might need to manually provide session tokens

import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';

async function getAuthenticatedData() {
    try {
        const connection = await connect({
            sessionId: 'your_session_id_here' // From TradingView cookies
        });

        const candles = await getCandles({
            connection,
            symbols: ['NASDAQ:AAPL'],
            amount: 20,
            timeframe: '1D'
        });

        console.log('AAPL candles:', candles);
        await connection.close();
    } catch (error) {
        console.error('Authentication failed:', error);
        // Fall back to unauthorized connection if needed
    }
}
```

### Different Endpoints
```javascript
import { connect, getCandles, ENDPOINTS } from 'tvws';

// Using different endpoints for different user types
async function exampleEndpoints() {
    // Free users (default)
    const freeConnection = await connect(); // Uses "data" endpoint automatically

    // Premium users
    const premiumConnection = await connect({
        endpoint: 'prodata'
    });

    // Widget data
    const widgetConnection = await connect({
        endpoint: 'widgetdata'
    });

    // Custom endpoint
    const customConnection = await connect({
        endpoint: 'wss://your-custom-endpoint.com/socket.io/websocket'
    });

    // Using predefined endpoint URLs
    console.log('Available endpoints:', ENDPOINTS);

    try {
        const candles = await getCandles({
            connection: freeConnection,
            symbols: ['FX:EURUSD'],
            amount: 10,
            timeframe: '1D'
        });
        console.log('Free user data:', candles);
        await freeConnection.close();
    } catch (error) {
        console.error('Connection failed:', error);
    }
}
```

### Browser Example with Different Endpoints
```html
<script type="module">
import { connect, getCandles, ENDPOINTS } from 'https://unpkg.com/tvws@latest/dist/index.js';

// Connect using different endpoints based on user type
async function connectToTradingview(userType = 'free') {
    const endpointMap = {
        'free': 'data',
        'premium': 'prodata',
        'widget': 'widgetdata'
    };

    const connection = await connect({
        endpoint: endpointMap[userType] || 'data'
    });

    return connection;
}
</script>
```

## API

### `connect(options: ConnectionOptions = {}): Promise<TradingviewConnection>`

Creates new connection to tradingview websockets. Returns `TradingviewConnection`.

Options:

* `sessionId?: string` - authorize connection if present. Can be received from cookies.
  - **Note**: Due to browser CORS restrictions, authentication may not work in browsers.
  - Consider using a server proxy for authentication if needed.
* `endpoint?: string | TradingviewEndpoint` - WebSocket endpoint to connect to.
  - Default: `"data"` (for free users)
  - Available endpoints:
    - `"data"` - `wss://data.tradingview.com/socket.io/websocket` (default, free users)
    - `"prodata"` - `wss://prodata.tradingview.com/socket.io/websocket` (premium users)
    - `"widgetdata"` - `wss://widgetdata.tradingview.com/socket.io/websocket` (widget data)
    - `"charts-polygon"` - `wss://charts-polygon.tradingview.com/socket.io/websocket` (polygon data)
  - Custom WebSocket URLs are also supported (must start with `wss://`)

### `getCandles({ connection, symbols, amount, timeframe = 60 }: GetCandlesParams)`

Fetches all available candles for symbols. The maximum amount is around 13_000 candles for the hourly timeframe. Returns an array where each element is an array of candles for one symbol in the order it passed to the function.

Options:

* `connection: TradingviewConnection` - connection object
* `symbols: string[]` - array of symbols. Symbol name can be found on Symbol info modal(click three dots after symbol name on the top left corner of the chart).
* `timeframe?: number | '1D' | '1W' | '1M'` - candlestick timeframe, default is `60`
* `amount?: number` - amount of candles to fetch. If not present, it will try to fetch as much as possible.

### `TradingviewConnection`

Connection object. Can be used directly to receive and send data to websockets.

Methods:

* `subscribe: (handler: Subscriber) => Unsubscriber` - subscribe to websockets events
* `send: (name: string, params: any[]) => void` - send command to websockets
* `close: () => Promise<void>` - close the connection

## Browser Compatibility

### ✅ Supported Features
- Native WebSocket API (no polyfills needed)
- Fetch API for authentication (when CORS allows)
- ES2015+ modules
- Modern browsers (Chrome, Firefox, Safari, Edge)

### ⚠️ Limitations
- **Authentication**: Due to CORS restrictions, `sessionId` authentication may not work in browsers
- **Cross-origin requests**: TradingView may block requests from different domains

### 🔧 Solutions for Authentication
1. **Server Proxy**: Create a backend endpoint to handle authentication
2. **Manual Tokens**: Extract session tokens manually and provide them to the library
3. **Unauthorized Access**: Use the library without authentication (limited data)

### 📦 CDN Usage
After publishing to npm, you can use the library directly in HTML:

```html
<!-- Latest version -->
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';
</script>

<!-- Specific version -->
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@0.0.3/dist/index.js';
</script>
```
