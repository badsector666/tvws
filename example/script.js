// TradingView WebSocket Example - Complete Functionality
// Using dynamic import to avoid Bun bundler issues with external CDN modules
let connection = null;
let tvwsModule = null;

// Dynamic import function to load tvws from CDN
async function loadTvwsModule() {
  if (tvwsModule) return tvwsModule;

  try {
    // Try CDN first
    tvwsModule = await import("https://unpkg.com/tvws@0.0.5/dist/index.js");
    console.log("Loaded tvws from CDN successfully");
  } catch (cdnError) {
    console.warn("CDN import failed, trying local version:", cdnError);
    try {
      // Fallback to local development version
      tvwsModule = await import("../dist/index.js");
      console.log("Loaded tvws from local version successfully");
    } catch (localError) {
      console.error("Failed to load tvws from both CDN and local:", localError);
      throw new Error(
        "Unable to load tvws module. Please check your internet connection or run 'npm run build' first.",
      );
    }
  }

  return tvwsModule;
}

// Initialize all functions to make them available globally
console.log("Initializing TradingView WebSocket example...");

// Set up global functions immediately, don't wait for DOM
console.log("Setting up global functions immediately");
setupGlobalFunctions();

// Wait for DOM to be ready before setting up event listeners
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - Setting up event listeners");
  initializeEventListeners();
  initializeLogging();
  log("TradingView WebSocket Example initialized successfully!", "success");
});

// Function to set up all global functions
function setupGlobalFunctions() {
  try {
    // Make all functions globally available to HTML onclick handlers
    window.toggleAuthFields = function () {
      console.log("toggleAuthFields called via window");
      return toggleAuthFields();
    };

    window.showSessionHelp = function () {
      console.log("showSessionHelp called via window");
      return showSessionHelp();
    };

    window.hideSessionHelp = function () {
      console.log("hideSessionHelp called via window");
      return hideSessionHelp();
    };

    window.quickConnect = function () {
      console.log("quickConnect called via window");
      return quickConnect();
    };

    window.testConnection = function () {
      console.log("testConnection called via window");
      return testConnection();
    };

    window.loadData = function () {
      console.log("loadData called via window");
      return loadData();
    };

    window.clearResults = function () {
      console.log("clearResults called via window");
      return clearResults();
    };

    window.clearLog = function () {
      console.log("clearLog called via window");
      return clearLog();
    };

    window.selectPresetTicker = function () {
      console.log("selectPresetTicker called via window");
      return selectPresetTicker();
    };

    window.resetQueryForm = function () {
      console.log("resetQueryForm called via window");
      return resetQueryForm();
    };

    window.log = log;

    console.log("All global functions have been set up successfully");

    // Test that functions are accessible
    console.log("Testing function accessibility:");
    console.log(
      "- toggleAuthFields available:",
      typeof window.toggleAuthFields,
    );
    console.log("- quickConnect available:", typeof window.quickConnect);
    console.log("- loadData available:", typeof window.loadData);
  } catch (error) {
    console.error("Error setting up global functions:", error);
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Only add event listeners for elements that don't have onclick handlers
  const endpointSelect = document.getElementById("endpointSelect");
  if (endpointSelect) {
    endpointSelect.addEventListener("change", function () {
      log("Selected endpoint: " + this.value, "info");
    });
  }

  console.log("Event listeners initialized");
}

// Authentication helper functions
function toggleAuthFields() {
  try {
    console.log("toggleAuthFields called");

    // Wait for DOM if needed
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", toggleAuthFields);
      return;
    }

    const authToggle = document.getElementById("authToggle");
    const authFields = document.getElementById("authFields");

    if (!authToggle || !authFields) {
      console.error("Required elements not found:", { authToggle, authFields });
      log("Error: Authentication elements not found", "error");
      return;
    }

    if (authToggle.checked) {
      authFields.style.display = "block";
      log("Authentication enabled - please enter your session ID", "info");
    } else {
      authFields.style.display = "none";
      hideAuthStatus();
      log("Authentication disabled - will use unauthorized access", "info");
    }
  } catch (error) {
    console.error("Error in toggleAuthFields:", error);
    log("Error toggling authentication fields", "error");
  }
}

function showSessionHelp() {
  try {
    const sessionHelp = document.getElementById("sessionHelp");
    if (sessionHelp) {
      sessionHelp.style.display = "block";
      console.log("Session help shown");
    } else {
      console.error("Session help element not found");
    }
  } catch (error) {
    console.error("Error showing session help:", error);
  }
}

function hideSessionHelp() {
  try {
    const sessionHelp = document.getElementById("sessionHelp");
    if (sessionHelp) {
      sessionHelp.style.display = "none";
      console.log("Session help hidden");
    } else {
      console.error("Session help element not found");
    }
  } catch (error) {
    console.error("Error hiding session help:", error);
  }
}

function showAuthStatus(message, type) {
  const authStatus = document.getElementById("authStatus");
  authStatus.textContent = message;
  authStatus.className = `auth-status status ${type}`;
  authStatus.style.display = "block";
}

function hideAuthStatus() {
  document.getElementById("authStatus").style.display = "none";
}

function getAuthOptions() {
  const authToggle = document.getElementById("authToggle");
  const sessionId = document.getElementById("sessionId").value.trim();

  if (authToggle.checked && sessionId) {
    return { sessionId: sessionId };
  }
  return {};
}

// Quick Connect function - bypasses all options and uses most reliable settings
window.quickConnect = async function () {
  const quickConnectBtn = document.getElementById("quickConnectBtn");
  const connectBtn = document.getElementById("connectBtn");
  const candlesBtn = document.getElementById("candlesBtn");

  quickConnectBtn.disabled = true;
  quickConnectBtn.textContent = "Quick Connecting...";
  connectBtn.disabled = true;

  updateStatus("Quick connecting to most reliable endpoint...", "info");

  log("=== Quick Connect Started ===", "info");
  log("Using: data endpoint (most reliable)", "info");
  log("Authentication: DISABLED", "info");
  log(
    "WebSocket URL: https://data.tradingview.com/socket.io/websocket",
    "info",
  );

  try {
    // Load the tvws module dynamically
    const { connect, getCandles, ENDPOINTS } = await loadTvwsModule();
    log("✅ TVWS module loaded successfully", "success");

    connection = await connect({
      endpoint: "data",
      // No authentication - use unauthorized access
    });

    log("✅ Quick connection successful!", "success");
    log("🎉 Connected to TradingView - Ready to fetch data", "success");
    showAuthStatus(
      "✅ Quick Connect successful - using public data",
      "success",
    );

    updateStatus("Quick Connect successful! Ready to fetch data.", "success");

    // Enable data button
    candlesBtn.disabled = false;
    quickConnectBtn.textContent = "✅ Quick Connected";
    connectBtn.textContent = "Connected";

    // Subscribe to real-time events
    connection.subscribe((event) => {
      log(`📡 Real-time event: ${event.name}`, "info");
    });
  } catch (error) {
    const errorMessage =
      error?.message || error?.toString() || "Unknown error occurred";
    log(`❌ Quick Connect failed: ${errorMessage}`, "error");
    log(`Error details: ${JSON.stringify(error, null, 2)}`, "info");

    log("Quick Connect troubleshooting:", "warning");
    log("- Check your internet connection", "warning");
    log("- Try refreshing the page and trying again", "warning");
    log("- Some networks block WebSocket connections", "warning");
    log("- TradingView may be temporarily unavailable", "warning");

    updateStatus(`Quick Connect failed: ${errorMessage}`, "error");
    quickConnectBtn.disabled = false;
    quickConnectBtn.textContent = "🚀 Quick Connect (No Auth)";
    connectBtn.disabled = false;
  }
};

// Make functions globally available
async function testConnection() {
  console.log("testConnection called");

  // Wait for DOM if needed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", testConnection);
    return;
  }

  const connectBtn = document.getElementById("connectBtn");
  const candlesBtn = document.getElementById("candlesBtn");
  const selectedEndpoint = document.getElementById("endpointSelect").value;
  const authOptions = getAuthOptions();

  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  updateStatus(`Connecting to ${selectedEndpoint} endpoint...`, "info");

  log("=== Connection Test Started ===", "info");
  log(`Endpoint: ${selectedEndpoint}`);

  try {
    // Load the tvws module dynamically
    const { connect, getCandles, ENDPOINTS } = await loadTvwsModule();
    log("✅ TVWS module loaded successfully", "success");
    log(`WebSocket URL: ${ENDPOINTS[selectedEndpoint]}`);

    connection = await connect({
      endpoint: selectedEndpoint,
    });

    log("✅ WebSocket connection established!", "success");

    if (authOptions.sessionId) {
      showAuthStatus("✅ Authentication successful!", "success");
      log(
        "🎉 Authentication successful - premium data may be available",
        "success",
      );
    } else {
      showAuthStatus("✅ Connected with unauthorized access", "warning");
      log("⚠️ Connected without authentication - using public data", "warning");
    }

    updateStatus("Connected successfully! Ready to fetch data.", "success");

    // Enable data button
    candlesBtn.disabled = false;
    connectBtn.textContent = "Connected";

    // Subscribe to real-time events
    connection.subscribe((event) => {
      log(`📡 Real-time event: ${event.name}`, "info");
    });
  } catch (error) {
    // Extract proper error message
    const errorMessage =
      error?.message || error?.toString() || "Unknown error occurred";
    log(`❌ Connection failed: ${errorMessage}`, "error");
    log(`Error details: ${JSON.stringify(error, null, 2)}`, "info");

    if (authOptions.sessionId) {
      log("🔐 Authentication failed - possible reasons:", "warning");
      log("- Session ID expired or invalid", "warning");
      log("- CORS restrictions blocked authentication", "warning");
      log("- Browser security policies", "warning");
      log(
        "Try again without authentication or refresh your session ID",
        "info",
      );
      showAuthStatus(
        "❌ Authentication failed - try without auth or check session ID",
        "error",
      );
    } else {
      log("Connection failed - possible reasons:", "warning");
      log("- Network connectivity issues", "warning");
      log("- WebSocket blocked by browser/security policy", "warning");
      log("- TradingView endpoint temporarily unavailable", "warning");
      log(
        "Solution: Try a different endpoint or check your internet connection",
        "info",
      );
    }

    updateStatus(`Connection failed: ${error.message}`, "error");
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect to TradingView";
  }
}

async function loadData() {
  if (!connection) {
    log("❌ No active connection. Please connect first.", "error");
    return;
  }

  // Load the tvws module dynamically to ensure getCandles is available
  const { getCandles } = await loadTvwsModule();

  // Get custom parameters from the form
  const ticker = document.getElementById("tickerInput").value.trim();
  const timeframe = document.getElementById("timeframeSelect").value;
  const amount = parseInt(document.getElementById("amountInput").value);
  const extendedData = document.getElementById("extendedDataCheck").checked;
  const selectedEndpoint = document.getElementById("endpointSelect").value;

  // Validate inputs
  if (!ticker) {
    log("❌ Please enter a ticker symbol", "error");
    updateStatus("Please enter a ticker symbol", "error");
    return;
  }

  // Validate symbol/timeframe combination
  const validation = validateSymbolTimeframe(
    ticker,
    timeframe,
    selectedEndpoint,
  );
  if (validation.issues.length > 0) {
    log("⚠️ Potential Issues Detected:", "warning");
    validation.issues.forEach((issue) => log(`- ${issue}`, "warning"));
    log("💡 Suggestions:", "info");
    validation.suggestions.forEach((suggestion) =>
      log(`- ${suggestion}`, "info"),
    );
    log("Proceeding anyway...", "info");
  }

  if (amount < 1 || amount > 500) {
    log("❌ Number of K-Lines must be between 1 and 500", "error");
    updateStatus("Invalid number of K-Lines", "error");
    return;
  }

  const candlesBtn = document.getElementById("candlesBtn");
  const resultsDiv = document.getElementById("results");
  const candleDataDiv = document.getElementById("candleData");
  const resultsTitle = document.getElementById("resultsTitle");
  const queryInfo = document.getElementById("queryInfo");

  candlesBtn.disabled = true;
  candlesBtn.textContent = "Loading...";

  // Update UI to show what we're fetching
  const timeframeText = getTimeframeText(timeframe);
  resultsTitle.textContent = `${ticker} K-Line Data (${timeframeText})`;
  updateStatus(`Fetching ${ticker} data (${timeframeText})...`, "info");

  log("=== Data Fetch Started ===", "info");
  log(`Symbol: ${ticker}`);
  log(`Timeframe: ${timeframe} (${timeframeText})`);
  log(`Amount: ${amount} candles`);
  log(`Extended Data: ${extendedData ? "Enabled" : "Disabled"}`);
  log(`Endpoint: ${selectedEndpoint}`);

  try {
    const candles = await getCandles({
      connection,
      symbols: [ticker],
      amount: amount,
      timeframe: timeframe,
    });

    if (candles.length > 0 && candles[0].length > 0) {
      log(`✅ Successfully retrieved ${candles[0].length} candles`, "success");

      // Display query info
      queryInfo.innerHTML = `
                <strong>Query Parameters:</strong>
                Symbol: <code>${ticker}</code> |
                Timeframe: <code>${timeframe}</code> |
                Candles: <code>${amount}</code> |
                Received: <code>${candles[0].length}</code> |
                Endpoint: <code>${selectedEndpoint}</code>
            `;

      // Display candle data
      candleDataDiv.innerHTML = "";
      candles[0].forEach((candle, index) => {
        const date = new Date(candle.timestamp * 1000);
        const candleEl = document.createElement("div");
        candleEl.className = "candle-item";

        let candleHtml = `
                    <strong>Candle ${index + 1}:</strong> ${date.toLocaleString()} |
                    Open: ${candle.open.toFixed(5)} |
                    High: ${candle.high.toFixed(5)} |
                    Low: ${candle.low.toFixed(5)} |
                    Close: ${candle.close.toFixed(5)} |
                    Volume: ${candle.volume}
                `;

        // Add extended data if enabled
        if (extendedData && candle.vwap !== undefined) {
          candleHtml += ` | VWAP: ${candle.vwap.toFixed(5)}`;
        }
        if (extendedData && candle.trades !== undefined) {
          candleHtml += ` | Trades: ${candle.trades}`;
        }

        candleEl.innerHTML = candleHtml;
        candleDataDiv.appendChild(candleEl);
      });

      resultsDiv.style.display = "block";
      updateStatus(`✅ ${ticker} data loaded successfully!`, "success");
      log("✅ Data displayed in results section", "success");

      // Log price statistics
      const closes = candles[0].map((c) => c.close);
      const lastPrice = closes[closes.length - 1];
      const firstPrice = closes[0];
      const change = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
      const high = Math.max(...candles[0].map((c) => c.high));
      const low = Math.min(...candles[0].map((c) => c.low));

      log(`📊 Price Summary:`, "info");
      log(`   Last Price: ${lastPrice.toFixed(5)}`, "info");
      log(`   Change: ${change}%`, change >= 0 ? "success" : "warning");
      log(`   High: ${high.toFixed(5)}`, "info");
      log(`   Low: ${low.toFixed(5)}`, "info");
    } else {
      log("⚠️ No data received - possible reasons:", "warning");
      log("- Symbol not available on this endpoint", "warning");
      log("- Insufficient data for requested timeframe", "warning");
      log("- Symbol may be delisted or temporarily unavailable", "warning");
      log("- Try a different symbol or endpoint", "info");
      updateStatus(`No data available for ${ticker}.`, "warning");
    }
  } catch (error) {
    const errorMessage =
      error?.message || error?.toString() || "Unknown error occurred";
    log(`❌ Data fetch failed: ${errorMessage}`, "error");
    log("Troubleshooting tips:", "warning");

    // Specific troubleshooting based on error type
    if (
      errorMessage.includes("critical_error") ||
      errorMessage.includes("error")
    ) {
      log("🚨 Critical Error Detected:", "error");
      log(
        "- This usually means the symbol/timeframe is not supported",
        "error",
      );
      log("- Try these solutions:", "info");
      log("  • Use daily timeframe (1D) for crypto symbols", "info");
      log("  • Try forex symbols for intraday data (FX:EURUSD)", "info");
      log("  • Use prodata endpoint if you have premium access", "info");
      log("  • Try different crypto symbols (CRYPTO:BTCUSD)", "info");
    } else {
      log("- Check if the ticker symbol is correct", "warning");
      log("- Try a different timeframe (1D usually works)", "warning");
      log("- Some symbols require specific endpoints", "warning");
      log("- Check if the market is currently open for this symbol", "warning");
    }

    updateStatus(`Failed to fetch data: ${errorMessage}`, "error");
  } finally {
    // Always re-enable the button, regardless of success or failure
    candlesBtn.disabled = false;
    candlesBtn.textContent = "📊 Get K-Line Data";
    log("=== Data Fetch Completed ===", "info");
    log("🔄 You can try different settings and fetch again", "info");
  }
}

// Helper function to get readable timeframe text
function getTimeframeText(timeframe) {
  const timeframeMap = {
    "1m": "1 Minute",
    "3m": "3 Minutes",
    "5m": "5 Minutes",
    "15m": "15 Minutes",
    "30m": "30 Minutes",
    "45m": "45 Minutes",
    "1h": "1 Hour",
    "2h": "2 Hours",
    "3h": "3 Hours",
    "4h": "4 Hours",
    "1D": "1 Day",
    "1W": "1 Week",
    "1M": "1 Month",
  };
  return timeframeMap[timeframe] || timeframe;
}

// Function to validate if symbol/timeframe combination is likely to work
function validateSymbolTimeframe(ticker, timeframe, endpoint) {
  const issues = [];
  const suggestions = [];

  // Check for common crypto intraday limitations
  if (ticker.includes("BINANCE:") || ticker.includes("CRYPTO:")) {
    if (["1m", "3m", "5m", "15m", "30m", "45m"].includes(timeframe)) {
      if (endpoint === "data") {
        issues.push(
          "Crypto intraday data may not be available on free endpoint",
        );
        suggestions.push("Try timeframe: 1h, 4h, or 1D");
        suggestions.push("Or try endpoint: prodata (requires premium)");
      }
    }
  }

  // Check for stock market hours issues
  if (ticker.includes("NASDAQ:") || ticker.includes("NYSE:")) {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day === 0 || day === 6) {
      issues.push("Stock markets are closed on weekends");
      suggestions.push(
        "Try during market hours (Mon-Fri, 9:30 AM - 4:00 PM EST)",
      );
    } else if (hour < 10 || hour > 16) {
      issues.push(
        "Stock markets may be closed (outside 9:30 AM - 4:00 PM EST)",
      );
      suggestions.push("Try during market hours or use daily timeframe (1D)");
    }
  }

  return { issues, suggestions };
}

function clearResults() {
  // Wait for DOM if needed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", clearResults);
    return;
  }

  document.getElementById("results").style.display = "none";
  document.getElementById("candleData").innerHTML = "";
  updateStatus("Results cleared.", "info");
  log("Results cleared", "info");
}

function clearLog() {
  // Wait for DOM if needed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", clearLog);
    return;
  }

  document.getElementById("log").textContent = "";
}

// New functions for custom K-Line query interface
function selectPresetTicker() {
  const preset = document.getElementById("tickerPreset").value;
  if (preset) {
    document.getElementById("tickerInput").value = preset;
    log(`Selected preset ticker: ${preset}`, "info");
  }
}

function resetQueryForm() {
  // Wait for DOM if needed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resetQueryForm);
    return;
  }

  document.getElementById("tickerInput").value = "FX:EURUSD";
  document.getElementById("tickerPreset").value = "";
  document.getElementById("timeframeSelect").value = "1D";
  document.getElementById("amountInput").value = "10";
  document.getElementById("extendedDataCheck").checked = false;
  log("Query form reset to default values", "info");
}

function updateStatus(message, type = "info") {
  // Hide all status alerts first
  const allAlerts = ["status", "success", "error", "info", "warning"];
  allAlerts.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = "none";
      el.textContent = "";
    }
  });

  // Show the appropriate alert
  const statusEl = document.getElementById(type);
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.display = "block";
    statusEl.className = `alert ${type}`;
  }
}

function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);

  const logEl = document.getElementById("log");
  logEl.textContent += logMessage + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

// Function to initialize logging when DOM is ready
function initializeLogging() {
  log("TradingView WebSocket Example loaded", "success");
  log("Package: tvws v0.0.5 (Browser Compatible with CDN)", "info");
  log("Import method: Dynamic import (to avoid Bun bundler issues)", "info");
  log("CDN source: https://unpkg.com/tvws@0.0.5/dist/index.js", "info");
  log("Ready to connect!", "success");
  log("", "info");
  log("=== Instructions ===", "info");
  log("🚀 QUICK START:", "info");
  log('1. Click "🚀 Quick Connect" - bypasses all settings', "info");
  log("2. Configure your K-Line query below", "info");
  log('3. Click "📊 Get K-Line Data" once connected', "info");
  log("", "info");
  log("=== Advanced Options ===", "info");
  log("1. Select a WebSocket endpoint (recommended: data)", "info");
  log("2. Optional: Enable authentication and enter your session ID", "info");
  log('3. Click "Connect to TradingView"', "info");
  log("4. Configure your query parameters in the form below", "info");
  log('5. Click "📊 Get K-Line Data" once connected', "info");
  log("", "info");
  log("📊 K-Line Query Features:", "info");
  log("- Custom ticker symbols (e.g., BINANCE:BTCUSDT.P, FX:EURUSD)", "info");
  log("- Multiple timeframes: 1m to 1M", "info");
  log("- Adjustable number of candles (1-500)", "info");
  log("- Quick selection from popular tickers", "info");
  log("- Extended data option (VWAP, trades)", "info");
  log("- Price statistics and change calculations", "info");
  log("", "info");
  log("💡 Tips:", "info");
  log("- Use Quick Connect for fastest connection testing", "info");
  log("- The system will automatically try fallback endpoints", "info");
  log(
    "- Authentication provides access to premium data but may fail due to CORS",
    "info",
  );
  log("- If anything fails, try Quick Connect first", "info");
  log("- Try different timeframes if data is unavailable", "info");
  log("- Some symbols may require specific endpoints", "info");
  log("", "info");
  log("🔍 Popular Ticker Formats:", "info");
  log("- Crypto: BINANCE:BTCUSDT.P, CRYPTO:BTCUSD", "info");
  log("- Forex: FX:EURUSD, FX:GBPUSD", "info");
  log("- Stocks: NASDAQ:AAPL, NYSE:TSLA", "info");
  log("- Indices: INDEX:SPX, INDEX:DJI", "info");
  log("", "info");
}
