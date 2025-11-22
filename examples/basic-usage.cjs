// Basic TVWS Usage Examples
// Simple, focused examples for getting started
// Run with: node examples/basic-usage.cjs

const { createClient, connect, EventEmitter } = require('../dist/tvws.cjs');

console.log('🚀 TVWS Basic Usage Examples');
console.log('=============================');

// Example 1: Simple Client Creation
console.log('\n📡 Example 1: Client Creation');
const client = createClient();
console.log('✅ Client created');

// Example 2: Different Ways to Create Clients
console.log('\n📡 Example 2: Multiple Client Creation Methods');
const client1 = createClient();
const client2 = createClient({ server: 'data' });
const client3 = connect();
console.log('✅ Three clients created with different methods');

// Example 3: Basic Chart Session
console.log('\n📊 Example 3: Basic Chart Session');
const chart = client1.createChart();
console.log(`✅ Chart created - ID: ${chart.id}, Type: ${chart.sessionType}`);

// Example 4: Symbol and Timeframe Setup
console.log('\n📊 Example 4: Setting Symbol and Timeframe');
chart
  .setSymbol('BTCUSD', { adjustment: 'splits' })
  .setTimeframe('1D', 100);
console.log('✅ Chart configured for BTCUSD 1D timeframe');

// Example 5: Basic Quote Session
console.log('\n💰 Example 5: Basic Quote Session');
const quote = client2.createQuote();
console.log(`✅ Quote session created - ID: ${quote.id}`);

// Example 6: Adding Symbols to Quote Session
console.log('\n💰 Example 6: Adding Quote Symbols');
quote
  .addSymbol('EURUSD')
  .addSymbol('GBPUSD')
  .addSymbol('USDJPY');
console.log('✅ Added 3 forex pairs to quote session');

// Example 7: Basic Event Handling
console.log('\n📢 Example 7: Basic Event Handling');
let eventCount = 0;

client3.on('client:connected', () => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Client connected`);
});

client3.on('client:error', (error) => {
  eventCount++;
  console.log(`✅ Event ${eventCount}: Client error - ${error.message || error}`);
});

// Emit a test event
client3.emit('custom:test', 'Hello TVWS!');
console.log('✅ Set up event listeners and sent test event');

// Example 8: Session Event Handling
console.log('\n📢 Example 8: Session Event Handling');
const eventChart = createClient().createChart();

eventChart.on('data', (event, data) => {
  console.log('✅ Chart data event received:', event);
});

eventChart.on('error', (error) => {
  console.log('✅ Chart error event received:', error);
});

console.log('✅ Set up chart event listeners');

// Example 9: Study Session
console.log('\n📈 Example 9: Basic Study Session');
const studyChart = createClient().createChart();
const rsiStudy = studyChart.attachStudy({
  name: 'Relative Strength Index',
  inputs: { length: 14 }
});

console.log(`✅ RSI Study attached - ID: ${rsiStudy.studyId}`);

// Example 10: Multiple Timeframes
console.log('\n📊 Example 10: Multiple Timeframes');
const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

timeframes.forEach((tf, index) => {
  const tfChart = createClient().createChart();
  tfChart.setSymbol('BTCUSD').setTimeframe(tf, 200);
  console.log(`✅ Chart ${index + 1}: ${tf} timeframe`);
});

// Example 11: EventEmitter Standalone
console.log('\n📢 Example 11: Standalone EventEmitter');
const emitter = new EventEmitter();

emitter.on('test', (data) => {
  console.log('✅ Standalone event received:', data);
});

emitter.emit('test', 'Hello from standalone emitter!');

// Example 12: Event Pattern Matching
console.log('\n📢 Example 12: Event Pattern Matching');
const patternClient = createClient();

// Exact match
patternClient.on('chart:update', (data) => {
  console.log('✅ Exact match: chart:update');
});

// Wildcard match
patternClient.on('chart:*', (event, data) => {
  console.log('✅ Wildcard match:', event);
});

// Double wildcard match
patternClient.on('*:*', (event, data) => {
  console.log('✅ Double wildcard match:', event);
});

patternClient.emit('chart:update', { symbol: 'BTCUSD' });
patternClient.emit('quote:price', { symbol: 'EURUSD' });

// Example 13: Method Chaining
console.log('\n🔗 Example 13: Method Chaining');
const chainedChart = createClient()
  .createChart()
  .setSymbol('ETHUSD')
  .setTimeframe('1h', 500);

console.log(`✅ Chained chart created - ID: ${chainedChart.id}`);

const chainedQuote = createClient()
  .createQuote()
  .addSymbol('AAPL')
  .addSymbol('GOOGL')
  .addSymbol('MSFT')
  .setFields(['price', 'volume', 'change']);

console.log(`✅ Chained quote created with 3 stocks`);

// Example 14: Data Retrieval
console.log('\n📊 Example 14: Data Retrieval Methods');
const dataChart = createClient().createChart();
const dataQuote = createClient().createQuote();

// Set up some dummy data
dataChart.setSymbol('BTCUSD').setTimeframe('1D', 100);
dataQuote.addSymbol('EURUSD');

// Test retrieval methods
const chartInfos = dataChart.getInfos();
const chartPrices = dataChart.getLatestPrices();
const quoteSymbols = dataQuote.getAllSymbols();
const quoteStatus = dataQuote.getQuoteStatus('EURUSD');

console.log(`✅ Chart infos: ${Object.keys(chartInfos || {}).length} properties`);
console.log(`✅ Chart prices: ${chartPrices.length} data points`);
console.log(`✅ Quote symbols: ${quoteSymbols.length} symbols`);
console.log(`✅ Quote status: ${quoteStatus?.status || 'unknown'}`);

// Example 15: Cleanup
console.log('\n🧹 Example 15: Session Cleanup');
const tempChart = createClient().createChart();
const tempQuote = createClient().createQuote();

console.log(`✅ Temporary chart: ${tempChart.id}`);
console.log(`✅ Temporary quote: ${tempQuote.id}`);

// In real usage, you would clean up:
// tempChart.delete();
// tempQuote.delete();
console.log('✅ Ready for cleanup (delete() would be called here)');

// Summary
console.log('\n🎉 Basic Examples Complete!');
console.log('================================');
console.log('✅ Client creation');
console.log('✅ Chart sessions');
console.log('✅ Quote sessions');
console.log('✅ Study sessions');
console.log('✅ Event handling');
console.log('✅ Method chaining');
console.log('✅ Data retrieval');
console.log('✅ Pattern matching');

console.log('\n📚 Ready for advanced examples:');
console.log('   - node examples/advanced-usage.cjs');
console.log('   - node examples/event-patterns.cjs');
console.log('   - Open examples/browser-demo.html');
