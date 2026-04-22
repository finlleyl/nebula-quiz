import { ClientMessage, ServerMessage, decode, encode } from "@/shared/lib/ws/protocol";

type Listener = (msg: ServerMessage) => void;

class QuizSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private attempts = 0;
  private url = "";
  private shouldReconnect = true;

  connect(url: string) {
    this.url = url;
    this.shouldReconnect = true;
    this.attempts = 0;
    this.open();
  }

  private open() {
    if (!this.url) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onmessage = (e) => {
      const msg = decode(e.data);
      if (msg) this.listeners.forEach((l) => l(msg));
    };

    ws.onopen = () => {
      this.attempts = 0;
    };

    ws.onclose = () => {
      if (!this.shouldReconnect) return;
      const delay =
        Math.min(1000 * 2 ** this.attempts++, 30_000) +
        Math.random() * 1000;
      setTimeout(() => this.open(), delay);
    };
  }

  send(msg: ClientMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(encode(msg));
    }
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close() {
    this.shouldReconnect = false;
    this.url = "";
    this.ws?.close();
    this.listeners.clear();
  }
}

export const quizSocket = new QuizSocket();
