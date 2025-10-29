// TradingView WebSocket Example - Complete Functionality
// Using dynamic import to avoid Bun bundler issues with external CDN modules
let connection = null;
let tvwsModule = null;

// Enhanced logging system with level filtering
let currentLogLevel = "info"; // Default log level
let realtimeSubscription = null; // Track real-time subscription
let realtimeLoggingEnabled = false; // Toggle state

// Log level priorities
const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

// Dynamic import function to load tvws from CDN
async function loadTvwsModule() {
  if (tvwsModule) return tvwsModule;

  try {
    // Try CDN first
    tvwsModule = await import("https://unpkg.com/tvws@0.0.8/dist/index.js");
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

    window.log = log;
    window.setLogLevel = function () {
      console.log("setLogLevel called via window");
      return setLogLevel();
    };
    window.toggleRealtimeLogging = function () {
      console.log("toggleRealtimeLogging called via window");
      return toggleRealtimeLogging();
    };

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

    // Enable real-time event toggle
    enableRealtimeToggle();
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

    // Enable real-time event toggle
    enableRealtimeToggle();
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

  // Get parameters from the new form structure
  const symbols = getSymbolsFromTextarea();
  const selectedTimeframes = getSelectedTimeframes();
  const selectedEndpoint = document.getElementById("endpointSelect").value;

  // Performance tracking setup
  const performanceTracker = {
    startTime: performance.now(),
    endTime: null,
    totalRequests: symbols.length * selectedTimeframes.length,
    completedRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalCandlesReceived: 0,
    totalBytesReceived: 0,
    requestTimes: [],
    symbolPerformance: {},
    timeframePerformance: {},
    errors: [],
  };

  // Validate inputs
  if (symbols.length === 0) {
    log("❌ Please enter at least one symbol", "error");
    updateStatus("Please enter at least one symbol", "error");
    return;
  }

  if (selectedTimeframes.length === 0) {
    log("❌ Please select at least one timeframe", "error");
    updateStatus("Please select at least one timeframe", "error");
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
  resultsTitle.textContent = `K-Line Data (${symbols.length} symbols × ${selectedTimeframes.length} timeframes)`;
  updateStatus(
    `Fetching data for ${symbols.length} symbols across ${selectedTimeframes.length} timeframes...`,
    "info",
  );

  log("=== Data Fetch Started ===", "info");
  log(`Symbols: ${symbols.join(", ")}`);
  log(
    `Timeframes: ${selectedTimeframes.map((tf) => `${tf.timeframe} (${tf.amount} candles)`).join(", ")}`,
  );
  log(`Endpoint: ${selectedEndpoint}`);
  log(`Total requests: ${performanceTracker.totalRequests}`, "info");
  log(`Performance tracking enabled - measuring API response times`, "info");

  const allResults = [];
  let totalSuccessful = 0;
  let totalFailed = 0;

  try {
    // Process each symbol and timeframe combination
    for (const symbol of symbols) {
      // Initialize symbol performance tracking
      performanceTracker.symbolPerformance[symbol] = {
        requests: 0,
        successful: 0,
        failed: 0,
        totalCandles: 0,
        totalTime: 0,
        averageTime: 0,
      };

      for (const tf of selectedTimeframes) {
        // Initialize timeframe performance tracking
        if (!performanceTracker.timeframePerformance[tf.timeframe]) {
          performanceTracker.timeframePerformance[tf.timeframe] = {
            requests: 0,
            successful: 0,
            failed: 0,
            totalCandles: 0,
            totalTime: 0,
            averageTime: 0,
          };
        }

        const requestStartTime = performance.now();
        performanceTracker.symbolPerformance[symbol].requests++;
        performanceTracker.timeframePerformance[tf.timeframe].requests++;

        try {
          log(`Fetching ${symbol} ${tf.timeframe}...`, "info");

          // Validate symbol/timeframe combination
          const validation = validateSymbolTimeframe(
            symbol,
            tf.timeframe,
            selectedEndpoint,
          );
          if (validation.issues.length > 0) {
            log(`⚠️ ${symbol} ${tf.timeframe}:`, "warning");
            validation.issues.forEach((issue) =>
              log(`  - ${issue}`, "warning"),
            );
          }

          const candles = await getCandles({
            connection,
            symbols: [symbol],
            amount: tf.amount,
            timeframe: tf.timeframe,
          });

          const requestEndTime = performance.now();
          const requestTime = requestEndTime - requestStartTime;

          // Update performance metrics
          performanceTracker.requestTimes.push(requestTime);
          performanceTracker.completedRequests++;
          performanceTracker.symbolPerformance[symbol].totalTime += requestTime;
          performanceTracker.timeframePerformance[tf.timeframe].totalTime +=
            requestTime;

          if (candles.length > 0 && candles[0].length > 0) {
            const result = {
              symbol: symbol,
              timeframe: tf.timeframe,
              amount: tf.amount,
              candles: candles[0],
              success: true,
              requestTime: requestTime,
            };
            allResults.push(result);
            totalSuccessful++;

            // Update performance metrics for successful requests
            performanceTracker.successfulRequests++;
            performanceTracker.totalCandlesReceived += candles[0].length;
            performanceTracker.symbolPerformance[symbol].successful++;
            performanceTracker.symbolPerformance[symbol].totalCandles +=
              candles[0].length;
            performanceTracker.timeframePerformance[tf.timeframe].successful++;
            performanceTracker.timeframePerformance[
              tf.timeframe
            ].totalCandles += candles[0].length;

            // Estimate bytes received (rough calculation)
            const candleSize = JSON.stringify(candles[0]).length;
            performanceTracker.totalBytesReceived += candleSize;

            log(
              `✅ ${symbol} ${tf.timeframe}: ${candles[0].length} candles (${requestTime.toFixed(0)}ms)`,
              "success",
            );

            // Calculate and log price statistics
            const closes = candles[0].map((c) => c.close);
            const lastPrice = closes[closes.length - 1];
            const firstPrice = closes[0];
            const change = (
              ((lastPrice - firstPrice) / firstPrice) *
              100
            ).toFixed(2);
            const high = Math.max(...candles[0].map((c) => c.high));
            const low = Math.min(...candles[0].map((c) => c.low));

            log(
              `   Last: ${lastPrice.toFixed(5)} | Change: ${change}% | High: ${high.toFixed(5)} | Low: ${low.toFixed(5)}`,
              change >= 0 ? "success" : "warning",
            );
          } else {
            log(
              `⚠️ ${symbol} ${tf.timeframe}: No data received (${requestTime.toFixed(0)}ms)`,
              "warning",
            );
            allResults.push({
              symbol: symbol,
              timeframe: tf.timeframe,
              amount: tf.amount,
              candles: [],
              success: false,
              error: "No data received",
              requestTime: requestTime,
            });
            totalFailed++;

            // Update performance metrics for failed requests
            performanceTracker.failedRequests++;
            performanceTracker.symbolPerformance[symbol].failed++;
            performanceTracker.timeframePerformance[tf.timeframe].failed++;
          }
        } catch (error) {
          const requestEndTime = performance.now();
          const requestTime = requestEndTime - requestStartTime;
          const errorMessage =
            error?.message || error?.toString() || "Unknown error";

          log(
            `❌ ${symbol} ${tf.timeframe}: ${errorMessage} (${requestTime.toFixed(0)}ms)`,
            "error",
          );
          allResults.push({
            symbol: symbol,
            timeframe: tf.timeframe,
            amount: tf.amount,
            candles: [],
            success: false,
            error: errorMessage,
            requestTime: requestTime,
          });
          totalFailed++;

          // Update performance metrics for failed requests
          performanceTracker.failedRequests++;
          performanceTracker.symbolPerformance[symbol].failed++;
          performanceTracker.timeframePerformance[tf.timeframe].failed++;
          performanceTracker.errors.push({
            symbol: symbol,
            timeframe: tf.timeframe,
            error: errorMessage,
            requestTime: requestTime,
          });
        }
      }
    }

    // Finalize performance tracking
    performanceTracker.endTime = performance.now();
    performanceTracker.totalExecutionTime =
      performanceTracker.endTime - performanceTracker.startTime;

    // Calculate averages
    Object.keys(performanceTracker.symbolPerformance).forEach((symbol) => {
      const perf = performanceTracker.symbolPerformance[symbol];
      perf.averageTime = perf.requests > 0 ? perf.totalTime / perf.requests : 0;
    });

    Object.keys(performanceTracker.timeframePerformance).forEach(
      (timeframe) => {
        const perf = performanceTracker.timeframePerformance[timeframe];
        perf.averageTime =
          perf.requests > 0 ? perf.totalTime / perf.requests : 0;
      },
    );

    // Display results and performance metrics
    displayResults(
      allResults,
      symbols,
      selectedTimeframes,
      selectedEndpoint,
      totalSuccessful,
      totalFailed,
    );
    displayPerformanceMetrics(performanceTracker);

    updateStatus(
      `✅ Data fetch complete! ${totalSuccessful} successful, ${totalFailed} failed`,
      totalFailed > 0 ? "warning" : "success",
    );
    log(`=== Data Fetch Completed ===`, "info");
    log(
      `Summary: ${totalSuccessful} successful, ${totalFailed} failed requests`,
      totalFailed > 0 ? "warning" : "success",
    );
    log(
      `Total execution time: ${performanceTracker.totalExecutionTime.toFixed(0)}ms`,
      "info",
    );
  } catch (error) {
    const errorMessage =
      error?.message || error?.toString() || "Unknown error occurred";
    log(`❌ Critical error during data fetch: ${errorMessage}`, "error");
    updateStatus(`Failed to fetch data: ${errorMessage}`, "error");
  } finally {
    // Always re-enable the button, regardless of success or failure
    candlesBtn.disabled = false;
    candlesBtn.textContent = "📊 Get K-Line Data";
    log("🔄 You can try different settings and fetch again", "info");
  }
}

// New function to display results for multiple symbols and timeframes
function displayResults(
  results,
  symbols,
  timeframes,
  endpoint,
  totalSuccessful,
  totalFailed,
) {
  const resultsDiv = document.getElementById("results");
  const candleDataDiv = document.getElementById("candleData");
  const resultsTitle = document.getElementById("resultsTitle");
  const queryInfo = document.getElementById("queryInfo");

  // Display query info
  queryInfo.innerHTML = `
    <strong>Query Summary:</strong>
    ${symbols.length} symbols × ${timeframes.length} timeframes = ${symbols.length * timeframes.length} total requests |
    <span style="color: ${totalSuccessful > 0 ? "green" : "inherit"}">${totalSuccessful} successful</span> |
    <span style="color: ${totalFailed > 0 ? "orange" : "inherit"}">${totalFailed} failed</span> |
    Endpoint: <code>${endpoint}</code>
  `;

  // Group results by symbol
  const resultsBySymbol = {};
  results.forEach((result) => {
    if (!resultsBySymbol[result.symbol]) {
      resultsBySymbol[result.symbol] = [];
    }
    resultsBySymbol[result.symbol].push(result);
  });

  // Clear and populate results
  candleDataDiv.innerHTML = "";

  Object.entries(resultsBySymbol).forEach(([symbol, symbolResults]) => {
    const symbolSection = document.createElement("div");
    symbolSection.className = "symbol-section";

    let symbolHtml = `<h4>📈 ${symbol}</h4>`;

    symbolResults.forEach((result) => {
      const timeframeText = getTimeframeText(result.timeframe);

      if (result.success && result.candles.length > 0) {
        symbolHtml += `
          <div class="timeframe-result">
            <h5>${timeframeText} (${result.candles.length} candles)</h5>
            <div class="candle-summary">
        `;

        // Calculate summary statistics
        const closes = result.candles.map((c) => c.close);
        const lastPrice = closes[closes.length - 1];
        const firstPrice = closes[0];
        const change = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(
          2,
        );
        const high = Math.max(...result.candles.map((c) => c.high));
        const low = Math.min(...result.candles.map((c) => c.low));
        const volume = result.candles.reduce((sum, c) => sum + c.volume, 0);

        symbolHtml += `
          <div class="summary-stats">
            <span class="stat">Last: <strong>${lastPrice.toFixed(5)}</strong></span>
            <span class="stat ${change >= 0 ? "positive" : "negative"}">Change: <strong>${change}%</strong></span>
            <span class="stat">High: ${high.toFixed(5)}</span>
            <span class="stat">Low: ${low.toFixed(5)}</span>
            <span class="stat">Volume: ${volume.toLocaleString()}</span>
          </div>
        `;

        // Show first few candles as preview
        symbolHtml += `<div class="candle-preview">`;
        result.candles.slice(0, 3).forEach((candle, index) => {
          const date = new Date(candle.timestamp * 1000);
          symbolHtml += `
            <div class="candle-item">
              <strong>${date.toLocaleDateString()}:</strong>
              O:${candle.open.toFixed(3)} H:${candle.high.toFixed(3)} L:${candle.low.toFixed(3)} C:${candle.close.toFixed(3)} V:${candle.volume}
            </div>
          `;
        });

        if (result.candles.length > 3) {
          symbolHtml += `<div class="candle-more">... ${result.candles.length - 3} more candles</div>`;
        }

        symbolHtml += `</div></div>`;
      } else {
        symbolHtml += `
          <div class="timeframe-result error">
            <h5>${timeframeText} - Failed</h5>
            <div class="error-message">${result.error || "No data available"}</div>
          </div>
        `;
      }
    });

    symbolSection.innerHTML = symbolHtml;
    candleDataDiv.appendChild(symbolSection);
  });

  resultsDiv.style.display = "block";
  log("✅ Results displayed in organized format", "success");
}

// New function to display comprehensive performance metrics
function displayPerformanceMetrics(performanceTracker) {
  const performanceMetrics = document.getElementById("performanceMetrics");
  const performanceSummary = document.getElementById("performanceSummary");
  const performanceDetails = document.getElementById("performanceDetails");

  // Calculate statistics
  const avgRequestTime =
    performanceTracker.requestTimes.length > 0
      ? performanceTracker.requestTimes.reduce((a, b) => a + b, 0) /
        performanceTracker.requestTimes.length
      : 0;
  const minRequestTime =
    performanceTracker.requestTimes.length > 0
      ? Math.min(...performanceTracker.requestTimes)
      : 0;
  const maxRequestTime =
    performanceTracker.requestTimes.length > 0
      ? Math.max(...performanceTracker.requestTimes)
      : 0;
  const requestsPerSecond =
    performanceTracker.totalExecutionTime > 0
      ? (
          performanceTracker.completedRequests /
          (performanceTracker.totalExecutionTime / 1000)
        ).toFixed(2)
      : 0;
  const candlesPerSecond =
    performanceTracker.totalExecutionTime > 0
      ? (
          performanceTracker.totalCandlesReceived /
          (performanceTracker.totalExecutionTime / 1000)
        ).toFixed(2)
      : 0;
  const bytesPerSecond =
    performanceTracker.totalExecutionTime > 0
      ? (
          performanceTracker.totalBytesReceived /
          (performanceTracker.totalExecutionTime / 1000)
        ).toFixed(0)
      : 0;

  // Format bytes for display
  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Display summary
  performanceSummary.innerHTML = `
    <div class="performance-overview">
      <div class="perf-stat">
        <span class="perf-label">Total Time:</span>
        <span class="perf-value">${performanceTracker.totalExecutionTime.toFixed(0)}ms</span>
      </div>
      <div class="perf-stat">
        <span class="perf-label">Success Rate:</span>
        <span class="perf-value ${performanceTracker.successfulRequests / performanceTracker.totalRequests > 0.8 ? "good" : "warning"}">
          ${((performanceTracker.successfulRequests / performanceTracker.totalRequests) * 100).toFixed(1)}%
        </span>
      </div>
      <div class="perf-stat">
        <span class="perf-label">Requests/sec:</span>
        <span class="perf-value">${requestsPerSecond}</span>
      </div>
      <div class="perf-stat">
        <span class="perf-label">Candles/sec:</span>
        <span class="perf-value">${candlesPerSecond}</span>
      </div>
      <div class="perf-stat">
        <span class="perf-label">Data Received:</span>
        <span class="perf-value">${formatBytes(performanceTracker.totalBytesReceived)}</span>
      </div>
      <div class="perf-stat">
        <span class="perf-label">Avg Response:</span>
        <span class="perf-value">${avgRequestTime.toFixed(0)}ms</span>
      </div>
    </div>
  `;

  // Display detailed breakdown
  let detailsHtml = `
    <div class="performance-breakdown">
      <h4>📊 Performance Breakdown</h4>

      <div class="perf-section">
        <h5>Request Timing Statistics</h5>
        <div class="perf-grid">
          <div class="perf-item">
            <span class="perf-small-label">Fastest:</span>
            <span class="perf-small-value">${minRequestTime.toFixed(0)}ms</span>
          </div>
          <div class="perf-item">
            <span class="perf-small-label">Slowest:</span>
            <span class="perf-small-value">${maxRequestTime.toFixed(0)}ms</span>
          </div>
          <div class="perf-item">
            <span class="perf-small-label">Average:</span>
            <span class="perf-small-value">${avgRequestTime.toFixed(0)}ms</span>
          </div>
          <div class="perf-item">
            <span class="perf-small-label">Total Requests:</span>
            <span class="perf-small-value">${performanceTracker.totalRequests}</span>
          </div>
        </div>
      </div>

      <div class="perf-section">
        <h5>Symbol Performance</h5>
        <div class="perf-table">
          ${Object.entries(performanceTracker.symbolPerformance)
            .map(
              ([symbol, perf]) => `
            <div class="perf-row">
              <span class="symbol-name">${symbol}</span>
              <span class="perf-requests">${perf.requests} req</span>
              <span class="perf-success ${perf.successful === perf.requests ? "good" : "partial"}">${perf.successful}/${perf.requests}</span>
              <span class="perf-time">${perf.averageTime.toFixed(0)}ms avg</span>
              <span class="perf-candles">${perf.totalCandles} candles</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <div class="perf-section">
        <h5>Timeframe Performance</h5>
        <div class="perf-table">
          ${Object.entries(performanceTracker.timeframePerformance)
            .map(
              ([timeframe, perf]) => `
            <div class="perf-row">
              <span class="timeframe-name">${timeframe}</span>
              <span class="perf-requests">${perf.requests} req</span>
              <span class="perf-success ${perf.successful === perf.requests ? "good" : "partial"}">${perf.successful}/${perf.requests}</span>
              <span class="perf-time">${perf.averageTime.toFixed(0)}ms avg</span>
              <span class="perf-candles">${perf.totalCandles} candles</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
  `;

  // Add error details if any
  if (performanceTracker.errors.length > 0) {
    detailsHtml += `
      <div class="perf-section error-section">
        <h5>❌ Error Details (${performanceTracker.errors.length})</h5>
        <div class="error-list">
          ${performanceTracker.errors
            .slice(0, 5)
            .map(
              (error) => `
            <div class="error-item">
              <span class="error-symbol">${error.symbol} ${error.timeframe}:</span>
              <span class="error-text">${error.error}</span>
              <span class="error-time">(${error.requestTime.toFixed(0)}ms)</span>
            </div>
          `,
            )
            .join("")}
          ${performanceTracker.errors.length > 5 ? `<div class="error-more">... ${performanceTracker.errors.length - 5} more errors</div>` : ""}
        </div>
      </div>
    `;
  }

  detailsHtml += `</div>`;
  performanceDetails.innerHTML = detailsHtml;

  // Show the performance section
  performanceMetrics.style.display = "block";

  log("✅ Performance metrics displayed", "success");
  log(
    `📊 Performance Summary: ${performanceTracker.totalRequests} requests, ${avgRequestTime.toFixed(0)}ms avg, ${requestsPerSecond} req/sec`,
    "info",
  );
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

// Helper function to parse symbols from textarea
function getSymbolsFromTextarea() {
  const textarea = document.getElementById("symbolsTextarea");
  if (!textarea) return [];

  const symbols = textarea.value
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return symbols;
}

// Helper function to get selected timeframes with their amounts
function getSelectedTimeframes() {
  const checkboxes = document.querySelectorAll(
    '.timeframe-item input[type="checkbox"]:checked',
  );
  const timeframes = [];

  checkboxes.forEach((checkbox) => {
    const timeframe = checkbox.value;
    const amountInput = document.querySelector(
      `.timeframe-amount[data-timeframe="${timeframe}"]`,
    );
    const amount = amountInput ? parseInt(amountInput.value) : 100;

    timeframes.push({
      timeframe: timeframe,
      amount: amount,
    });
  });

  return timeframes;
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
  // Map existing types to log levels
  const typeToLevel = {
    info: "info",
    success: "info",
    warning: "warn",
    error: "error",
  };

  const level = typeToLevel[type] || "info";

  // Filter based on log level
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLogLevel]) {
    return; // Skip this log message
  }

  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);

  const logEl = document.getElementById("log");
  if (logEl) {
    logEl.textContent += logMessage + "\n";
    logEl.scrollTop = logEl.scrollHeight;
  }
}

// Enhanced log level management functions
function setLogLevel() {
  const select = document.getElementById("logLevelSelect");
  if (select) {
    currentLogLevel = select.value;
    log(`Log level changed to: ${currentLogLevel.toUpperCase()}`, "info");
  }
}

// Real-time event logging management
function enableRealtimeLogging() {
  if (!connection || realtimeSubscription) {
    return;
  }

  realtimeSubscription = connection.subscribe((event) => {
    // Only log if debug level or lower, and filter out "du" events at info level
    if (LOG_LEVELS[currentLogLevel] <= LOG_LEVELS["debug"]) {
      log(`📡 Real-time event: ${event.name}`, "debug");
    } else if (
      event.name !== "du" &&
      LOG_LEVELS[currentLogLevel] <= LOG_LEVELS["info"]
    ) {
      log(`📡 Real-time event: ${event.name}`, "info");
    }
  });

  realtimeLoggingEnabled = true;
  log("✅ Real-time event logging enabled", "info");
}

function disableRealtimeLogging() {
  if (realtimeSubscription) {
    realtimeSubscription();
    realtimeSubscription = null;
  }

  realtimeLoggingEnabled = false;
  log("⏸️ Real-time event logging disabled", "info");
}

function toggleRealtimeLogging() {
  if (realtimeLoggingEnabled) {
    disableRealtimeLogging();
  } else {
    enableRealtimeLogging();
  }

  // Update toggle button state
  const toggleBtn = document.getElementById("realtimeToggleBtn");
  if (toggleBtn) {
    toggleBtn.textContent = realtimeLoggingEnabled
      ? "⏸️ Disable Real-time Events"
      : "▶️ Enable Real-time Events";
    toggleBtn.className = realtimeLoggingEnabled
      ? "btn btn-warning"
      : "btn btn-outline";
  }
}

// Enable real-time toggle button after connection
function enableRealtimeToggle() {
  const toggleBtn = document.getElementById("realtimeToggleBtn");
  if (toggleBtn) {
    toggleBtn.disabled = false;
  }
}

// Function to initialize logging when DOM is ready
function initializeLogging() {
  log("TradingView WebSocket Example loaded", "success");
  log("Package: tvws v0.0.8 (Browser Compatible with CDN)", "info");
  log("Import method: Dynamic import (to avoid Bun bundler issues)", "info");
  log("CDN source: https://unpkg.com/tvws@0.0.8/dist/index.js", "info");
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
  log("📊 Enhanced K-Line Query Features:", "info");
  log("- Multiple symbols: Enter unlimited symbols in the textarea", "info");
  log(
    "- Multiple timeframes: Select multiple timeframes with checkboxes",
    "info",
  );
  log("- Custom amounts: Set different candle amounts per timeframe", "info");
  log("- Flexible symbol formats (e.g., BINANCE:BTCUSDT.P, FX:EURUSD)", "info");
  log("- Comprehensive performance metrics and benchmarking", "info");
  log("- Organized results display with summary statistics", "info");
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
  log("🔍 Enhanced Usage Tips:", "info");
  log("- Enter multiple symbols, one per line in the textarea", "info");
  log("- Select multiple timeframes to compare data across periods", "info");
  log("- Set custom candle amounts optimized for each timeframe", "info");
  log(
    "- Default amounts: 1000 for minutes, 200 for hours, 30 for daily",
    "info",
  );
  log("- Popular ticker formats:", "info");
  log("  • Crypto: BINANCE:BTCUSDT.P, CRYPTO:BTCUSD", "info");
  log("  • Forex: FX:EURUSD, FX:GBPUSD", "info");
  log("  • Stocks: NASDAQ:AAPL, NYSE:TSLA", "info");
  log("  • Indices: INDEX:SPX, INDEX:DJI", "info");
  log("", "info");
}
