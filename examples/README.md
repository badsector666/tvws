# TVWS Examples

This directory contains comprehensive examples demonstrating all TVWS features for different use cases and environments.

## 🚀 Quick Start

```bash
# Build the library first
bun run build

# Run basic examples
node examples/basic-usage.cjs

# Interactive browser demo
open examples/browser-demo.html
```

## 📁 Example Categories

### 🔰 **Getting Started**
Perfect for beginners learning TVWS basics:

- **[basic-usage.cjs](./basic-usage.cjs)** - Simple, focused examples for getting started
  - Client creation methods
  - Basic chart and quote sessions  
  - Simple event handling
  - Method chaining basics

### 🎯 **Core Features**
In-depth examples covering specific TVWS capabilities:

- **[event-patterns.cjs](./event-patterns.cjs)** - Event system deep dive
  - Wildcard pattern matching
  - Hierarchical event namespacing
  - Event chaining and composition
  - Performance optimization
  
- **[websocket-demo.cjs](./websocket-demo.cjs)** - WebSocket connection handling
  - Connection resilience
  - Multiple server endpoints
  - Real-time data streaming
  - Session management

### 🏗️ **Advanced Applications**
Real-world usage examples and complete applications:

- **[advanced-usage.cjs](./advanced-usage.cjs)** - Comprehensive feature demonstration
  - All session types (Chart, Quote, Replay, Study)
  - Advanced configuration options
  - Error handling patterns
  - Performance testing
  - Resource management

- **[trading-dashboard.cjs](./trading-dashboard.cjs)** - Complete trading application
  - Portfolio management
  - Real-time market data
  - Alert system
  - Risk management
  - Trading signals

### 🌐 **Browser Examples**

- **[browser-demo.html](./browser-demo.html)** - Interactive browser demo
  - Live connection testing
  - Interactive UI controls
  - Real-time WebSocket status
  - Visual event monitoring

- **[esm-browser-demo.html](./esm-browser-demo.html)** - Modern ESM browser usage
  - Dynamic imports
  - Module-level exports
  - Advanced feature testing

- **[quick-test.html](./quick-test.html)** - Simple verification page
  - Quick library loading test
  - Basic functionality check
  - Good for testing after builds

- **[bun-simple.html](./bun-simple.html)** - Bun-optimized browser demo
  - Designed specifically for Bun's bundler
  - Uses bundled approach for better compatibility
  - Comprehensive testing interface

- **[bun-test.html](./bun-test.html)** - Advanced ESM demo for Bun
  - ES Module imports with advanced testing
  - Detailed feature demonstrations
  - Real-time testing interface

- **[tradingview-connection-test.html](./tradingview-connection-test.html)** - Real TradingView connection monitor
  - Shows actual TradingView WebSocket connections
  - Distinguishes between Bun dev logs and TradingView logs
  - Connection statistics and real-time monitoring

### 📱 **Simple Examples**
Quick reference examples:

- **[simple-node-demo.cjs](./simple-node-demo.cjs)** - Quick Node.js test
- **[simple-esm-demo.mjs](./simple-esm-demo.mjs)** - Quick ESM test

## 🛠️ **Running Examples**

### Node.js Examples
```bash
# Basic usage (recommended start)
node examples/basic-usage.cjs

# Event system deep dive
node examples/event-patterns.cjs

# WebSocket connections
node examples/websocket-demo.cjs

# Comprehensive feature demo
node examples/advanced-usage.cjs

# Complete trading application (2 min demo)
node examples/trading-dashboard.cjs
```

### Browser Examples

#### Method 1: Bun (Best for Development)
```bash
# Bun has built-in HTTP server - easiest way
cd examples
bun run bun-simple.html        # ✅ Works best with Bun's bundler
bun run bun-test.html          # ESM version with advanced testing
bun run browser-demo.html     # Original interactive demo
bun run esm-browser-demo.html # ESM browser demo
bun run quick-test.html       # Simple verification
```

#### Method 2: Python HTTP Server
```bash
# Alternative with Python
python -m http.server 8000
# Then visit:
# http://localhost:8000/examples/browser-demo.html
# http://localhost:8000/examples/esm-browser-demo.html
```

#### Method 3: Any HTTP Server
```bash
# Any HTTP server that supports ES modules will work
# Just serve the examples/ folder and navigate to the HTML files
```

**Note**: The `bun-simple.html` is specifically designed to work well with Bun's bundler and is the recommended approach for Bun users.

**⚠️ Important**: When running with `bun run`, you'll see WebSocket connection logs like `ws://localhost:3000/_bun/hmr`. These are **Bun's development server logs** (Hot Module Reloading), **NOT** TradingView connections. See `tradingview-connection-test.html` to see actual TradingView connection attempts.

## 📊 **Example Coverage**

| Feature | Basic Usage | Event Patterns | Advanced | Trading Dashboard | Browser Demo |
|---------|-------------|----------------|----------|-------------------|--------------|
| Client Creation | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chart Sessions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quote Sessions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Study Sessions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Replay Sessions | ❌ | ❌ | ✅ | ❌ | ❌ |
| Event Handling | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebSocket Real | ❌ | ❌ | ✅ | ✅ | ✅ |
| Trading Logic | ❌ | ❌ | ❌ | ✅ | ❌ |
| Performance Testing | ❌ | ✅ | ✅ | ❌ | ❌ |
| Interactive UI | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🎯 **Recommended Learning Path**

1. **Start Here**: `examples/basic-usage.cjs`
   - Learn fundamental concepts
   - Understand API structure
   - Master basic operations

2. **Event System**: `examples/event-patterns.cjs`
   - Master event handling
   - Learn wildcard patterns
   - Optimize performance

3. **Real Connections**: `examples/websocket-demo.cjs`
   - Understand WebSocket behavior
   - Learn connection management
   - Handle network issues

4. **Complete Application**: `examples/trading-dashboard.cjs`
   - See real-world usage
   - Learn architecture patterns
   - Understand best practices

5. **Full Feature Set**: `examples/advanced-usage.cjs`
   - Explore all capabilities
   - Learn edge cases
   - Master advanced techniques

## ⚡ **Performance Tips**

- Use specific event names instead of wildcards when possible
- Remove event listeners in cleanup to prevent memory leaks
- Chain method calls for better readability
- Use session IDs for tracking when managing multiple sessions
- Implement error handling in all event callbacks

## 🔧 **Troubleshooting**

### Common Issues

1. **WebSocket Connection Fails**
   - Expected in demo environments
   - Real connections require valid TradingView endpoints
   - See `websocket-demo.cjs` for connection patterns

2. **Module Import Errors**
   - Ensure `dist/` folder exists: `bun run build`
   - Use `.cjs` extension for CommonJS examples
   - Use `.mjs` extension for ESM examples

3. **Browser CORS Issues**
   - Use HTTP server, not `file://` protocol
   - Some browsers restrict WebSocket connections from local files

4. **Memory Leaks**
   - Always call `delete()` on sessions when done
   - Remove event listeners with `off()`
   - See `advanced-usage.cjs` for cleanup patterns

## 📚 **Related Documentation**

- [Main README](../README.md) - Library overview and installation
- [API Documentation](../README.md#features) - Complete API reference
- [Build System](../README.md#build-system) - Build scripts and configuration

## 🎉 **Contributing**

Have an idea for a new example? Feel free to:

1. Create a new example file in `examples/`
2. Follow the existing naming convention
3. Add comprehensive comments
4. Update this README with your example
5. Test with `bun run build` first

Examples should demonstrate:
- Clear learning objectives
- Step-by-step progression
- Real-world usage patterns
- Error handling
- Performance considerations