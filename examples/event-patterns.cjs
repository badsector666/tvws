// Event Patterns and Advanced Event Handling
// Deep dive into TVWS event system capabilities
// Run with: node examples/event-patterns.cjs

const { createClient, EventEmitter } = require('../dist/tvws.cjs');

console.log('🎯 TVWS Event Patterns Deep Dive');
console.log('=================================');

// Example 1: Basic Event Patterns
console.log('\n📡 Example 1: Basic Event Patterns');

const client = createClient();
let eventCount = 0;

// Exact match
client.on('client:connected', () => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Exact match - client:connected`);
});

client.on('client:disconnected', () => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Exact match - client:disconnected`);
});

// Single wildcard
client.on('client:*', (event, data) => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Single wildcard - client:* -> ${event}`);
});

// Double wildcard
client.on('*:*', (event, data) => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Double wildcard - *:* -> ${event}`);
});

// Emit test events
console.log('📡 Emitting test events:');
client.emit('client:connected');
client.emit('client:disconnected');
client.emit('client:error', 'Test error');
client.emit('chart:update', { symbol: 'BTCUSD' });
client.emit('quote:price', { symbol: 'EURUSD' });

// Example 2: Hierarchical Event Namespacing
console.log('\n🌳 Example 2: Hierarchical Event Namespacing');

const hierarchyClient = createClient();

// Chart hierarchy events
hierarchyClient.on('chart:*', (event, data) => {
  console.log(`📊 Chart event: ${event}`);
});

hierarchyClient.on('chart:*:*', (event, data) => {
  console.log(`📊 Chart sub-event: ${event}`);
});

// Quote hierarchy events
hierarchyClient.on('quote:*', (event, data) => {
  console.log(`💰 Quote event: ${event}`);
});

hierarchyClient.on('quote:*:*', (event, data) => {
  console.log(`💰 Quote sub-event: ${event}`);
});

// Study hierarchy events
hierarchyClient.on('study:*', (event, data) => {
  console.log(`📈 Study event: ${event}`);
});

// Emit hierarchical events
console.log('📡 Emitting hierarchical events:');
hierarchyClient.emit('chart:cs123:update', { price: 50000 });
hierarchyClient.emit('chart:cs123:symbol_loaded', { symbol: 'BTCUSD' });
hierarchyClient.emit('quote:qs456:price', { symbol: 'EURUSD', price: 1.0850 });
hierarchyClient.emit('quote:qs456:volume', { symbol: 'EURUSD', volume: 1000 });
hierarchyClient.emit('study:ss789:completed', { studyId: 'RSI' });

// Example 3: Wildcard Matching Strategies
console.log('\n🎯 Example 3: Wildcard Matching Strategies');

const strategyClient = createClient();
const results = new Set();

// Strategy 1: Catch all events
strategyClient.on('*', (event, data) => {
  results.add('catch-all');
});

// Strategy 2: Catch all client events
strategyClient.on('client:*', (event, data) => {
  results.add('client-events');
});

// Strategy 3: Catch specific types
strategyClient.on('*:connected', (event, data) => {
  results.add('connected-events');
});

strategyClient.on('*:error', (event, data) => {
  results.add('error-events');
});

// Strategy 4: Multi-level wildcards
strategyClient.on('*:data:*', (event, data) => {
  results.add('data-sub-events');
});

// Emit various events
console.log('📡 Testing wildcard strategies:');
strategyClient.emit('client:connected');
strategyClient.emit('client:error', 'Connection failed');
strategyClient.emit('chart:data:update', { price: 50000 });
strategyClient.emit('quote:data:price', { price: 1.0850 });
strategyClient.emit('study:completed', { id: 'RSI' });

console.log(`✅ Matched strategies: ${Array.from(results).join(', ')}`);

// Example 4: Event Chaining and Composition
console.log('\n🔗 Example 4: Event Chaining and Composition');

const chainClient = createClient();

// Chain multiple event listeners
chainClient
  .on('step1', () => console.log('✅ Step 1: Initial event'))
  .on('step2', () => console.log('✅ Step 2: Secondary event'))
  .on('step3', () => console.log('✅ Step 3: Final event'));

// Chain chart operations with events
const chartChain = chainClient.createChart()
  .on('symbol_loaded', () => console.log('📊 Symbol loaded'))
  .on('data', () => console.log('📊 Data received'))
  .on('error', () => console.log('📊 Error occurred'))
  .setSymbol('BTCUSD')
  .setTimeframe('1D', 100);

console.log('✅ Set up chained event listeners and operations');

// Example 5: Event Filtering and Transformation
console.log('\n🔍 Example 5: Event Filtering and Transformation');

const filterClient = createClient();
const symbolFilter = ['BTCUSD', 'ETHUSD'];
const priceThreshold = 50000;

// Filter by symbol
filterClient.on('chart:*', (event, data) => {
  if (data && data.symbol && symbolFilter.includes(data.symbol)) {
    console.log(`📊 Filtered symbol: ${data.symbol} - ${event}`);
  }
});

// Filter by price threshold
filterClient.on('quote:*', (event, data) => {
  if (data && data.price && data.price > priceThreshold) {
    console.log(`💰 High price alert: ${data.symbol} @ $${data.price}`);
  }
});

// Transform data
filterClient.on('chart:update', (event, data) => {
  const transformed = {
    timestamp: Date.now(),
    symbol: data?.symbol || 'Unknown',
    event: event,
    processed: true
  };
  console.log('🔄 Transformed event:', transformed);
});

// Emit test events
console.log('📡 Testing event filters:');
filterClient.emit('chart:update', { symbol: 'BTCUSD', price: 51000 });
filterClient.emit('chart:update', { symbol: 'DOGEUSD', price: 0.08 });
filterClient.emit('quote:price', { symbol: 'BTCUSD', price: 52000 });
filterClient.emit('quote:price', { symbol: 'LTCUSD', price: 75 });

// Example 6: Event Aggregation and Analytics
console.log('\n📊 Example 6: Event Aggregation and Analytics');

const analyticsClient = createClient();
const analytics = {
  eventCounts: {},
  symbolCounts: {},
  errorCounts: {},
  lastEvents: []
};

// Count all events
analyticsClient.on('*', (event, data) => {
  analytics.eventCounts[event] = (analytics.eventCounts[event] || 0) + 1;

  // Track last 10 events
  analytics.lastEvents.push({
    event,
    timestamp: Date.now(),
    hasData: !!data
  });

  if (analytics.lastEvents.length > 10) {
    analytics.lastEvents.shift();
  }
});

// Count symbols
analyticsClient.on('chart:*', (event, data) => {
  if (data && data.symbol) {
    analytics.symbolCounts[data.symbol] = (analytics.symbolCounts[data.symbol] || 0) + 1;
  }
});

// Count errors
analyticsClient.on('*:*error*', (event, data) => {
  analytics.errorCounts[event] = (analytics.errorCounts[event] || 0) + 1;
});

// Emit test events for analytics
console.log('📡 Generating events for analytics:');
const testEvents = [
  'chart:update',
  'chart:update',
  'chart:symbol_loaded',
  'quote:price',
  'quote:price',
  'quote:error',
  'client:connected',
  'study:completed'
];

testEvents.forEach((event, index) => {
  const symbol = ['BTCUSD', 'ETHUSD', 'EURUSD'][index % 3];
  const data = event.includes('chart') ? { symbol } : event.includes('quote') ? { symbol, price: 50000 + index } : null;
  analyticsClient.emit(event, data);
});

console.log('📊 Analytics Results:');
console.log(`   - Event counts: ${JSON.stringify(analytics.eventCounts)}`);
console.log(`   - Symbol counts: ${JSON.stringify(analytics.symbolCounts)}`);
console.log(`   - Error counts: ${JSON.stringify(analytics.errorCounts)}`);
console.log(`   - Last events: ${analytics.lastEvents.length}`);

// Example 7: Custom Event Emitters
console.log('\n🎨 Example 7: Custom Event Emitters');

class TradingBot extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.position = null;
  }

  buy(symbol, amount, price) {
    this.position = { symbol, amount, price, side: 'buy' };
    this.emit('trade:executed', {
      type: 'buy',
      symbol,
      amount,
      price,
      timestamp: Date.now()
    });

    this.emit('position:opened', this.position);
  }

  sell(symbol, amount, price) {
    this.position = { symbol, amount, price, side: 'sell' };
    this.emit('trade:executed', {
      type: 'sell',
      symbol,
      amount,
      price,
      timestamp: Date.now()
    });

    this.emit('position:closed', this.position);
  }

  priceAlert(symbol, price, threshold) {
    if (price >= threshold) {
      this.emit('alert:price_high', { symbol, price, threshold });
    }
  }
}

// Create trading bot instances
const bot1 = new TradingBot('ScalperBot');
const bot2 = new TradingBot('SwingBot');

// Set up bot event listeners
bot1.on('trade:executed', (trade) => {
  console.log(`🤖 ${bot1.name} executed ${trade.type}: ${trade.symbol} ${trade.amount} @ $${trade.price}`);
});

bot2.on('alert:price_high', (alert) => {
  console.log(`🚨 ${bot2.name} price alert: ${alert.symbol} reached $${alert.price}`);
});

// Execute bot operations
console.log('🤖 Running trading bots:');
bot1.buy('BTCUSD', 0.1, 50000);
bot1.sell('ETHUSD', 1.0, 3000);
bot2.priceAlert('BTCUSD', 51000, 50000);

// Example 8: Event Error Handling
console.log('\n⚠️ Example 8: Event Error Handling');

const errorClient = createClient();
const errorLog = [];

// Safe event handler
errorClient.on('test:safe', (data) => {
  try {
    if (data && data.error) {
      throw new Error('Test error in safe handler');
    }
    console.log('✅ Safe handler executed successfully');
  } catch (error) {
    errorLog.push({ event: 'test:safe', error: error.message });
    console.log('⚠️ Safe handler caught error:', error.message);
  }
});

// Unsafe event handler (will throw)
errorClient.on('test:unsafe', (data) => {
  if (data && data.error) {
    throw new Error('Test error in unsafe handler');
  }
  console.log('✅ Unsafe handler executed successfully');
});

// Emit test events
console.log('📡 Testing error handling:');
errorClient.emit('test:safe', { normal: 'data' });
errorClient.emit('test:safe', { error: true });
errorClient.emit('test:unsafe', { normal: 'data' });

// Note: The unsafe event will throw and not be caught by the EventEmitter
try {
  errorClient.emit('test:unsafe', { error: true });
} catch (error) {
  errorLog.push({ event: 'test:unsafe', error: error.message });
  console.log('⚠️ Caught unsafe error at top level:', error.message);
}

console.log(`📋 Error log: ${errorLog.length} errors logged`);

// Example 9: Event Performance Testing
console.log('\n⚡ Example 9: Event Performance Testing');

const perfClient = createClient();
const eventCount = 10000;
const startTime = Date.now();

// Set up a simple listener
perfClient.on('performance:test', (data) => {
  // Simple processing
  const result = data.value * 2;
});

// Emit many events
console.log(`📡 Emitting ${eventCount} events for performance test...`);
for (let i = 0; i < eventCount; i++) {
  perfClient.emit('performance:test', { value: i });
}

const endTime = Date.now();
const duration = endTime - startTime;
const eventsPerSecond = Math.round(eventCount / (duration / 1000));

console.log('⚡ Performance Results:');
console.log(`   - Events: ${eventCount}`);
console.log(`   - Duration: ${duration}ms`);
console.log(`   - Events/sec: ${eventsPerSecond.toLocaleString()}`);

// Example 10: Memory Management
console.log('\n🧹 Example 10: Memory Management and Cleanup');

const memoryClient = createClient();
const listeners = [];

// Create many listeners
for (let i = 0; i < 100; i++) {
  const handler = (data) => {
    // Simulate work
    return data.value * i;
  };

  memoryClient.on(`memory:test:${i}`, handler);
  listeners.push({ event: `memory:test:${i}`, handler });
}

console.log(`📝 Created ${listeners.length} event listeners`);

// Remove some listeners
const toRemove = listeners.slice(0, 50);
toRemove.forEach(({ event, handler }) => {
  memoryClient.off(event, handler);
});

console.log(`🗑️  Removed ${toRemove.length} event listeners`);
console.log(`✅ Remaining listeners: ${listeners.length - toRemove.length}`);

// Memory cleanup note: In real applications, always remove event listeners
// when they're no longer needed to prevent memory leaks

console.log('\n🎉 Event Patterns Deep Dive Complete!');
console.log('====================================');
console.log('✅ Basic event patterns');
console.log('✅ Hierarchical namespacing');
console.log('✅ Wildcard matching strategies');
console.log('✅ Event chaining and composition');
console.log('✅ Event filtering and transformation');
console.log('✅ Event aggregation and analytics');
console.log('✅ Custom event emitters');
console.log('✅ Error handling patterns');
console.log('✅ Performance optimization');
console.log('✅ Memory management');

console.log('\n📚 Event System Tips:');
console.log('   - Use specific event names when possible');
console.log('   - Leverage wildcards for related events');
console.log('   - Always remove listeners in cleanup');
console.log('   - Chain event setup with method chaining');
console.log('   - Use hierarchical naming for organization');
console.log('   - Implement error handling in event callbacks');
console.log('   - Monitor performance for high-frequency events');

console.log('\n🔗 Related examples:');
console.log('   - examples/basic-usage.cjs (introductory)');
console.log('   - examples/advanced-usage.cjs (comprehensive)');
console.log('   - examples/browser-demo.html (interactive)');
