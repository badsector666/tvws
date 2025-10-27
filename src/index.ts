const MAX_BATCH_SIZE = 5000; // found experimentally

type Subscriber = (event: TradingviewEvent) => void;
type Unsubscriber = () => void;

type MessageType = "ping" | "session" | "event";

interface RawCandle {
  i: number;
  v: number[];
}

export interface Candle {
  timestamp: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

interface MessagePayload {
  type: MessageType;
  data: any;
}

interface TradingviewConnection {
  subscribe: (handler: Subscriber) => Unsubscriber;
  send: (name: string, params: any[]) => void;
  close: () => Promise<void>;
}

interface ConnectionOptions {
  sessionId?: string;
  endpoint?: string;
}

interface TradingviewEvent {
  name: string;
  params: any[];
}

type TradingviewTimeframe =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "45"
  | "60"
  | "120"
  | "180"
  | "240"
  | "1D"
  | "1W"
  | "1M";

// Allow flexible timeframe input for better user experience
type FlexibleTimeframe = TradingviewTimeframe | number;

/**
 * Validates and normalizes timeframe input to TradingView API format
 * @param timeframe - The timeframe to validate (can be number or various string formats)
 * @returns Valid TradingView timeframe string
 * @throws Error if timeframe format is invalid
 */
function validateTimeframe(timeframe: FlexibleTimeframe): TradingviewTimeframe {
  // If already a valid timeframe string, return as is
  const validTimeframes: TradingviewTimeframe[] = [
    "1",
    "3",
    "5",
    "15",
    "30",
    "45",
    "60",
    "120",
    "180",
    "240",
    "1D",
    "1W",
    "1M",
  ];

  if (
    typeof timeframe === "string" &&
    validTimeframes.includes(timeframe as TradingviewTimeframe)
  ) {
    return timeframe as TradingviewTimeframe;
  }

  // Convert numeric timeframes to string
  if (typeof timeframe === "number") {
    const timeframeStr = timeframe.toString();
    if (validTimeframes.includes(timeframeStr as TradingviewTimeframe)) {
      return timeframeStr as TradingviewTimeframe;
    }
  }

  // Convert common invalid string formats to valid ones
  if (typeof timeframe === "string") {
    const timeframeMap: Record<string, TradingviewTimeframe> = {
      "1m": "1",
      "3m": "3",
      "5m": "5",
      "15m": "15",
      "30m": "30",
      "45m": "45",
      "1h": "60",
      "2h": "120",
      "3h": "180",
      "4h": "240",
      "1d": "1D",
      "1w": "1W",
      "1M": "1M",
      D: "1D",
      W: "1W",
      M: "1M",
    };

    const normalized = timeframe.toLowerCase();
    if (timeframeMap[normalized]) {
      return timeframeMap[normalized];
    }
  }

  throw new Error(
    `Invalid timeframe: ${timeframe}. Valid timeframes are: ${validTimeframes.join(", ")}`,
  );
}

// Available WebSocket endpoints
export type TradingviewEndpoint =
  | "data" // Default for free users
  | "prodata" // Premium users
  | "widgetdata" // Widget data
  | "charts-polygon"; // Polygon data

export const ENDPOINTS: Record<TradingviewEndpoint, string> = {
  data: "wss://data.tradingview.com/socket.io/websocket",
  prodata: "wss://prodata.tradingview.com/socket.io/websocket",
  widgetdata: "wss://widgetdata.tradingview.com/socket.io/websocket",
  "charts-polygon": "wss://charts-polygon.tradingview.com/socket.io/websocket",
};

function parseMessage(message: string): MessagePayload[] {
  if (message.length === 0) return [];

  const events = message
    .toString()
    .split(/~m~\d+~m~/)
    .slice(1);

  return events.map((event) => {
    if (event.substring(0, 3) === "~h~") {
      return { type: "ping", data: `~m~${event.length}~m~${event}` };
    }

    const parsed = JSON.parse(event);

    if (parsed["session_id"]) {
      return { type: "session", data: parsed };
    }

    return { type: "event", data: parsed };
  });
}

async function connectToEndpoint(
  options: ConnectionOptions,
  endpointName: string,
  wsUrl: string,
): Promise<TradingviewConnection> {
  let token = "unauthorized_user_token";

  if (options.sessionId) {
    try {
      const resp = await fetch("https://www.tradingview.com/disclaimer/", {
        method: "GET",
        headers: { Cookie: `sessionid=${options.sessionId}` },
        credentials: "include",
      });
      const text = await resp.text();
      const match = text.match(/"auth_token":"(.+?)"/);
      if (match) {
        token = match[1];
      }
    } catch (error) {
      console.warn("Authentication failed, using unauthorized token:", error);
      // Keep the default unauthorized token
    }
  }

  const connection = new WebSocket(wsUrl);

  // Add connection timeout to prevent hanging
  const connectionTimeout = setTimeout(() => {
    if (connection.readyState === WebSocket.CONNECTING) {
      connection.close();
      throw new Error(
        "Connection timeout - WebSocket did not connect within 10 seconds",
      );
    }
  }, 10000);

  const subscribers: Set<Subscriber> = new Set();

  function subscribe(handler: Subscriber): Unsubscriber {
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }

  function send(name: string, params: any[]) {
    const data = JSON.stringify({ m: name, p: params });
    const message = "~m~" + data.length + "~m~" + data;
    connection.send(message);
  }

  async function close() {
    return new Promise<void>((resolve, reject) => {
      connection.addEventListener("close", () => resolve());
      connection.addEventListener("error", (error) => reject(error));
      connection.close();
    });
  }

  return new Promise<TradingviewConnection>((resolve, reject) => {
    connection.addEventListener("error", (error: Event) => reject(error));

    connection.addEventListener("message", (event: MessageEvent) => {
      const message = event.data;
      const payloads = parseMessage(message.toString());

      for (const payload of payloads) {
        switch (payload.type) {
          case "ping":
            connection.send(payload.data);
            break;
          case "session":
            clearTimeout(connectionTimeout);
            send("set_auth_token", [token]);
            resolve({ subscribe, send, close });
            break;
          case "event":
            const tradingEvent = {
              name: payload.data.m,
              params: payload.data.p,
            };
            subscribers.forEach((handler) => handler(tradingEvent));
            break;
          default:
            throw new Error(`unknown payload: ${payload}`);
        }
      }
    });
  });
}

export async function getCandlesConcurrent({
  connection,
  symbols,
  amount,
  timeframe = 60,
}: GetCandlesParams): Promise<Candle[][]> {
  if (symbols.length === 0) return [];

  const batchSize = amount && amount < MAX_BATCH_SIZE ? amount : MAX_BATCH_SIZE;
  const symbolStates = new Map<string, SymbolState>();
  const sessionMap = new Map<string, string>(); // session -> symbol
  const results: Candle[][] = [];
  let completedCount = 0;

  return new Promise<Candle[][]>((resolve, reject) => {
    // Initialize state for each symbol
    for (const symbol of symbols) {
      symbolStates.set(symbol, {
        candles: [],
        completed: false,
        error: false,
      });
    }

    const unsubscribe = connection.subscribe((event) => {
      try {
        // Handle candle updates
        if (event.name === "timescale_update") {
          const sessionData = event.params[1];
          const sessionId = event.params[0];
          const symbol = sessionMap.get(sessionId);

          if (!symbol) return;

          const state = symbolStates.get(symbol);
          if (!state || state.completed) return;

          // Find the series data (could be sds_1 or other series)
          const seriesKey = Object.keys(sessionData).find(
            (key) => key.startsWith("sds_") && sessionData[key].s,
          );

          if (seriesKey) {
            let newCandles: RawCandle[] = sessionData[seriesKey].s;
            if (newCandles.length > batchSize) {
              // Remove already received candles
              newCandles = newCandles.slice(0, -state.candles.length);
            }
            state.candles = newCandles.concat(state.candles);
          }
          return;
        }

        // Handle completion or error
        if (["series_completed", "symbol_error"].includes(event.name)) {
          const sessionId = event.params[0];
          const symbol = sessionMap.get(sessionId);

          if (!symbol) return;

          const state = symbolStates.get(symbol);
          if (!state || state.completed) return;

          // Check if we need more data
          const loadedCount = state.candles.length;
          if (
            loadedCount > 0 &&
            loadedCount % batchSize === 0 &&
            (!amount || loadedCount < amount)
          ) {
            connection.send("request_more_data", [
              sessionId,
              "sds_1",
              batchSize,
            ]);
            return;
          }

          // Mark as completed
          state.completed = true;
          if (event.name === "symbol_error") {
            state.error = true;
          }

          // Process the candles
          let finalCandles = state.candles;
          if (amount) {
            finalCandles = finalCandles.slice(0, amount);
          }

          const processedCandles = finalCandles.map((c) => ({
            timestamp: c.v[0],
            open: c.v[1],
            high: c.v[2],
            low: c.v[3],
            close: c.v[4],
            volume: c.v[5],
          }));

          // Store results in original order
          const originalIndex = symbols.indexOf(symbol);
          results[originalIndex] = processedCandles;

          completedCount++;

          // Check if all symbols are completed
          if (completedCount === symbols.length) {
            unsubscribe();
            resolve(results);
          }
          return;
        }
      } catch (error) {
        console.error("Error processing event:", error);
        reject(error);
      }
    });

    // Send all requests concurrently
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const chartSession = `cs_${symbol}_${Math.random().toString(36).substring(2, 14)}`;
      const symbolSession = `sds_sym_${i}`;

      sessionMap.set(chartSession, symbol);

      connection.send("chart_create_session", [chartSession, ""]);
      connection.send("resolve_symbol", [
        chartSession,
        symbolSession,
        "=" + JSON.stringify({ symbol, adjustment: "splits" }),
      ]);
      const validatedTimeframe = validateTimeframe(timeframe);
      connection.send("create_series", [
        chartSession,
        "sds_1",
        `s${i}`,
        symbolSession,
        validatedTimeframe,
        batchSize,
        "",
      ]);
    }
  });
}

export async function* getCandlesStream({
  connection,
  symbols,
  amount,
  timeframe = 60,
}: GetCandlesParams): AsyncGenerator<Candle[], void, unknown> {
  if (symbols.length === 0) return;

  const batchSize = amount && amount < MAX_BATCH_SIZE ? amount : MAX_BATCH_SIZE;
  const symbolStates = new Map<string, SymbolState>();
  const sessionMap = new Map<string, string>(); // session -> symbol
  const pendingYields: Array<{ symbol: string; candles: Candle[] }> = [];
  let activeCount = symbols.length;
  let hasError = false;
  let errorMessage: string | null = null;

  // Initialize state for each symbol
  for (const symbol of symbols) {
    symbolStates.set(symbol, {
      candles: [],
      completed: false,
      error: false,
    });
  }

  const unsubscribe = connection.subscribe((event) => {
    try {
      // Handle candle updates
      if (event.name === "timescale_update") {
        const sessionData = event.params[1];
        const sessionId = event.params[0];
        const symbol = sessionMap.get(sessionId);

        if (!symbol) return;

        const state = symbolStates.get(symbol);
        if (!state || state.completed) return;

        // Find the series data
        const seriesKey = Object.keys(sessionData).find(
          (key) => key.startsWith("sds_") && sessionData[key].s,
        );

        if (seriesKey) {
          let newCandles: RawCandle[] = sessionData[seriesKey].s;
          if (newCandles.length > batchSize) {
            newCandles = newCandles.slice(0, -state.candles.length);
          }
          state.candles = newCandles.concat(state.candles);
        }
        return;
      }

      // Handle completion or error
      if (["series_completed", "symbol_error"].includes(event.name)) {
        const sessionId = event.params[0];
        const symbol = sessionMap.get(sessionId);

        if (!symbol) return;

        const state = symbolStates.get(symbol);
        if (!state || state.completed) return;

        // Check if we need more data
        const loadedCount = state.candles.length;
        if (
          loadedCount > 0 &&
          loadedCount % batchSize === 0 &&
          (!amount || loadedCount < amount)
        ) {
          connection.send("request_more_data", [sessionId, "sds_1", batchSize]);
          return;
        }

        // Mark as completed
        state.completed = true;
        if (event.name === "symbol_error") {
          state.error = true;
        }

        // Process the candles
        let finalCandles = state.candles;
        if (amount) {
          finalCandles = finalCandles.slice(0, amount);
        }

        const processedCandles = finalCandles.map((c) => ({
          timestamp: c.v[0],
          open: c.v[1],
          high: c.v[2],
          low: c.v[3],
          close: c.v[4],
          volume: c.v[5],
        }));

        // Add to pending yields
        if (processedCandles.length > 0 || !state.error) {
          pendingYields.push({ symbol, candles: processedCandles });
        }

        activeCount--;

        // Clean up if all symbols are done
        if (activeCount === 0) {
          unsubscribe();
        }
        return;
      }
    } catch (error) {
      console.error("Error processing event:", error);
      hasError = true;
      errorMessage = error instanceof Error ? error.message : String(error);
      unsubscribe();
    }
  });

  // Send all requests concurrently
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    const chartSession = `cs_${symbol}_${Math.random().toString(36).substring(2, 14)}`;
    const symbolSession = `sds_sym_${i}`;

    sessionMap.set(chartSession, symbol);

    connection.send("chart_create_session", [chartSession, ""]);
    connection.send("resolve_symbol", [
      chartSession,
      symbolSession,
      "=" + JSON.stringify({ symbol, adjustment: "splits" }),
    ]);
    const validatedTimeframe = validateTimeframe(timeframe);
    connection.send("create_series", [
      chartSession,
      "sds_1",
      `s${i}`,
      symbolSession,
      validatedTimeframe,
      batchSize,
      "",
    ]);
  }

  // Yield results as they become available
  while (activeCount > 0 && !hasError) {
    if (pendingYields.length > 0) {
      const { candles } = pendingYields.shift()!;
      yield candles;
    } else {
      // Wait a bit for more results
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // Throw error if one occurred
  if (hasError && errorMessage) {
    throw new Error(errorMessage);
  }

  // Yield any remaining results
  while (pendingYields.length > 0) {
    const { candles } = pendingYields.shift()!;
    yield candles;
  }
}

export async function connect(
  options: ConnectionOptions = {},
): Promise<TradingviewConnection> {
  // Determine WebSocket endpoint
  let endpointName: string;
  let wsUrl: string;

  if (options.endpoint && Object.keys(ENDPOINTS).includes(options.endpoint)) {
    // If named endpoint provided
    endpointName = options.endpoint;
    wsUrl = ENDPOINTS[options.endpoint as TradingviewEndpoint];
  } else if (options.endpoint && options.endpoint.startsWith("wss://")) {
    // If custom endpoint provided
    endpointName = "custom";
    wsUrl = options.endpoint;
  } else {
    // Default to data endpoint for free users
    endpointName = "data";
    wsUrl = ENDPOINTS.data;
  }

  // Try to connect with fallback to other endpoints
  const endpointsToTry = [
    { name: endpointName, url: wsUrl },
    // Add fallback endpoints (excluding the one we already tried)
    ...Object.entries(ENDPOINTS)
      .filter(([name]) => name !== endpointName)
      .map(([name, url]) => ({ name, url })),
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpointsToTry) {
    try {
      console.log(
        `Attempting connection to ${endpoint.name} endpoint: ${endpoint.url}`,
      );
      const connection = await connectToEndpoint(
        options,
        endpoint.name,
        endpoint.url,
      );
      console.log(`Successfully connected to ${endpoint.name} endpoint`);
      return connection;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Failed to connect to ${endpoint.name} endpoint:`, error);
      // Continue to next endpoint
    }
  }

  // If all endpoints failed, throw the last error
  throw lastError || new Error("Failed to connect to any TradingView endpoint");
}

interface GetCandlesParams {
  connection: TradingviewConnection;
  symbols: string[];
  amount?: number;
  timeframe?: FlexibleTimeframe;
}

interface SymbolState {
  candles: RawCandle[];
  completed: boolean;
  error?: boolean;
}

export async function getCandles({
  connection,
  symbols,
  amount,
  timeframe = 60,
}: GetCandlesParams) {
  if (symbols.length === 0) return [];

  const chartSession = "cs_" + Math.random().toString(36).substring(2, 14);
  const batchSize = amount && amount < MAX_BATCH_SIZE ? amount : MAX_BATCH_SIZE;

  return new Promise<Candle[][]>((resolve) => {
    const allCandles: Candle[][] = [];
    let currentSymIndex = 0;
    let symbol = symbols[currentSymIndex];
    let currentSymCandles: RawCandle[] = [];

    const unsubscribe = connection.subscribe((event) => {
      // received new candles
      if (event.name === "timescale_update") {
        let newCandles: RawCandle[] = event.params[1]["sds_1"]["s"];
        if (newCandles.length > batchSize) {
          // sometimes tradingview sends already received candles
          newCandles = newCandles.slice(0, -currentSymCandles.length);
        }
        currentSymCandles = newCandles.concat(currentSymCandles);
        return;
      }

      // loaded all requested candles
      if (["series_completed", "symbol_error"].includes(event.name)) {
        const loadedCount = currentSymCandles.length;
        if (
          loadedCount > 0 &&
          loadedCount % batchSize === 0 &&
          (!amount || loadedCount < amount)
        ) {
          connection.send("request_more_data", [
            chartSession,
            "sds_1",
            batchSize,
          ]);
          return;
        }

        // loaded all candles for current symbol

        if (amount) currentSymCandles = currentSymCandles.slice(0, amount);

        const candles = currentSymCandles.map((c) => ({
          timestamp: c.v[0],
          open: c.v[1],
          high: c.v[2],
          low: c.v[3],
          close: c.v[4],
          volume: c.v[5],
        }));
        allCandles.push(candles);

        // next symbol
        if (symbols.length - 1 > currentSymIndex) {
          currentSymCandles = [];
          currentSymIndex += 1;
          symbol = symbols[currentSymIndex];
          connection.send("resolve_symbol", [
            chartSession,
            `sds_sym_${currentSymIndex}`,
            "=" + JSON.stringify({ symbol, adjustment: "splits" }),
          ]);

          const validatedTimeframe = validateTimeframe(timeframe);
          connection.send("modify_series", [
            chartSession,
            "sds_1",
            `s${currentSymIndex}`,
            `sds_sym_${currentSymIndex}`,
            validatedTimeframe,
            "",
          ]);
          return;
        }

        // all symbols loaded
        unsubscribe();
        resolve(allCandles);
      }
    });

    connection.send("chart_create_session", [chartSession, ""]);
    connection.send("resolve_symbol", [
      chartSession,
      `sds_sym_0`,
      "=" + JSON.stringify({ symbol, adjustment: "splits" }),
    ]);
    const validatedTimeframe = validateTimeframe(timeframe);
    connection.send("create_series", [
      chartSession,
      "sds_1",
      "s0",
      "sds_sym_0",
      validatedTimeframe,
      batchSize,
      "",
    ]);
  });
}
