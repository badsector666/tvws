# TVWS - TradingView WebSocket API

A browser-compatible TradingView WebSocket API with extensible event system.

## Installation

```bash
npm install tvws
```

## Usage

### Node.js

```javascript
import { createClient } from 'tvws';
// or
const { createClient } = require('tvws');

const client = createClient();
```

### Browser / CDN

```html
<!-- Use the browser build -->
<script src="https://unpkg.com/tvws/dist/tvws.browser.js"></script>
<script>
  const client = tvws.createClient();
</script>
```

### ESM in Browser

```javascript
import { createClient } from 'https://unpkg.com/tvws/dist/tvws.esm.js';
const client = createClient();
```

## Build System

This project uses **bun** for ultra-fast builds and optimized bundle sizes.

### Available Scripts

- `bun run build` - Build all formats (browser, ESM, Node.js, types)
- `bun run build:browser` - Browser build with minification (~10KB)
- `bun run build:prod` - Production browser build with maximum minification
- `bun run build:esm` - ESM build for modern browsers
- `bun run build:node` - CommonJS build for Node.js
- `bun run build:types` - TypeScript declaration files
- `bun run dev` - Development mode with hot reload
- `bun run clean` - Clean dist directory
- `bun run size` - Check bundle sizes

### Bundle Sizes

- **Browser build**: ~10KB (minified)
- **ESM build**: ~10KB (minified)  
- **Node.js build**: ~18KB (unminified)
- **Production build**: ~10KB (max minification)

### Development

```bash
# Install dependencies with bun
bun install

# Start development
bun run dev

# Build for production
bun run build
```

## Features

- 🚀 **Ultra-fast builds** with bun
- 📦 **Tiny bundle size** (~10KB minified)
- 🌐 **Browser and Node.js** compatible
- 📡 **Real-time WebSocket** connection to TradingView
- 🎯 **Hierarchical event system** with wildcard support
- 🔧 **Extensible** with custom session types
- 📈 **Chart, Quote, Replay, and Study** sessions
- 💾 **Zero runtime dependencies**

## License

MIT