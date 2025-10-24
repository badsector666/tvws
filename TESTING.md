# TradingView WebSocket Browser Testing

## How to Test the HTML Example

### Option 1: Using a Local Server (Recommended)

You cannot open HTML files with ES6 modules directly from the file system due to CORS restrictions. Use one of these methods:

#### Method A: Using Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Method B: Using Node.js
```bash
npx serve .
# or
npx http-server
```

#### Method C: Using VS Code Live Server Extension
1. Install the "Live Server" extension in VS Code
2. Right-click on `example.html` 
3. Select "Open with Live Server"

#### Method D: Using PHP
```bash
php -S localhost:8000
```

### Option 2: Using Online Services

You can also test by uploading the HTML file to services like:
- CodePen
- JSFiddle
- Replit
- GitHub Pages

## Opening the Example

1. Start any of the local servers above
2. Open your browser and navigate to:
   - `http://localhost:8000/example.html`
   - Or whatever port your server is using

## Expected Behavior

1. **Page loads** with connection status "Ready to test"
2. **Select endpoint** (default: "data" for free users)
3. **Click "Connect to TradingView"** - should establish WebSocket connection
4. **Click "Get EUR/USD Data"** - should fetch and display candle data

## Troubleshooting

### Connection Issues
- Try different endpoints (prodata, widgetdata, charts-polygon)
- Check your internet connection
- Some corporate networks may block WebSocket connections

### No Data Received
- Try different symbols (FX:EURUSD, FX:GBPUSD, NASDAQ:AAPL)
- Different endpoints may have different data availability
- Some endpoints require authentication

### Browser Compatibility
- Works in modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- May not work in very old browsers

## CDN vs Local Import

The example uses CDN import:
```javascript
import { connect, getCandles, ENDPOINTS } from 'https://unpkg.com/tvws@latest/dist/index.js';
```

This ensures it works immediately without local server setup for the JavaScript part, but you still need a server to serve the HTML file itself due to CORS restrictions.