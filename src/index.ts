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

type TradingviewTimeframe = number | "1D" | "1W" | "1M";

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

export async function connect(
  options: ConnectionOptions = {},
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

  // Determine WebSocket endpoint
  let wsUrl: string;
  if (options.endpoint && Object.keys(ENDPOINTS).includes(options.endpoint)) {
    // If named endpoint provided
    wsUrl = ENDPOINTS[options.endpoint as TradingviewEndpoint];
  } else if (options.endpoint && options.endpoint.startsWith("wss://")) {
    // If custom endpoint provided
    wsUrl = options.endpoint;
  } else {
    // Default to data endpoint for free users
    wsUrl = ENDPOINTS.data;
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

interface GetCandlesParams {
  connection: TradingviewConnection;
  symbols: string[];
  amount?: number;
  timeframe?: TradingviewTimeframe;
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

          connection.send("modify_series", [
            chartSession,
            "sds_1",
            `s${currentSymIndex}`,
            `sds_sym_${currentSymIndex}`,
            timeframe.toString(),
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
    connection.send("create_series", [
      chartSession,
      "sds_1",
      "s0",
      "sds_sym_0",
      timeframe.toString(),
      batchSize,
      "",
    ]);
  });
}
