/**
 * OpenClaw Agent v2.0 - Transport Layer
 * 多通道传输层抽象
 * 参考: Claude Code Transport Architecture
 */

// ============ 类型定义 ============

export interface Message {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  timestamp: number;
}

export interface TransportOptions {
  timeout?: number;
  retries?: number;
  reconnect?: boolean;
}

// ============ Transport 抽象基类 ============

export abstract class Transport {
  protected isConnected: boolean = false;
  protected messageHandlers: Set<(message: Message) => void> = new Set();
  protected errorHandlers: Set<(error: Error) => void> = new Set();

  /**
   * 连接传输层
   */
  abstract connect(): Promise<void>;

  /**
   * 断开连接
   */
  abstract disconnect(): Promise<void>;

  /**
   * 发送消息
   */
  abstract send(message: Message): Promise<void>;

  /**
   * 接收消息（异步迭代器）
   */
  abstract receive(): AsyncIterable<Message>;

  /**
   * 检查连接状态
   */
  isActive(): boolean {
    return this.isConnected;
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: (message: Message) => void): void {
    this.messageHandlers.add(handler);
  }

  /**
   * 注册错误处理器
   */
  onError(handler: (error: Error) => void): void {
    this.errorHandlers.add(handler);
  }

  /**
   * 触发消息处理
   */
  protected emitMessage(message: Message): void {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    }
  }

  /**
   * 触发错误处理
   */
  protected emitError(error: Error): void {
    for (const handler of this.errorHandlers) {
      try {
        handler(error);
      } catch (e) {
        console.error('Error handler error:', e);
      }
    }
  }
}

// ============ StdioTransport ============

export class StdioTransport extends Transport {
  private reader: NodeJS.ReadableStream;
  private writer: NodeJS.WritableStream;

  constructor(options?: { reader?: NodeJS.ReadableStream; writer?: NodeJS.WritableStream }) {
    super();
    this.reader = options?.reader || process.stdin;
    this.writer = options?.writer || process.stdout;
  }

  async connect(): Promise<void> {
    this.isConnected = true;
    console.log('[StdioTransport] Connected');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('[StdioTransport] Disconnected');
  }

  async send(message: Message): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Transport not connected');
    }

    const data = JSON.stringify(message) + '\n';
    this.writer.write(data);
  }

  async* receive(): AsyncIterable<Message> {
    const buffer: string[] = [];

    this.reader.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          buffer.push(line);
        }
      }
    });

    while (this.isConnected) {
      if (buffer.length > 0) {
        const line = buffer.shift()!;
        try {
          const message = JSON.parse(line) as Message;
          this.emitMessage(message);
          yield message;
        } catch (error) {
          this.emitError(new Error(`Failed to parse message: ${line}`));
        }
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

// ============ HTTPTransport ============

export class HTTPTransport extends Transport {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl: string, headers?: Record<string, string>) {
    super();
    this.baseUrl = baseUrl;
    this.headers = headers || {};
  }

  async connect(): Promise<void> {
    // HTTP 是无状态的，无需显式连接
    this.isConnected = true;
    console.log(`[HTTPTransport] Connected to ${this.baseUrl}`);
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('[HTTPTransport] Disconnected');
  }

  async send(message: Message): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Transport not connected');
    }

    try {
      const response = await fetch(`${this.baseUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
    } catch (error) {
      this.emitError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async* receive(): AsyncIterable<Message> {
    // HTTP 是请求-响应模式，需要轮询或长连接
    while (this.isConnected) {
      try {
        const response = await fetch(`${this.baseUrl}/poll`, {
          headers: this.headers,
        });

        if (response.ok) {
          const messages = await response.json() as Message[];
          for (const message of messages) {
            this.emitMessage(message);
            yield message;
          }
        }
      } catch (error) {
        this.emitError(error instanceof Error ? error : new Error(String(error)));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// ============ SSETransport ============

export class SSETransport extends Transport {
  private url: string;
  private eventSource: any;
  private messageQueue: Message[] = [];

  constructor(url: string) {
    super();
    this.url = url;
  }

  async connect(): Promise<void> {
    // 实际实现中使用 EventSource
    this.isConnected = true;
    console.log(`[SSETransport] Connected to ${this.url}`);

    // 模拟 SSE 连接
    this.simulateSSE();
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    if (this.eventSource) {
      this.eventSource.close();
    }
    console.log('[SSETransport] Disconnected');
  }

  async send(message: Message): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Transport not connected');
    }

    // SSE 通常是单向的，发送需要通过 HTTP
    console.log(`[SSETransport] Sending message: ${message.id}`);
  }

  async* receive(): AsyncIterable<Message> {
    while (this.isConnected) {
      if (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!;
        this.emitMessage(message);
        yield message;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private simulateSSE(): void {
    // 模拟接收消息
    setInterval(() => {
      if (this.isConnected && Math.random() > 0.9) {
        this.messageQueue.push({
          id: `sse_${Date.now()}`,
          type: 'notification',
          timestamp: Date.now(),
        });
      }
    }, 5000);
  }
}

// ============ TransportManager ============

export class TransportManager {
  private transports: Map<string, Transport> = new Map();
  private defaultTransport: string | null = null;

  /**
   * 注册传输层
   */
  register(name: string, transport: Transport, isDefault: boolean = false): void {
    this.transports.set(name, transport);
    if (isDefault || !this.defaultTransport) {
      this.defaultTransport = name;
    }
  }

  /**
   * 获取传输层
   */
  get(name?: string): Transport | null {
    if (name) {
      return this.transports.get(name) || null;
    }
    return this.defaultTransport ? this.transports.get(this.defaultTransport) || null : null;
  }

  /**
   * 连接所有传输层
   */
  async connectAll(): Promise<void> {
    for (const [name, transport] of this.transports) {
      try {
        await transport.connect();
        console.log(`[TransportManager] ${name} connected`);
      } catch (error) {
        console.error(`[TransportManager] Failed to connect ${name}:`, error);
      }
    }
  }

  /**
   * 断开所有传输层
   */
  async disconnectAll(): Promise<void> {
    for (const [name, transport] of this.transports) {
      try {
        await transport.disconnect();
        console.log(`[TransportManager] ${name} disconnected`);
      } catch (error) {
        console.error(`[TransportManager] Failed to disconnect ${name}:`, error);
      }
    }
  }

  /**
   * 列出所有传输层
   */
  list(): string[] {
    return Array.from(this.transports.keys());
  }
}

// 导出单例
const transportManager = new TransportManager();

module.exports = {
  Transport,
  StdioTransport,
  HTTPTransport,
  SSETransport,
  TransportManager,
  transportManager,
};
