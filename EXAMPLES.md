# TVWS Demo Repository

This document contains information about the live demo and examples for the TVWS library.

## 📁 Demo Repository

The main demo repository is located at:
**https://github.com/badsector666/tvws-demo**

## 🚀 Live Demo Features

### Interactive Trading Interface
- **Real-time WebSocket Connection** - Connect to TradingView endpoints
- **Authentication Support** - Optional session-based authentication
- **Multiple Symbol Support** - Query multiple trading pairs simultaneously
- **All Timeframes** - Support for every TradingView timeframe (1m to 1M)
- **Performance Metrics** - Connection and data performance monitoring
- **Error Handling** - Comprehensive error management
- **Live Debug Log** - Real-time event monitoring

### Demonstrated Features
- **WebSocket Connection** - Connect to data, prodata, widgetdata endpoints
- **Market Data Retrieval** - Get candlestick data for any symbol
- **Real-time Updates** - Live market data streaming
- **Bulk Queries** - Multiple symbols and timeframes at once
- **Performance Optimization** - Efficient data handling
- **Error Recovery** - Automatic fallback endpoints

## 🛠️ Running the Demo

### Prerequisites
- Node.js (v16+) or Bun
- Modern web browser

### Quick Start
```bash
git clone https://github.com/badsector666/tvws-demo.git
cd tvws-demo
npm install
npm run dev
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

Visit http://localhost:5173 for the live demo!

## 📚 Learn More

### Documentation
- **Main Library**: https://github.com/badsector666/tvws
- **API Reference**: https://github.com/badsector666/tvws#api-reference
- **NPM Package**: https://www.npmjs.com/package/tvws
- **TradingView**: https://www.tradingview.com/

### CDN Usage
```html
<script type="module">
import { connect, getCandles } from 'https://unpkg.com/tvws@latest/dist/index.js';
// Use the library directly in your browser
</script>
```

### Community
- **Issues**: https://github.com/badsector666/tvws/issues
- **Discussions**: https://github.com/badsector666/tvws/discussions

## 🤝 Contributing

We welcome contributions to the demo! Please feel free to:
- Improve the demo interface
- Add new example features
- Report bugs
- Suggest enhancements

## 📄 License

The demo is licensed under the same MIT license as the main TVWS library.