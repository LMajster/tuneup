// ─── WebSocket Client ──────────────────────────────
// Connects to the Tuneup game server

export type WsEventCallback = (data: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, WsEventCallback[]>();
  private serverUrl: string;

  constructor(url = 'ws://localhost:8000/ws') {
    this.serverUrl = url;
  }

  connect(playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.serverUrl}?player_id=${playerId}`);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          const cbs = this.listeners.get(type) || [];
          cbs.forEach((cb) => cb(data));
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        // Attempt reconnect after 3s
        setTimeout(() => this.connect(playerId), 3000);
      };
    });
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
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
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}

export const socketClient = new SocketClient();
export default SocketClient;
