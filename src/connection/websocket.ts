/**
 * WebSocket connection management for TradingView API
 */

import {
  TradingviewConnection,
  ConnectionOptions,
  TradingviewEvent,
  Subscriber,
  Unsubscriber,
  TradingviewEndpoint,
  ENDPOINTS
} from "../types/index.js";
import { parseMessage, createMessage, isPingMessage, isSessionMessage, createTradingEvent } from "./protocol.js";
import { validateConnectionOptions } from "../utils/validation.js";

/**
 * Maximum batch size for data requests
 */
const MAX_BATCH_SIZE = 5000;

/**
 * Establishes a WebSocket connection to a specific TradingView endpoint
 *
 * @param options - Connection configuration options
 * @param endpointName - Name of the endpoint being connected to
 * @param wsUrl - WebSocket URL for the endpoint
 * @returns Promise that resolves to TradingviewConnection object
 */
export async function connectToEndpoint(
  options: ConnectionOptions,
  endpointName: string,
  wsUrl: string,
): Promise<TradingviewConnection> {
  let token = "unauthorized_user_token";

  // Validate connection options
  validateConnectionOptions(options);

  // Attempt authentication if session ID is provided
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
    const message = createMessage(name, params);
    connection.send(message);
  }

  async function close() {
    return new Promise<void>((resolve, reject) => {
      connection.addEventListener("close", () => resolve());
      connection.addEventListener("error", (error: Event) => reject(error));
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
            try {
              const tradingEvent = createTradingEvent(payload);
              subscribers.forEach((handler) => handler(tradingEvent));
            } catch (error) {
              console.error("Error processing trading event:", error);
            }
            break;
          default:
            throw new Error(`unknown payload: ${payload}`);
        }
      }
    });
  });
}

/**
 * Main connection function with endpoint fallback support
 *
 * @param options - Connection configuration options
 * @returns Promise that resolves to TradingviewConnection object
 */
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

/**
 * Export constants and types for external use
 */
export { MAX_BATCH_SIZE };
export type {
  TradingviewConnection,
  ConnectionOptions,
  TradingviewEvent,
  Subscriber,
  Unsubscriber
};
