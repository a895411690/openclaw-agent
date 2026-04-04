/**
 * OpenClaw Agent v2.0 - MCP Protocol
 * Model Context Protocol 完整实现
 * 参考: Claude Code MCP Architecture
 */

// ============ JSON-RPC 2.0 基础类型 ============

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, any>;
}

// ============ MCP 错误码 ============

export enum MCPErrorCode {
  // Standard JSON-RPC error codes
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  
  // MCP-specific error codes
  ConnectionClosed = -32000,
  RequestTimeout = -32001,
  UrlElicitationRequired = -32042,
}

export class MCPError extends Error {
  constructor(
    public code: MCPErrorCode,
    message: string,
    public data?: any
  ) {
    super(`MCP error ${code}: ${message}`);
    this.name = 'McpError';
  }

  static fromError(code: MCPErrorCode, message: string, data?: any): MCPError {
    return new MCPError(code, message, data);
  }
}

// ============ MCP 类型定义 ============

export interface MCPResource {
  uri: string;
  name: string;
  mimeType?: string;
  description?: string;
  text?: string;
  blob?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
  outputSchema?: {
    type: 'object';
    properties?: Record<string, any>;
  };
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export type TaskStatus = 'working' | 'input_required' | 'completed' | 'failed' | 'cancelled';

export interface MCPTask {
  taskId: string;
  status: TaskStatus;
  ttl: number | null;
  createdAt: string;
  lastUpdatedAt: string;
  pollInterval?: number;
  statusMessage?: string;
}

export interface MCPSamplingMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

// ============ MCP Server 实现 ============

export interface RequestContext {
  signal: AbortSignal;
  sessionId?: string;
  requestId: string | number;
  sendNotification: (notification: JSONRPCNotification) => Promise<void>;
  sendRequest: (request: JSONRPCRequest, schema: any) => Promise<any>;
}

export type RequestHandler = (request: JSONRPCRequest, context: RequestContext) => Promise<any>;
export type NotificationHandler = (notification: JSONRPCNotification) => Promise<void>;

export interface MCPServerCapabilities {
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  tools?: {
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  tasks?: {
    list?: boolean;
    cancel?: boolean;
    requests?: {
      sampling?: {
        createMessage?: boolean;
      };
    };
  };
}

export interface MCPServerInfo {
  name: string;
  version: string;
  description?: string;
}

export class MCPServer {
  private requestHandlers: Map<string, RequestHandler> = new Map();
  private notificationHandlers: Map<string, NotificationHandler> = new Map();
  private responseHandlers: Map<string | number, (response: any) => void> = new Map();
  private progressHandlers: Map<string, (progress: { progress: number; total?: number; message?: string }) => void> = new Map();
  private timeoutInfo: Map<string | number, { timeoutId: any; startTime: number; timeout: number }> = new Map();
  private requestMessageId = 0;
  private capabilities: MCPServerCapabilities;
  private serverInfo: MCPServerInfo;

  constructor(options: {
    capabilities?: MCPServerCapabilities;
    serverInfo: MCPServerInfo;
  }) {
    this.capabilities = options.capabilities || {};
    this.serverInfo = options.serverInfo;
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    // Initialize request
    this.setRequestHandler('initialize', async (request) => {
      return {
        protocolVersion: '2024-11-05',
        capabilities: this.capabilities,
        serverInfo: this.serverInfo,
      };
    });

    // Ping
    this.setRequestHandler('ping', async () => ({}));
  }

  /**
   * 设置请求处理器
   */
  setRequestHandler(method: string, handler: RequestHandler): void {
    this.requestHandlers.set(method, handler);
  }

  /**
   * 移除请求处理器
   */
  removeRequestHandler(method: string): void {
    this.requestHandlers.delete(method);
  }

  /**
   * 设置通知处理器
   */
  setNotificationHandler(method: string, handler: NotificationHandler): void {
    this.notificationHandlers.set(method, handler);
  }

  /**
   * 移除通知处理器
   */
  removeNotificationHandler(method: string): void {
    this.notificationHandlers.delete(method);
  }

  /**
   * 处理传入消息
   */
  async handleMessage(
    message: JSONRPCRequest | JSONRPCNotification,
    context: Omit<RequestContext, 'sendNotification' | 'sendRequest'>
  ): Promise<JSONRPCResponse | void> {
    // 验证 JSON-RPC 格式
    if (message.jsonrpc !== '2.0') {
      throw MCPError.fromError(
        MCPErrorCode.InvalidRequest,
        'Invalid JSON-RPC version'
      );
    }

    // 检查是否为通知（无 id）
    const isNotification = !('id' in message);

    if (isNotification) {
      await this.handleNotification(message as JSONRPCNotification);
      return;
    }

    // 处理请求
    return this.handleRequest(message as JSONRPCRequest, context);
  }

  /**
   * 处理请求
   */
  private async handleRequest(
    request: JSONRPCRequest,
    context: Omit<RequestContext, 'sendNotification' | 'sendRequest'>
  ): Promise<JSONRPCResponse> {
    const handler = this.requestHandlers.get(request.method);

    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: MCPErrorCode.MethodNotFound,
          message: `Method not found: ${request.method}`,
        },
      };
    }

    try {
      const fullContext: RequestContext = {
        ...context,
        sendNotification: async (notification) => {
          // 实际实现中发送通知
          console.log(`[MCP] Notification: ${notification.method}`);
        },
        sendRequest: async (req, schema) => {
          // 实际实现中发送请求
          return this.request(req, schema);
        },
      };

      const result = await handler(request, fullContext);

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: result ?? {},
      };
    } catch (error) {
      if (error instanceof MCPError) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: error.code,
            message: error.message,
            data: error.data,
          },
        };
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: MCPErrorCode.InternalError,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      };
    }
  }

  /**
   * 处理通知
   */
  private async handleNotification(notification: JSONRPCNotification): Promise<void> {
    const handler = this.notificationHandlers.get(notification.method);

    if (handler) {
      try {
        await handler(notification);
      } catch (error) {
        console.error(`[MCP] Notification handler error: ${error}`);
      }
    }
  }

  /**
   * 发送请求
   */
  async request(request: JSONRPCRequest, responseSchema?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestMessageId;
      const fullRequest: JSONRPCRequest = {
        ...request,
        jsonrpc: '2.0',
        id,
      };

      // 设置响应处理器
      this.responseHandlers.set(id, (response) => {
        this.cleanupTimeout(id);
        
        if (response.error) {
          reject(MCPError.fromError(
            response.error.code,
            response.error.message,
            response.error.data
          ));
        } else {
          resolve(response.result);
        }
      });

      // 设置超时
      const timeout = 60000; // 60 seconds default
      const timeoutId = setTimeout(() => {
        this.responseHandlers.delete(id);
        reject(MCPError.fromError(
          MCPErrorCode.RequestTimeout,
          'Request timed out',
          { timeout }
        ));
      }, timeout);

      this.timeoutInfo.set(id, {
        timeoutId,
        startTime: Date.now(),
        timeout,
      });

      // 实际实现中发送请求
      console.log(`[MCP] Request: ${JSON.stringify(fullRequest)}`);
    });
  }

  /**
   * 处理响应
   */
  handleResponse(response: JSONRPCResponse): void {
    const handler = this.responseHandlers.get(response.id);
    if (handler) {
      handler(response);
      this.responseHandlers.delete(response.id);
    }
  }

  /**
   * 发送通知
   */
  async notify(notification: JSONRPCNotification): Promise<void> {
    const fullNotification: JSONRPCNotification = {
      ...notification,
      jsonrpc: '2.0',
    };

    // 实际实现中发送通知
    console.log(`[MCP] Notify: ${JSON.stringify(fullNotification)}`);
  }

  /**
   * 清理超时
   */
  private cleanupTimeout(id: string | number): void {
    const info = this.timeoutInfo.get(id);
    if (info) {
      clearTimeout(info.timeoutId);
      this.timeoutInfo.delete(id);
    }
  }

  /**
   * 关闭服务器
   */
  async close(): Promise<void> {
    // 清理所有超时
    for (const [id, info] of this.timeoutInfo) {
      clearTimeout(info.timeoutId);
    }
    this.timeoutInfo.clear();
    this.responseHandlers.clear();
    this.progressHandlers.clear();
  }
}

// 导出单例
export const mcpServer = new MCPServer({
  serverInfo: {
    name: 'openclaw-agent',
    version: '2.0.0',
    description: 'OpenClaw Agent MCP Server',
  },
  capabilities: {
    resources: {
      subscribe: true,
      listChanged: true,
    },
    tools: {
      listChanged: true,
    },
    prompts: {
      listChanged: true,
    },
    tasks: {
      list: true,
      cancel: true,
    },
  },
});
