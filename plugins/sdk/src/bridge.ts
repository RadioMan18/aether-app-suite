import type { NidusRequestPayload, NidusResponse } from "./types";

type MessageHandler = (message: MessageEvent) => void;

let requestId = 0;
const pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();
const DEFAULT_TIMEOUT = 30_000;

function generateId(): string {
  return `${Date.now()}-${++requestId}`;
}

function createPromise<T>(): { promise: Promise<T>; id: string } {
  const id = generateId();
  return {
    id,
    promise: new Promise<T>((resolve, reject) => {
      pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
    }),
  };
}

function setupListener(): MessageHandler {
  return (event: MessageEvent) => {
    const message = event.data;
    if (!message || typeof message !== "object") return;
    if (message.type !== "nidus:response") return;

    const { requestId: rid, result } = message as { requestId: string; result?: NidusResponse };
    if (!rid || !result) return;

    const pending = pendingRequests.get(rid);
    if (!pending) return;

    pendingRequests.delete(rid);

    if (result.error) {
      pending.reject(new Error(result.error));
    } else {
      pending.resolve(result.data ?? null);
    }
  };
}

let listener: MessageHandler | null = null;

function ensureListener(): MessageHandler {
  if (!listener) {
    listener = setupListener();
    window.addEventListener("message", listener);
  }
  return listener;
}

export function sendRequest<T>(payload: NidusRequestPayload, timeout = DEFAULT_TIMEOUT): Promise<T> {
  ensureListener();
  const { id, promise } = createPromise<T>();

  window.parent.postMessage({ type: "nidus:request", requestId: id, payload }, "*");

  const timer = setTimeout(() => {
    if (pendingRequests.has(id)) {
      pendingRequests.delete(id);
      console.error(`[PluginSDK] request timed out: ${payload.type} (${id})`);
    }
  }, timeout);

  return promise.finally(() => clearTimeout(timer));
}
