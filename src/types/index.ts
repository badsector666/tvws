/**
 * Core type definitions for TradingView WebSocket API
 */

// Event handling types
export type Subscriber = (event: TradingviewEvent) => void;
export type Unsubscriber = () => void;

// WebSocket message types
export type MessageType = "ping" | "session" | "event";

// Raw candle data structure from TradingView
export interface RawCandle {
  i: number;
  v: number[];
}

// Processed candle data structure
export interface Candle {
  timestamp: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
}

// WebSocket message payload
export interface MessagePayload {
  type: MessageType;
  data: any;
}

// Connection interface
export interface TradingviewConnection {
  subscribe: (handler: Subscriber) => Unsubscriber;
  send: (name: string, params: any[]) => void;
  close: () => Promise<void>;
}

// Connection configuration options
export interface ConnectionOptions {
  sessionId?: string;
  endpoint?: string;
}

// TradingView event structure
export interface TradingviewEvent {
  name: string;
  params: any[];
}

// Valid TradingView timeframes
export type TradingviewTimeframe =
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
export type FlexibleTimeframe = TradingviewTimeframe | number;

// Available TradingView endpoints
export type TradingviewEndpoint =
  | "data" // Default for free users
  | "prodata" // Premium users
  | "widgetdata" // Widget data
  | "charts-polygon"; // Polygon data

// Parameters for candle data requests
export interface GetCandlesParams {
  connection: TradingviewConnection;
  symbols: string[];
  amount?: number;
  timeframe?: FlexibleTimeframe;
}

// Internal symbol state for data collection
export interface SymbolState {
  candles: RawCandle[];
  completed: boolean;
  error?: boolean;
}

// TradingView endpoint URLs
export const ENDPOINTS: Record<TradingviewEndpoint, string> = {
  data: "wss://data.tradingview.com/socket.io/websocket",
  prodata: "wss://prodata.tradingview.com/socket.io/websocket",
  "charts-polygon": "wss://charts-polygon.tradingview.com/socket.io/websocket",
  widgetdata: "wss://widgetdata.tradingview.com/socket.io/websocket",
};
