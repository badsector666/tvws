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

export interface TradingviewConnection {
  subscribe: (handler: Subscriber) => Unsubscriber;
  send: (name: string, params: any[]) => void;
  close: () => Promise<void>;
}

interface ConnectionOptions {
  sessionId?: string;
  endpoint?: string;
  timeout?: number; // Connection timeout in milliseconds (default: 10000)
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

// === HELPER FUNCTIONS ===

/**
 * Calculate optimal batch size based on requested amount
 */
function calculateBatchSize(amount?: number): number {
  return amount && amount < MAX_BATCH_SIZE ? amount : MAX_BATCH_SIZE;
}

/**
 * Process raw candles into standardized candle format
 */
function processCandles(rawCandles: RawCandle[], amount?: number): Candle[] {
  const candles = amount ? rawCandles.slice(0, amount) : rawCandles;
  return candles.map((c) => ({
    timestamp: c.v[0],
    open: c.v[1],
    high: c.v[2],
    low: c.v[3],
    close: c.v[4],
    volume: c.v[5],
  }));
}

/**
 * Handle timescale_update events for candle data
 */
function handleTimescaleUpdate(
  event: TradingviewEvent,
  state: SymbolState,
  batchSize: number,
  sessionMap?: Map<string, string>,
): void {
  const sessionData = event.params[1];
  const sessionId = event.params[0];
  const symbol = sessionMap?.get(sessionId);

  if (!symbol || !state || state.completed) return;

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
}

/**
 * Check if more data should be requested
 */
function shouldRequestMoreData(
  loadedCount: number,
  batchSize: number,
  amount?: number,
): boolean {
  return (
    loadedCount > 0 &&
    loadedCount % batchSize === 0 &&
    (!amount || loadedCount < amount)
  );
}

/**
 * Create a chart session and initialize symbol resolution
 */
function createChartSession(
  connection: TradingviewConnection,
  chartSession: string,
  symbolSession: string,
  symbol: string,
  seriesId: string,
  timeframe: TradingviewTimeframe,
  batchSize: number,
): void {
  connection.send("chart_create_session", [chartSession, ""]);
  connection.send("resolve_symbol", [
    chartSession,
    symbolSession,
    "=" + JSON.stringify({ symbol, adjustment: "splits" }),
  ]);
  connection.send("create_series", [
    chartSession,
    "sds_1",
    seriesId,
    symbolSession,
    timeframe,
    batchSize,
    "",
  ]);
}

// === EVENT SYSTEM ===

/**
 * Event filter function for selective subscription
 */
type EventFilter = (event: TradingviewEvent) => boolean;

/**
 * Event subscription with optional filter and priority
 */
interface EventSubscription {
  handler: Subscriber;
  filter?: EventFilter;
  priority?: number;
}

/**
 * Event router for filtered and prioritized event handling
 */
class EventRouter {
  private subscriptions: EventSubscription[] = [];

  /**
   * Subscribe to events with optional filter and priority
   * @param handler - Event handler function
   * @param filter - Optional filter function (only matching events trigger handler)
   * @param priority - Priority level (higher = called first)
   * @returns Unsubscribe function
   */
  subscribe(
    handler: Subscriber,
    filter?: EventFilter,
    priority = 0,
  ): Unsubscriber {
    const sub: EventSubscription = { handler, filter, priority };
    this.subscriptions.push(sub);

    // Sort by priority (highest first)
    this.subscriptions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx > -1) this.subscriptions.splice(idx, 1);
    };
  }

  /**
   * Dispatch an event to all matching subscribers
   * @param event - The event to dispatch
   */
  dispatch(event: TradingviewEvent): void {
    for (const sub of this.subscriptions) {
      if (!sub.filter || sub.filter(event)) {
        try {
          sub.handler(event);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      }
    }
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions = [];
  }
}

/**
 * Base interface for handler states (must have completed property)
 */
interface HandlerState {
  completed: boolean;
  error?: boolean;
}

/**
 * Base handler configuration for composable event processing
 */
interface EventHandlerConfig<TState extends HandlerState, TResult> {
  eventNames: string[];
  onEvent: (event: TradingviewEvent, state: TState) => void;
  onComplete?: (state: TState) => TResult;
  shouldRequestMore?: (state: TState) => boolean;
}

/**
 * Generic data retrieval using handler registry pattern
 */
async function getData<TState extends HandlerState, TResult>(
  connection: TradingviewConnection,
  handler: EventHandlerConfig<TState, TResult>,
  initialState: TState,
  setupCommands: () => void,
  progressCallback?: (state: TState) => void,
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    let state = { ...initialState };
    let completed = false;

    const unsubscribe = connection.subscribe((event) => {
      if (!handler.eventNames.includes(event.name)) return;

      try {
        handler.onEvent(event, state);

        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(state);
        }

        // Check if completion criteria met
        if (state.completed) {
          // Check if we should request more data
          if (handler.shouldRequestMore?.(state)) {
            return; // Don't complete, request more data
          }

          // Mark as completed to prevent multiple resolutions
          if (completed) return;
          completed = true;

          unsubscribe();
          const result = handler.onComplete?.(state);
          if (result !== undefined) {
            resolve(result);
          } else {
            reject(new Error("Handler completed without result"));
          }
        }
      } catch (error) {
        if (!completed) {
          completed = true;
          unsubscribe();
          reject(error);
        }
      }
    });

    try {
      setupCommands();
    } catch (error) {
      if (!completed) {
        completed = true;
        unsubscribe();
        reject(error);
      }
    }
  });
}

// === HANDLER CONFIGURATIONS ===

/**
 * Enhanced symbol state for candle handlers
 */
interface CandleHandlerState extends HandlerState {
  candles: RawCandle[];
  amount?: number;
  batchSize: number;
  sessionId?: string;
  connection?: TradingviewConnection;
}

/**
 * Candle event handler for timescale_update events
 */
const candleHandler: EventHandlerConfig<CandleHandlerState, Candle[]> = {
  eventNames: ["timescale_update"],

  onEvent: (event, state) => {
    handleTimescaleUpdate(event, state, state.batchSize);
  },

  shouldRequestMore: (state) => {
    return shouldRequestMoreData(
      state.candles.length,
      state.batchSize,
      state.amount,
    );
  },
};

/**
 * Completion handler for candle data
 */
const candleCompletionHandler: EventHandlerConfig<
  CandleHandlerState,
  Candle[]
> = {
  eventNames: ["series_completed", "symbol_error"],

  onEvent: (event, state) => {
    state.completed = true;
    if (event.name === "symbol_error") {
      state.error = true;
    }
    state.sessionId = event.params[0];
  },

  onComplete: (state) => {
    let finalCandles = state.candles;
    if (state.amount) {
      finalCandles = finalCandles.slice(0, state.amount);
    }
    return processCandles(finalCandles, state.amount);
  },
};

// === STUDY EVENT HANDLERS ===

/**
 * State for study operations
 */
interface StudyState extends HandlerState {
  studyId: string;
  data: any[];
  sessionId?: string;
}

/**
 * Study events handler
 */
const studyHandler: EventHandlerConfig<StudyState, any[]> = {
  eventNames: [
    "study_completed",
    "study_error",
    "modify_study",
    "remove_study",
  ],

  onEvent: (event, state) => {
    switch (event.name) {
      case "study_completed":
        state.completed = true;
        state.sessionId = event.params[0];
        state.data = event.params[1]; // Adjust based on actual structure
        break;
      case "study_error":
        state.completed = true;
        state.error = true;
        state.sessionId = event.params[0];
        break;
      case "modify_study":
        // Handle study modification - update state as needed
        state.sessionId = event.params[0];
        break;
      case "remove_study":
        // Handle study removal - mark as completed
        state.completed = true;
        state.sessionId = event.params[0];
        break;
    }
  },

  onComplete: (state) => {
    if (state.error) {
      throw new Error(`Study operation failed for study ${state.studyId}`);
    }
    return state.data;
  },
};

// === REPLAY EVENT HANDLERS ===

/**
 * State for replay operations
 */
interface ReplayState extends HandlerState {
  sessionId: string;
  position: number;
  playing: boolean;
  speed?: number;
}

/**
 * Replay events handler
 */
const replayHandler: EventHandlerConfig<ReplayState, ReplayState> = {
  eventNames: [
    "replay_create_session",
    "replay_add_series",
    "replay_reset",
    "replay_step",
    "replay_start",
    "replay_stop",
  ],

  onEvent: (event, state) => {
    switch (event.name) {
      case "replay_create_session":
        state.sessionId = event.params[0];
        state.playing = false;
        state.position = 0;
        break;
      case "replay_add_series":
        // Handle adding series to replay
        state.sessionId = event.params[0];
        break;
      case "replay_reset":
        state.position = 0;
        state.playing = false;
        break;
      case "replay_step":
        state.position = event.params[1];
        break;
      case "replay_start":
        state.playing = true;
        state.speed = event.params[1] || 1;
        break;
      case "replay_stop":
        state.playing = false;
        break;
    }
  },

  onComplete: (state) => {
    return {
      sessionId: state.sessionId,
      position: state.position,
      playing: state.playing,
      completed: state.completed,
      speed: state.speed,
    };
  },
};

// === QUOTE EVENT HANDLERS ===

/**
 * State for quote operations
 */
interface QuoteState extends HandlerState {
  sessionId: string;
  symbols: Map<string, any>;
  fields: string[];
}

/**
 * Quote events handler
 */
const quoteHandler: EventHandlerConfig<QuoteState, Map<string, any>> = {
  eventNames: [
    "quote_create_session",
    "quote_set_fields",
    "quote_add_symbols",
    "quote_remove_symbols",
    "quote_completed",
    "qsd", // quote data updates
  ],

  onEvent: (event, state) => {
    switch (event.name) {
      case "quote_create_session":
        state.sessionId = event.params[0];
        state.symbols = new Map();
        break;
      case "quote_set_fields":
        state.fields = event.params[1];
        break;
      case "quote_add_symbols":
        state.sessionId = event.params[0];
        event.params[1].forEach((sym: string) => {
          state.symbols.set(sym, {});
        });
        break;
      case "quote_remove_symbols":
        state.sessionId = event.params[0];
        event.params[1].forEach((sym: string) => {
          state.symbols.delete(sym);
        });
        break;
      case "qsd": // Real-time quote data
        const quoteData = event.params[1];
        // Update symbol data based on quoteData structure
        if (quoteData.n && quoteData.s) {
          const symbolData = state.symbols.get(quoteData.n) || {};
          state.symbols.set(quoteData.n, { ...symbolData, ...quoteData.s });
        }
        break;
      case "quote_completed":
        state.completed = true;
        state.sessionId = event.params[0];
        break;
    }
  },

  onComplete: (state) => {
    if (state.error) {
      throw new Error(`Quote operation failed for session ${state.sessionId}`);
    }
    return state.symbols;
  },
};

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
    // Clear all subscribers to prevent memory leaks
    subscribers.clear();
    return new Promise<void>((resolve, reject) => {
      connection.addEventListener("close", () => resolve());
      connection.addEventListener("error", (error) => reject(error));
      connection.close();
    });
  }

  return new Promise<TradingviewConnection>((resolve, reject) => {
    const connectionTimeout = setTimeout(() => {
      if (connection.readyState === WebSocket.CONNECTING) {
        connection.close();
        reject(
          new Error(
            "Connection timeout - WebSocket did not connect within 10 seconds",
          ),
        );
      }
    }, options.timeout || 10000);

    connection.addEventListener("error", (error: Event) => {
      clearTimeout(connectionTimeout);
      reject(error);
    });

    connection.addEventListener("message", (event: MessageEvent) => {
      try {
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
      } catch (error) {
        clearTimeout(connectionTimeout);
        reject(error);
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

// === NEW PUBLIC API FUNCTIONS ===

/**
 * Study configuration options
 */
interface StudyOptions {
  symbol: string;
  studyId: string;
  script?: string;
  inputs?: Record<string, any>;
}

/**
 * Create and execute a study on TradingView
 * @param connection - TradingView connection
 * @param options - Study configuration options
 * @returns Promise resolving to study data
 */
export async function createStudy(
  connection: TradingviewConnection,
  options: StudyOptions,
): Promise<any[]> {
  const initialState: StudyState = {
    studyId: options.studyId,
    data: [],
    completed: false,
  };

  const chartSession = `cs_${options.symbol}_${Math.random().toString(36).substring(2, 14)}`;

  const setupCommands = () => {
    try {
      const timeframe = validateTimeframe("1D"); // Default timeframe for studies
      connection.send("chart_create_session", [chartSession, ""]);
      connection.send("resolve_symbol", [
        chartSession,
        `sds_sym_${options.studyId}`,
        "=" + JSON.stringify({ symbol: options.symbol, adjustment: "splits" }),
      ]);
      connection.send("create_study", [
        chartSession,
        options.studyId,
        JSON.stringify({
          script: options.script,
          inputs: options.inputs || {},
        }),
      ]);
    } catch (error) {
      console.error("Error setting up study:", error);
      throw error;
    }
  };

  return getData(connection, studyHandler, initialState, setupCommands);
}

/**
 * Modify an existing study
 * @param connection - TradingView connection
 * @param studyId - Study ID to modify
 * @param modifications - Study modifications
 */
export function modifyStudy(
  connection: TradingviewConnection,
  studyId: string,
  modifications: { script?: string; inputs?: Record<string, any> },
): void {
  connection.send("modify_study", [studyId, JSON.stringify(modifications)]);
}

/**
 * Remove an existing study
 * @param connection - TradingView connection
 * @param studyId - Study ID to remove
 */
export function removeStudy(
  connection: TradingviewConnection,
  studyId: string,
): void {
  connection.send("remove_study", [studyId]);
}

/**
 * Replay configuration options
 */
interface ReplayOptions {
  symbols: string[];
  timeframe?: FlexibleTimeframe;
  speed?: number;
  startTime?: number;
  endTime?: number;
}

/**
 * Create a replay session for historical data playback
 * @param connection - TradingView connection
 * @param options - Replay configuration options
 * @returns Promise resolving to replay state
 */
export async function createReplay(
  connection: TradingviewConnection,
  options: ReplayOptions,
): Promise<ReplayState> {
  const initialState: ReplayState = {
    sessionId: "",
    position: 0,
    playing: false,
    completed: false,
    speed: options.speed || 1,
  };

  const replaySession = `rs_${Math.random().toString(36).substring(2, 14)}`;

  const setupCommands = () => {
    try {
      const timeframe = validateTimeframe(options.timeframe || 60);
      connection.send("replay_create_session", [replaySession]);

      options.symbols.forEach((symbol, index) => {
        connection.send("replay_add_series", [
          replaySession,
          `symbol_${index}`,
          symbol,
          timeframe,
        ]);
      });
    } catch (error) {
      console.error("Error setting up replay:", error);
      throw error;
    }
  };

  return getData(connection, replayHandler, initialState, setupCommands);
}

/**
 * Control replay playback
 */
export class ReplayController {
  constructor(
    private connection: TradingviewConnection,
    private sessionId: string,
  ) {}

  start(speed = 1): void {
    this.connection.send("replay_start", [this.sessionId, speed]);
  }

  stop(): void {
    this.connection.send("replay_stop", [this.sessionId]);
  }

  step(steps = 1): void {
    this.connection.send("replay_step", [this.sessionId, steps]);
  }

  reset(): void {
    this.connection.send("replay_reset", [this.sessionId]);
  }

  setPosition(position: number): void {
    this.connection.send("replay_set_position", [this.sessionId, position]);
  }
}

/**
 * Quote configuration options
 */
interface QuoteOptions {
  symbols: string[];
  fields?: string[];
}

/**
 * Get real-time quote data for symbols
 * @param connection - TradingView connection
 * @param options - Quote configuration options
 * @returns Promise resolving to quote data
 */
export async function getQuotes(
  connection: TradingviewConnection,
  options: QuoteOptions,
): Promise<Map<string, any>> {
  const initialState: QuoteState = {
    sessionId: "",
    symbols: new Map(),
    fields: options.fields || ["price", "volume", "change", "change_percent"],
    completed: false,
  };

  const quoteSession = `qs_${Math.random().toString(36).substring(2, 14)}`;

  const setupCommands = () => {
    try {
      connection.send("quote_create_session", [quoteSession]);
      connection.send("quote_set_fields", [
        quoteSession,
        ...initialState.fields,
      ]);
      connection.send("quote_add_symbols", [quoteSession, ...options.symbols]);
    } catch (error) {
      console.error("Error setting up quotes:", error);
      throw error;
    }
  };

  return getData(connection, quoteHandler, initialState, setupCommands);
}

/**
 * Add symbols to an existing quote session
 * @param connection - TradingView connection
 * @param sessionId - Quote session ID
 * @param symbols - Symbols to add
 */
export function addQuoteSymbols(
  connection: TradingviewConnection,
  sessionId: string,
  symbols: string[],
): void {
  connection.send("quote_add_symbols", [sessionId, ...symbols]);
}

/**
 * Remove symbols from an existing quote session
 * @param connection - TradingView connection
 * @param sessionId - Quote session ID
 * @param symbols - Symbols to remove
 */
export function removeQuoteSymbols(
  connection: TradingviewConnection,
  sessionId: string,
  symbols: string[],
): void {
  connection.send("quote_remove_symbols", [sessionId, ...symbols]);
}

/**
 * Set fields for an existing quote session
 * @param connection - TradingView connection
 * @param sessionId - Quote session ID
 * @param fields - Fields to set
 */
export function setQuoteFields(
  connection: TradingviewConnection,
  sessionId: string,
  fields: string[],
): void {
  connection.send("quote_set_fields", [sessionId, ...fields]);
}
