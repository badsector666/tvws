// Advanced TVWS Usage Example
// Comprehensive demonstration of all TVWS features
// Run with: node examples/advanced-usage.cjs

const { createClient, connect } = require('../dist/tvws.cjs');

console.log('🚀 TVWS Advanced Usage Example');
console.log('================================');

// ============================================================================
// 1. CLIENT CREATION AND CONFIGURATION
// ============================================================================

console.log('\n📡 1. Client Creation');

// Method 1: Using createClient with options
const client1 = createClient({
  server: 'data', // or '.charting', 'parser1', etc.
});

// Method 2: Using connect function (alias for createClient)
const client2 = connect({
  server: 'data'
});

// Method 3: Default client
const client3 = createClient();

console.log('✅ Created 3 client instances');
console.log('   - client1 (data server)');
console.log('   - client2 (data server)');
console.log('   - client3 (default server)');

// ============================================================================
// 2. EVENT SYSTEM DEMONSTRATION
// ============================================================================

console.log('\n📢 2. Event System');

let eventCounter = 0;

// Basic event listeners
client1.on('client:connected', () => {
  eventCounter++;
  console.log(`✅ Event ${eventCounter}: Connected to TradingView`);
});

client1.on('client:disconnected', () => {
  eventCounter++;
  console.log(`✅ Event ${eventCounter}: Disconnected from TradingView`);
});

client1.on('client:error', (error) => {
  eventCounter++;
  console.log(`✅ Event ${eventCounter}: Client error - ${error.message || error}`);
});

client1.on('client:ping', (pingId) => {
  eventCounter++;
  console.log(`✅ Event ${eventCounter}: Received ping ${pingId}`);
});

// Custom event testing
client1.on('custom:test', (data) => {
  eventCounter++;
  console.log(`✅ Event ${eventCounter}: Custom event - ${data}`);
});

// Test event emission
client1.emit('custom:test', 'Hello from custom event!');
console.log(`📡 Sent custom event, tracking ${eventCounter} events`);

// ============================================================================
// 3. CHART SESSION COMPREHENSIVE DEMO
// ============================================================================

console.log('\n📊 3. Chart Session Features');

// Create chart session
const chart = client1.createChart();
console.log(`✅ Chart session created: ${chart.id}`);
console.log(`   - Type: ${chart.sessionType}`);
console.log(`   - Has client: ${!!chart.client}`);

// Symbol configuration with various options
const symbolConfigs = [
  { symbol: 'BTCUSD', adjustment: 'splits', session: 'extended' },
  { symbol: 'ETHUSD', adjustment: 'dividends', session: 'regular' },
  { symbol: 'EURUSD', currency: 'USD' }
];

// Test different timeframes
const timeframes = ['1S', '1', '5', '15', '30', '60', '1D', '1W', '1M'];

symbolConfigs.forEach((config, index) => {
  console.log(`\n   📍 Chart ${index + 1}: ${config.symbol}`);

  // Create separate chart for each symbol
  const symbolChart = client1.createChart();

  // Set symbol with method chaining
  symbolChart
    .setSymbol(config.symbol, config)
    .setTimeframe(timeframes[index % timeframes.length], 500);

  console.log(`      - Symbol: ${config.symbol}`);
  console.log(`      - Timeframe: ${timeframes[index % timeframes.length]}`);
  console.log(`      - Chart ID: ${symbolChart.id}`);

  // Test chart data methods
  const infos = symbolChart.getInfos();
  const prices = symbolChart.getLatestPrices();

  console.log(`      - Has infos: ${Object.keys(infos || {}).length > 0}`);
  console.log(`      - Latest prices count: ${prices.length}`);
});

// ============================================================================
// 4. STUDY SESSION DEMONSTRATION
// ============================================================================

console.log('\n📈 4. Study Session Features');

// Study configurations
const studyConfigs = [
  {
    name: 'Volume',
    inputs: {},
    styles: {},
    precision: 2
  },
  {
    name: 'Moving Average Exponential',
    inputs: {
      length: 20,
      source: 'close'
    },
    styles: {},
    precision: 4
  },
  {
    name: 'Relative Strength Index',
    inputs: {
      length: 14
    },
    styles: {},
    precision: 2
  }
];

// Create chart and attach studies
const mainChart = client1.createChart();
console.log(`✅ Main chart for studies: ${mainChart.id}`);

studyConfigs.forEach((config, index) => {
  const study = mainChart.attachStudy(config);
  console.log(`📊 Study ${index + 1}: ${config.name}`);
  console.log(`   - Study ID: ${study.studyId}`);
  console.log(`   - Session ID: ${study.id}`);
  console.log(`   - Has getStudyData: ${typeof study.getStudyData === 'function'}`);

  // Get study data
  const studyData = study.getStudyData();
  console.log(`   - Study data points: ${studyData.length}`);
});

// Test study removal
const studies = mainChart.getStudies();
if (studies.length > 0) {
  const studyToRemove = studies[0];
  console.log(`🗑️  Removing study: ${studyToRemove.studyId}`);
  mainChart.removeStudy(studyToRemove.studyId);

  const remainingStudies = mainChart.getStudies();
  console.log(`   - Remaining studies: ${remainingStudies.length}`);
}

// ============================================================================
// 5. REPLAY SESSION DEMONSTRATION
// ============================================================================

console.log('\n⏮️  5. Replay Session Features');

// Create chart for replay
const replayChart = client1.createChart();
const replay = replayChart.createReplay();

console.log(`✅ Replay session created: ${replay.id}`);
console.log(`   - Type: ${replay.sessionType}`);

// Test replay controls
const replayTest = async () => {
  try {
    console.log('🎮 Testing replay controls...');

    // Test replay status
    const status = replay.replayStatus();
    console.log(`   - Initial status:`, status);

    // Test replay position
    const position = replay.replayPosition();
    console.log(`   - Current position: ${position}`);

    // Test replay speed control (these would normally interact with TradingView)
    replay.replaySpeed(1); // Normal speed
    console.log('   - Set replay speed to 1x');

    replay.replaySpeed(2); // 2x speed
    console.log('   - Set replay speed to 2x');

    // Test replay position
    replay.replayGo(1000); // Go to position 1000
    console.log('   - Sent replay go command to position 1000');

  } catch (error) {
    console.log(`   - Replay test error (expected): ${error.message}`);
  }
};

replayTest();

// ============================================================================
// 6. QUOTE SESSION DEMONSTRATION
// ============================================================================

console.log('\n💰 6. Quote Session Features');

// Create quote session
const quote = client2.createQuote();
console.log(`✅ Quote session created: ${quote.id}`);
console.log(`   - Type: ${quote.sessionType}`);

// Test multiple symbols
const forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];
const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'ADAUSD', 'SOLUSD'];
const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

// Add symbols with method chaining
console.log('\n📊 Adding Forex symbols:');
forexSymbols.forEach(symbol => {
  quote.addSymbol(symbol);
  const status = quote.getQuoteStatus(symbol);
  console.log(`   - ${symbol}: ${status?.status || 'unknown'}`);
});

console.log('\n📊 Adding Crypto symbols:');
cryptoSymbols.forEach(symbol => {
  quote.addSymbol(symbol);
  const status = quote.getQuoteStatus(symbol);
  console.log(`   - ${symbol}: ${status?.status || 'unknown'}`);
});

console.log('\n📊 Adding Stock symbols:');
stockSymbols.forEach(symbol => {
  quote.addSymbol(symbol);
  const status = quote.getQuoteStatus(symbol);
  console.log(`   - ${symbol}: ${status?.status || 'unknown'}`);
});

// Test quote fields configuration
const fields = [
  'ch', 'chp', 'current_session', 'description', 'local_description',
  'language', 'exchange', 'fractional', 'is_tradable', 'lp', 'lp_time',
  'original_name', 'price', 'currency_code', 'rch', 'rchp', 'rtc'
];

quote.setFields(fields);
console.log(`\n⚙️  Set ${fields.length} quote fields`);

// Test quote data retrieval
const allSymbols = quote.getAllSymbols();
console.log(`\n📋 Total symbols tracked: ${allSymbols.length}`);

// Get sample data for each symbol type
console.log('\n📊 Sample quote data:');
['EURUSD', 'BTCUSD', 'AAPL'].forEach(symbol => {
  const data = quote.getSymbolData(symbol);
  const status = quote.getQuoteStatus(symbol);
  console.log(`   - ${symbol}:`);
  console.log(`     Status: ${status?.status}`);
  console.log(`     Has data: ${Object.keys(data || {}).length > 0}`);
  if (data && Object.keys(data).length > 0) {
    console.log(`     Price: ${data.lp || data.price || 'N/A'}`);
    console.log(`     Change: ${data.ch || 'N/A'}`);
  }
});

// Test symbol removal
const symbolsToRemove = ['AUDUSD', 'ADAUSD'];
symbolsToRemove.forEach(symbol => {
  quote.removeSymbol(symbol);
  console.log(`🗑️  Removed symbol: ${symbol}`);
});

console.log(`\n📋 Symbols after removal: ${quote.getAllSymbols().length}`);

// ============================================================================
// 7. ADVANCED EVENT HANDLING
// ============================================================================

console.log('\n🎯 7. Advanced Event Handling');

// Test event chaining
const chainedClient = client3
  .on('test:chain1', () => console.log('   ✅ Chain event 1'))
  .on('test:chain2', () => console.log('   ✅ Chain event 2'))
  .on('test:chain3', () => console.log('   ✅ Chain event 3'));

console.log('✅ Set up chained event listeners');

// Test wildcard events
client3.on('chart:*', (event, data) => {
  console.log(`   🌟 Chart wildcard event: ${event}`);
});

client3.on('quote:*', (event, data) => {
  console.log(`   🌟 Quote wildcard event: ${event}`);
});

client3.on('*:*', (event, data) => {
  console.log(`   🌟 Double wildcard event: ${event}`);
});

// Emit test events
console.log('📡 Emitting test events:');
client3.emit('test:chain1');
client3.emit('test:chain2');
client3.emit('test:chain3');
client3.emit('chart:update', { symbol: 'BTCUSD' });
client3.emit('quote:price', { symbol: 'EURUSD', price: 1.0850 });
client3.emit('custom:event', 'wildcard test');

// ============================================================================
// 8. ERROR HANDLING AND EDGE CASES
// ============================================================================

console.log('\n⚠️  8. Error Handling and Edge Cases');

// Test invalid session operations
try {
  const invalidChart = client1.createChart();
  invalidChart.setSymbol('INVALID:SYMBOL:FORMAT');
  console.log('   ⚠️  Invalid symbol test - should handle gracefully');
} catch (error) {
  console.log(`   ✅ Caught expected error: ${error.message}`);
}

// Test duplicate session IDs (should auto-generate unique IDs)
const chart1 = client1.createChart();
const chart2 = client1.createChart();
const chart3 = client1.createChart();

console.log(`   ✅ Multiple charts created with unique IDs:`);
console.log(`      Chart 1: ${chart1.id}`);
console.log(`      Chart 2: ${chart2.id}`);
console.log(`      Chart 3: ${chart3.id}`);
console.log(`      All unique: ${new Set([chart1.id, chart2.id, chart3.id]).size === 3}`);

// ============================================================================
// 9. PERFORMANCE AND MEMORY TESTING
// ============================================================================

console.log('\n⚡ 9. Performance Testing');

const startTime = Date.now();
const iterations = 1000;

// Test many client creations
for (let i = 0; i < 10; i++) {
  const testClient = createClient();
  const testChart = testClient.createChart();
  const testQuote = testClient.createQuote();

  // Test many operations
  for (let j = 0; j < iterations / 10; j++) {
    testChart.setSymbol(`TEST${j}`, { session: 'regular' });
    testChart.setTimeframe('1D', 100);
    testQuote.addSymbol(`TEST${j}`);
  }
}

const endTime = Date.now();
const duration = endTime - startTime;

console.log(`   ⚡ Performance test completed:`);
console.log(`      - 10 clients created`);
console.log(`      - ${iterations} total operations`);
console.log(`      - Duration: ${duration}ms`);
console.log(`      - Ops/sec: ${Math.round(iterations / (duration / 1000))}`);

// ============================================================================
// 10. CLEANUP AND RESOURCE MANAGEMENT
// ============================================================================

console.log('\n🧹 10. Resource Management');

// Collect all created sessions for cleanup
const allCharts = [chart, mainChart, replayChart, ...Array.from({ length: 3 }, (_, i) => client1.createChart())];
const allQuotes = [quote, ...Array.from({ length: 2 }, (_, i) => client2.createQuote())];
const allReplays = [replay];

console.log(`   📊 Sessions to clean up:`);
console.log(`      - Charts: ${allCharts.length}`);
console.log(`      - Quotes: ${allQuotes.length}`);
console.log(`      - Replays: ${allReplays.length}`);

// Test session deletion (in real usage, you'd do this when done)
console.log('   🗑️  Cleaning up sessions...');
allCharts.forEach((chart, index) => {
  try {
    // chart.delete(); // Commented out to avoid actual deletion in demo
    console.log(`      ✅ Chart ${index + 1} ready for cleanup`);
  } catch (error) {
    console.log(`      ❌ Chart ${index + 1} cleanup error: ${error.message}`);
  }
});

allQuotes.forEach((quote, index) => {
  try {
    // quote.delete(); // Commented out to avoid actual deletion in demo
    console.log(`      ✅ Quote ${index + 1} ready for cleanup`);
  } catch (error) {
    console.log(`      ❌ Quote ${index + 1} cleanup error: ${error.message}`);
  }
});

allReplays.forEach((replay, index) => {
  try {
    // replay.delete(); // Commented out to avoid actual deletion in demo
    console.log(`      ✅ Replay ${index + 1} ready for cleanup`);
  } catch (error) {
    console.log(`      ❌ Replay ${index + 1} cleanup error: ${error.message}`);
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n🎉 ADVANCED USAGE DEMO COMPLETE');
console.log('================================');
console.log('✅ Client creation and configuration');
console.log('✅ Event system with wildcards and chaining');
console.log('✅ Chart sessions with symbols and timeframes');
console.log('✅ Study sessions with technical indicators');
console.log('✅ Replay sessions for historical data');
console.log('✅ Quote sessions for real-time prices');
console.log('✅ Advanced event handling patterns');
console.log('✅ Error handling and edge cases');
console.log('✅ Performance testing');
console.log('✅ Resource management and cleanup');

console.log('\n📊 Session Summary:');
console.log(`   - Total clients created: 3+`);
console.log(`   - Chart sessions: ${allCharts.length}+`);
console.log(`   - Quote sessions: ${allQuotes.length}+`);
console.log(`   - Study sessions: ${studyConfigs.length}`);
console.log(`   - Replay sessions: ${allReplays.length}`);
console.log(`   - Events tracked: ${eventCounter}`);

console.log('\n💡 Next Steps:');
console.log('   - Try real connection with valid credentials');
console.log('   - Implement your custom event handlers');
console.log('   - Build trading algorithms with real-time data');
console.log('   - Create custom studies and indicators');

console.log('\n🔗 See also:');
console.log('   - examples/basic-usage.cjs (simplified examples)');
console.log('   - examples/browser-demo.html (interactive UI)');
console.log('   - examples/event-patterns.cjs (event system deep dive)');
