// Node.js Example (CommonJS)
// Run with: node example-node.js

const { createClient, connect } = require("./dist/tvws.cjs");

console.log("🚀 TVWS Node.js Example");
console.log("Testing CommonJS build...");

// Test createClient
const client1 = createClient({
  server: "data", // Use data.tradingview.com
});

console.log("✅ Client created with createClient()");
console.log("Client type:", typeof client1);
console.log(
  "Has createChart method:",
  typeof client1.createChart === "function",
);

// Test connect function
const client2 = connect({
  server: "data",
});

console.log("✅ Client created with connect()");
console.log("Client type:", typeof client2);
console.log(
  "Has createQuote method:",
  typeof client2.createQuote === "function",
);

// Test chart session
try {
  const chart = client1.createChart();
  console.log("✅ Chart session created");
  console.log("Chart session type:", chart.sessionType);
  console.log("Chart session ID:", chart.id);
  console.log("Has setSymbol method:", typeof chart.setSymbol === "function");

  // Test quote session
  const quote = client2.createQuote();
  console.log("✅ Quote session created");
  console.log("Quote session type:", quote.sessionType);
  console.log("Quote session ID:", quote.id);
  console.log("Has addSymbol method:", typeof quote.addSymbol === "function");
} catch (error) {
  console.error("❌ Error creating sessions:", error.message);
}

console.log("\n📦 CommonJS build test completed!");
console.log("File size check: dist/tvws.cjs");

// Show file size
const fs = require("fs");
try {
  const stats = fs.statSync("./dist/tvws.cjs");
  console.log(`Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (err) {
  console.log("Could not read file size");
}
