// ─── WebSocket Client ──────────────────────────────
// Connects to the Tuneup game server on the VPS.

const WS_URL = 'ws://89.167.6.79/ws';

export type WsEventCallback = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, WsEventCallback[]>();
  private serverUrl: string;
  private token: string = '';
  private roomId: string = '';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor() {
    this.serverUrl = WS_URL;
  }

  connect(roomId: string, token: string): Promise<void> {
    this.roomId = roomId;
    this.token = token;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      const url = `${this.serverUrl}/${roomId}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', roomId);
        resolve();
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        reject(err);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          const cbs = this.listeners.get(type) || [];
          cbs.forEach((cb) => cb(data));
        } catch (e) {
          console.error('[WS] Parse error:', e, 'raw:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        // Auto-reconnect after 3s (unless game is over or explicit disconnect)
        if (this.shouldReconnect && event.code !== 4001 && event.code !== 4003) {
          this.reconnectTimer = setTimeout(() => {
            console.log('[WS] Reconnecting...');
            this.connect(this.roomId, this.token).catch(() => {});
          }, 3000);
        }
      };
    });
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send — not connected');
    }
  }

  on(event: string, cb: WsEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  off(event: string, cb: WsEventCallback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      this.listeners.set(
        event,
        cbs.filter((c) => c !== cb)
      );
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}

export const socketClient = new SocketClient();
export default SocketClient;
