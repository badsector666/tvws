// Node.js ESM Example
// Run with: node example-esm.mjs or bun run example-esm.mjs

import {
  createClient,
  connect,
  TVWSClient,
  ChartSession,
} from "./dist/tvws.esm.js";

console.log("🚀 TVWS ESM Example");
console.log("Testing ES Module build...");

// Test createClient function
const client1 = createClient({
  server: "data",
});

console.log("✅ Client created with createClient()");
console.log("Client type:", typeof client1);
console.log("Is TVWSClient instance:", client1 instanceof TVWSClient);
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
  console.log("Is ChartSession instance:", chart instanceof ChartSession);
  console.log("Has setSymbol method:", typeof chart.setSymbol === "function");

  // Test quote session
  const quote = client2.createQuote();
  console.log("✅ Quote session created");
  console.log("Quote session type:", quote.sessionType);
  console.log("Quote session ID:", quote.id);
  console.log("Has addSymbol method:", typeof quote.addSymbol === "function");

  // Test event listeners
  let eventCount = 0;
  client1.on("client:connected", () => {
    eventCount++;
    console.log("✅ Connected event received");
  });

  client1.on("client:error", (error) => {
    eventCount++;
    console.log("✅ Error event received:", error.message || error);
  });

  console.log("Event listeners added");
} catch (error) {
  console.error("❌ Error creating sessions:", error.message);
}

console.log("\n📦 ESM build test completed!");
console.log("File size check: dist/tvws.esm.js");

// Show file size
import fs from "fs";
try {
  const stats = fs.statSync("./dist/tvws.esm.js");
  console.log(`Bundle size: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (err) {
  console.log("Could not read file size");
}
