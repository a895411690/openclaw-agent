# Claude Code 2.1.88 架构分析

> cli.js 逆向工程结果 - 格式化版
> 用于学习进化 OpenClaw Agent v2.0

---

## 1. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE RUNTIME v2.1.88                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Transport  │───▶│   Protocol   │───▶│    Agent     │      │
│  │   Layer      │    │   Layer      │    │    Loop      │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Transport   │    │  JSON-RPC    │    │  Tool Chain  │      │
│  │  (stdio/     │    │  Handler     │    │  Execution   │      │
│  │   sse/http)  │    │              │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    MCP (Model Context Protocol)            │   │
│  │  ├─ resources/list, resources/read, resources/subscribe   │   │
│  │  ├─ tools/list, tools/call                               │   │
│  │  ├─ prompts/list, prompts/get                            │   │
│  │  ├─ tasks/create, tasks/get, tasks/cancel                │   │
│  │  └─ sampling/createMessage                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Transport Layer（传输层）

```typescript
class Transport {
  // 支持多种传输方式
  - stdio          // 标准输入输出
  - sse            // Server-Sent Events
  - http           // HTTP 请求
  - websocket      // WebSocket（推测）

  async send(message, options)
  async receive()
  async close()
}
```

### 2.1 传输方式对比

| 方式 | 适用场景 | 特点 |
|------|----------|------|
| stdio | 本地 CLI | 简单、快速、进程内 |
| sse | 远程连接 | 单向流、自动重连 |
| http | API 调用 | 请求响应、无状态 |
| websocket | 实时交互 | 双向流、低延迟 |

---

## 3. Protocol Layer（协议层）

```typescript
class Protocol {
  // 请求处理
  - requestHandlers: Map<method, handler>
  - notificationHandlers: Map<method, handler>

  // 响应管理
  - responseHandlers: Map<id, resolver>
  - progressHandlers: Map<token, callback>

  // 超时控制
  - timeoutInfo: Map<id, timeoutConfig>

  async request(method, params, schema)
  async notification(method, params)
  setRequestHandler(schema, handler)
  setNotificationHandler(schema, handler)
}
```

### 3.1 JSON-RPC 消息格式

```typescript
// 请求
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: object;
}

// 响应
interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

---

## 4. Task System（任务系统）

```typescript
class TaskManager {
  // 任务生命周期
  createTask(description, ttl)
  getTask(taskId)
  cancelTask(taskId)
  listTasks(cursor)

  // 任务状态机
  status: "working" | "input_required" | "completed" | "failed" | "cancelled"

  // 任务队列（支持断点续传）
  - taskMessageQueue: MessageQueue
  - taskStore: TaskStore
}
```

### 4.1 任务状态流转

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ pending │────▶│ working │────▶│completed│
└─────────┘     └────┬────┘     └─────────┘
      │              │
      │              ▼
      │         ┌─────────┐
      └────────▶│ failed  │
                └─────────┘
```

---

## 5. Tool Execution Engine（工具执行引擎）

```typescript
class ToolExecutor {
  // 工具注册表
  registry: Map<toolName, ToolDefinition>

  // 执行上下文
  execute(toolName, input, context): Promise<output>

  // 权限检查
  assertCapabilityForMethod(method)
  assertTaskCapability(method)
}
```

### 5.1 工具定义模式

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  requiresPermission: boolean;
}
```

---

## 6. Context Management（上下文管理）

```typescript
ContextLayers = {
  global: {
    // 全局配置、环境变量
  },
  session: {
    // 会话级状态
    // - conversation history
    // - working directory
    // - environment
  },
  task: {
    // 任务级状态
    // - task-specific memory
    // - intermediate results
  }
}
```

---

## 7. MCP (Model Context Protocol)

### 7.1 Resources（资源）

```typescript
// 资源定义
interface Resource {
  uri: string;
  name: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// 资源操作
resources/list      // 列出可用资源
resources/read      // 读取资源内容
resources/subscribe // 订阅资源变更
```

### 7.2 Tools（工具）

```typescript
// 工具定义
interface Tool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
}

// 工具操作
tools/list          // 列出可用工具
tools/call          // 调用工具
```

### 7.3 Prompts（提示模板）

```typescript
// 提示模板定义
interface Prompt {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

// 提示操作
prompts/list        // 列出可用模板
prompts/get         // 获取模板内容
```

### 7.4 Tasks（任务）

```typescript
// 任务操作
tasks/create        // 创建任务
tasks/get           // 获取任务状态
tasks/cancel        // 取消任务
```

---

## 8. 关键设计模式

### 8.1 严格的 Schema 验证（Zod）

```typescript
const RequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number().int()]),
  method: z.string(),
  params: z.object({...}).optional()
}).strict();
```

### 8.2 异步流式处理（Async Iterator）

```typescript
async* requestStream(request, responseSchema, options) {
  yield { type: "taskCreated", task }
  yield { type: "taskStatus", task }
  yield { type: "result", result }
}
```

### 8.3 取消机制（AbortController）

```typescript
const controller = new AbortController();
request(..., { signal: controller.signal });
controller.abort("User cancelled");
```

### 8.4 进度追踪（Progress Token）

```typescript
request(..., {
  onprogress: (progress) => {
    console.log(`${progress.progress}/${progress.total}`)
  }
});
```

---

## 9. 工具类型系统

```typescript
export type ToolInputSchemas =
  | AgentInput      // 子代理系统
  | BashInput       // 命令执行
  | FileReadInput   // 文件读取
  | FileWriteInput  // 文件写入
  | FileEditInput   // 文件编辑
  | GlobInput       // 文件匹配
  | GrepInput       // 代码搜索
  | WebSearchInput  // 网络搜索
  | WebFetchInput   // 网页抓取
  | McpInput        // Model Context Protocol
  | TodoWriteInput  // 任务管理
  | ...
```

---

## 10. 权限系统

```typescript
export interface ExitPlanModeInput {
  allowedPrompts?: {
    tool: "Bash";
    prompt: string;  // 语义化权限描述
  }[];
}
```

### 10.1 语义化权限 vs 命令权限

| 传统方式 | Claude Code 方式 |
|----------|------------------|
| "允许 ls 命令" | "允许查看目录内容" |
| "允许 npm test" | "允许运行测试" |
| "允许 rm -rf" | ❌ 不允许 |

---

## 11. 对 OpenClaw 的启示

### 11.1 需要实现的核心组件

| 组件 | 状态 | 优先级 |
|------|------|--------|
| Transport Layer | 🟡 抽象设计完成 | 高 |
| Protocol Layer (MCP) | 🟡 基础框架 | 高 |
| Task System | 🟡 框架完成 | 高 |
| Tool Executor | 🟡 框架完成 | 高 |
| Context Manager | ✅ 已完成 | 中 |
| Schema Validator | ✅ 已完成 | 中 |
| Permission System | ❌ 待实现 | 中 |

### 11.2 架构改进点

1. **MCP 协议兼容** - 实现标准 MCP 接口
2. **任务持久化** - 支持长时间任务的断点续传
3. **传输层抽象** - 统一不同消息渠道的接口
4. **严格 Schema 验证** - 所有工具输入/输出需验证
5. **流式响应** - 支持逐步返回结果

---

## 12. 文件信息

- **原始文件**: cli.js (claude-code-2.1.88.tgz)
- **文件大小**: ~13MB
- **代码行数**: ~16,668 行 (编译后 Bundle)
- **分析时间**: 2026-04-04
- **格式化版本**: v1.0

---

*此文档基于 cli.js 逆向工程结果整理*
*用于 OpenClaw Agent v2.0 架构进化*
