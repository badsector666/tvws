/**
 * WebSocket protocol handling for TradingView API
 */

import { MessagePayload, MessageType } from "../types/index.js";

/**
 * Parses WebSocket messages from TradingView format
 * TradingView uses a custom message format with ~m~{length}~m~ delimiters
 *
 * @param message - Raw WebSocket message string
 * @returns Array of parsed message payloads
 */
export function parseMessage(message: string): MessagePayload[] {
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

/**
 * Creates a properly formatted TradingView message
 *
 * @param name - Message method name
 * @param params - Message parameters
 * @returns Formatted message string for TradingView WebSocket
 */
export function createMessage(name: string, params: any[]): string {
  const data = JSON.stringify({ m: name, p: params });
  return "~m~" + data.length + "~m~" + data;
}

/**
 * Checks if a payload represents a ping message
 *
 * @param payload - Message payload
 * @returns True if this is a ping message
 */
export function isPingMessage(payload: MessagePayload): boolean {
  return payload.type === "ping";
}

/**
 * Checks if a payload represents a session message
 *
 * @param payload - Message payload
 * @returns True if this is a session message
 */
export function isSessionMessage(payload: MessagePayload): boolean {
  return payload.type === "session";
}

/**
 * Checks if a payload represents a trading event
 *
 * @param payload - Message payload
 * @returns True if this is a trading event
 */
export function isEventMessage(payload: MessagePayload): boolean {
  return payload.type === "event";
}

/**
 * Extracts session ID from a session message payload
 *
 * @param payload - Session message payload
 * @returns Session ID if present
 */
export function extractSessionId(payload: MessagePayload): string | null {
  if (isSessionMessage(payload) && payload.data.session_id) {
    return payload.data.session_id;
  }
  return null;
}

/**
 * Creates a trading event from an event payload
 *
 * @param payload - Event message payload
 * @returns Trading event object
 */
export function createTradingEvent(payload: MessagePayload) {
  if (!isEventMessage(payload)) {
    throw new Error("Cannot create trading event from non-event payload");
  }

  return {
    name: payload.data.m,
    params: payload.data.p,
  };
}
