import { decode, encode, type ClientMessage, type ServerMessage } from "@/shared/lib/ws/protocol";

type Listener = (msg: ServerMessage) => void;

class QuizSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private attempts = 0;
  private url = "";
  private closed = false;

  connect(url: string) {
    this.url = url;
    this.closed = false;
    this.attempts = 0;
    this.open();
  }

  private open() {
    if (this.closed) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onmessage = (e: MessageEvent<string>) => {
      const msg = decode(e.data);
      if (msg) this.listeners.forEach((l) => l(msg));
    };

    ws.onopen = () => {
      this.attempts = 0;
    };

    ws.onclose = () => {
      if (this.closed) return;
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

  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close() {
    this.closed = true;
    this.ws?.close();
    this.listeners.clear();
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export const quizSocket = new QuizSocket();
