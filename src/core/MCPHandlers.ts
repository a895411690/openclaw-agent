/**
 * OpenClaw Agent v2.0 - MCP Handlers
 * MCP 资源、工具、提示模板处理器
 */

import { MCPServer, MCPResource, MCPTool, MCPPrompt, MCPTask } from './MCPProtocol.js';

// ============ Resource Handlers ============

export interface ResourceHandler {
  list(): Promise<MCPResource[]>;
  read(uri: string): Promise<MCPResource>;
  subscribe?(uri: string): Promise<void>;
  unsubscribe?(uri: string): Promise<void>;
}

export class FileResourceHandler implements ResourceHandler {
  private files: Map<string, MCPResource> = new Map();

  constructor() {
    // 初始化示例资源
    this.files.set('file:///workspace/README.md', {
      uri: 'file:///workspace/README.md',
      name: 'README.md',
      mimeType: 'text/markdown',
      description: 'Project README',
    });
  }

  async list(): Promise<MCPResource[]> {
    return Array.from(this.files.values());
  }

  async read(uri: string): Promise<MCPResource> {
    const resource = this.files.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    // 实际实现中读取文件内容
    return {
      ...resource,
      text: `# README\n\nContent for ${uri}`,
    };
  }

  async subscribe(uri: string): Promise<void> {
    console.log(`[Resource] Subscribed to: ${uri}`);
  }

  async unsubscribe(uri: string): Promise<void> {
    console.log(`[Resource] Unsubscribed from: ${uri}`);
  }
}

// ============ Tool Handlers ============

export interface ToolHandler {
  name: string;
  description: string;
  inputSchema: MCPTool['inputSchema'];
  execute(input: any): Promise<any>;
}

export class WebSearchTool implements ToolHandler {
  name = 'web_search';
  description = 'Search the web for information';
  inputSchema = {
    type: 'object' as const,
    properties: {
      queries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Search queries',
      },
    },
    required: ['queries'],
  };

  async execute(input: { queries: string[] }): Promise<any> {
    // 实际实现中调用搜索 API
    return {
      results: input.queries.map((query) => ({
        title: `Result for: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        snippet: 'Search result snippet...',
      })),
    };
  }
}

export class FileReadTool implements ToolHandler {
  name = 'file_read';
  description = 'Read file contents';
  inputSchema = {
    type: 'object' as const,
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file',
      },
      offset: {
        type: 'number',
        description: 'Line offset (optional)',
      },
      limit: {
        type: 'number',
        description: 'Line limit (optional)',
      },
    },
    required: ['file_path'],
  };

  async execute(input: { file_path: string; offset?: number; limit?: number }): Promise<any> {
    // 实际实现中读取文件
    return {
      content: `File content for: ${input.file_path}`,
      lines: 10,
      truncated: false,
    };
  }
}

export class FileEditTool implements ToolHandler {
  name = 'file_edit';
  description = 'Edit file contents';
  inputSchema = {
    type: 'object' as const,
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file',
      },
      old_string: {
        type: 'string',
        description: 'String to replace',
      },
      new_string: {
        type: 'string',
        description: 'Replacement string',
      },
    },
    required: ['file_path', 'old_string', 'new_string'],
  };

  async execute(input: { file_path: string; old_string: string; new_string: string }): Promise<any> {
    // 实际实现中编辑文件
    return {
      success: true,
      changes: 1,
    };
  }
}

// ============ Prompt Handlers ============

export interface PromptHandler {
  name: string;
  description?: string;
  arguments?: MCPPrompt['arguments'];
  get(args?: Record<string, string>): Promise<{ messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }> }>;
}

export class CodeReviewPrompt implements PromptHandler {
  name = 'code_review';
  description = 'Code review prompt template';
  arguments = [
    {
      name: 'language',
      description: 'Programming language',
      required: true,
    },
    {
      name: 'code',
      description: 'Code to review',
      required: true,
    },
  ];

  async get(args?: Record<string, string>): Promise<any> {
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text',
            text: `Please review the following ${args?.language || 'code'} code:\n\n${args?.code || ''}`,
          },
        },
      ],
    };
  }
}

export class DebugPrompt implements PromptHandler {
  name = 'debug';
  description = 'Debug error prompt template';
  arguments = [
    {
      name: 'error',
      description: 'Error message',
      required: true,
    },
    {
      name: 'context',
      description: 'Additional context',
      required: false,
    },
  ];

  async get(args?: Record<string, string>): Promise<any> {
    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text',
            text: `Help me debug this error:\n\n${args?.error || ''}\n\nContext: ${args?.context || ''}`,
          },
        },
      ],
    };
  }
}

// ============ Task Handlers ============

export class TaskManager {
  private tasks: Map<string, MCPTask> = new Map();
  private taskResults: Map<string, any> = new Map();

  async createTask(
    description: string,
    ttl?: number
  ): Promise<MCPTask> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const task: MCPTask = {
      taskId,
      status: 'working',
      ttl: ttl ?? 300,
      createdAt: now,
      lastUpdatedAt: now,
      pollInterval: 1000,
    };

    this.tasks.set(taskId, task);

    // 模拟异步任务
    this.runTask(taskId, description);

    return task;
  }

  private async runTask(taskId: string, description: string): Promise<void> {
    // 模拟任务执行
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const task = this.tasks.get(taskId);
    if (task && task.status === 'working') {
      this.updateTaskStatus(taskId, 'completed', 'Task completed successfully');
      this.taskResults.set(taskId, {
        content: [{ type: 'text', text: `Completed: ${description}` }],
      });
    }
  }

  async getTask(taskId: string): Promise<MCPTask | undefined> {
    return this.tasks.get(taskId);
  }

  async listTasks(cursor?: string): Promise<{ tasks: MCPTask[]; nextCursor?: string }> {
    const tasks = Array.from(this.tasks.values());
    return { tasks };
  }

  async cancelTask(taskId: string): Promise<MCPTask | undefined> {
    const task = this.tasks.get(taskId);
    if (task && !['completed', 'failed', 'cancelled'].includes(task.status)) {
      this.updateTaskStatus(taskId, 'cancelled', 'Task cancelled by user');
      return this.tasks.get(taskId);
    }
    return task;
  }

  async getTaskResult(taskId: string): Promise<any> {
    return this.taskResults.get(taskId);
  }

  private updateTaskStatus(
    taskId: string,
    status: MCPTask['status'],
    message?: string
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      task.lastUpdatedAt = new Date().toISOString();
      if (message) {
        task.statusMessage = message;
      }
    }
  }
}

// ============ Setup MCP Handlers ============

export function setupMCPHandlers(server: MCPServer): void {
  const resourceHandler = new FileResourceHandler();
  const taskManager = new TaskManager();
  const tools: ToolHandler[] = [
    new WebSearchTool(),
    new FileReadTool(),
    new FileEditTool(),
  ];
  const prompts: PromptHandler[] = [
    new CodeReviewPrompt(),
    new DebugPrompt(),
  ];

  // Resources
  server.setRequestHandler('resources/list', async (request) => {
    const resources = await resourceHandler.list();
    return { resources };
  });

  server.setRequestHandler('resources/read', async (request) => {
    const { uri } = request.params || {};
    if (!uri) {
      throw new Error('URI is required');
    }
    const contents = [await resourceHandler.read(uri)];
    return { contents };
  });

  server.setRequestHandler('resources/subscribe', async (request) => {
    const { uri } = request.params || {};
    if (resourceHandler.subscribe) {
      await resourceHandler.subscribe(uri);
    }
    return {};
  });

  // Tools
  server.setRequestHandler('tools/list', async (request) => {
    const toolList: MCPTool[] = tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
    return { tools: toolList };
  });

  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params || {};
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    const result = await tool.execute(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  });

  // Prompts
  server.setRequestHandler('prompts/list', async (request) => {
    const promptList: MCPPrompt[] = prompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    }));
    return { prompts: promptList };
  });

  server.setRequestHandler('prompts/get', async (request) => {
    const { name, arguments: args } = request.params || {};
    const prompt = prompts.find((p) => p.name === name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }
    return prompt.get(args);
  });

  // Tasks
  server.setRequestHandler('tasks/create', async (request) => {
    const { task } = request.params || {};
    const newTask = await taskManager.createTask(
      task?.description || 'Unnamed task',
      task?.ttl
    );
    return { task: newTask };
  });

  server.setRequestHandler('tasks/get', async (request) => {
    const { taskId } = request.params || {};
    const task = await taskManager.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return { ...task };
  });

  server.setRequestHandler('tasks/result', async (request) => {
    const { taskId } = request.params || {};
    const result = await taskManager.getTaskResult(taskId);
    return result || {};
  });

  server.setRequestHandler('tasks/list', async (request) => {
    const { tasks, nextCursor } = await taskManager.listTasks();
    return { tasks, nextCursor };
  });

  server.setRequestHandler('tasks/cancel', async (request) => {
    const { taskId } = request.params || {};
    const task = await taskManager.cancelTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return {};
  });

  console.log('[MCP] All handlers registered');
}
