/**
 * OpenClaw Agent v2.0 - SchemaValidator
 * 基于 Zod 的严格 Schema 验证系统
 * 参考: Claude Code 的工具模式架构
 */

const { z, ZodSchema, ZodError } = require('zod');

// ============ 基础类型 Schema ============

export const FilePathSchema = z.string().min(1).max(4096);
export const ContentSchema = z.string().max(10 * 1024 * 1024); // 10MB max
export const OffsetSchema = z.number().int().min(0).optional();
export const LimitSchema = z.number().int().min(1).max(10000).optional();

// ============ 工具输入 Schema ============

export const ReadInputSchema = z.object({
  file_path: FilePathSchema,
  offset: OffsetSchema,
  limit: LimitSchema,
}).strict();

export const EditInputSchema = z.object({
  file_path: FilePathSchema,
  old_string: z.string(),
  new_string: z.string(),
}).strict();

export const WriteInputSchema = z.object({
  file_path: FilePathSchema,
  content: ContentSchema,
}).strict();

export const ExecInputSchema = z.object({
  command: z.string().min(1).max(4096),
  workdir: FilePathSchema.optional(),
  timeout: z.number().int().min(1).max(3600).optional(),
  env: z.record(z.string()).optional(),
}).strict();

export const WebSearchInputSchema = z.object({
  queries: z.array(z.string().min(1).max(500)).min(1).max(10),
}).strict();

export const WebFetchInputSchema = z.object({
  url: z.string().url(),
  max_chars: z.number().int().min(100).max(100000).optional(),
}).strict();

export const AgentInputSchema = z.object({
  description: z.string().min(3).max(100),
  prompt: z.string().min(10).max(100000),
  subagent_type: z.enum(['research', 'code', 'debug', 'review']).optional(),
  model: z.enum(['default', 'reasoning', 'fast']).optional(),
  run_in_background: z.boolean().optional(),
}).strict();

// ============ 飞书工具 Schema ============

export const LarkCalendarQuerySchema = z.object({
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  days: z.number().int().min(1).max(30).optional(),
}).strict();

export const LarkMeetingCreateSchema = z.object({
  title: z.string().min(1).max(500),
  start_time: z.string().datetime(),
  duration_minutes: z.number().int().min(5).max(480),
  attendees: z.array(z.string()).optional(),
  description: z.string().max(2000).optional(),
}).strict();

export const LarkDocReadSchema = z.object({
  doc_id: z.string().min(1),
  block_id: z.string().optional(),
}).strict();

export const LarkDocWriteSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(100000),
  folder_token: z.string().optional(),
}).strict();

export const LarkMessageSendSchema = z.object({
  chat_id: z.string().min(1),
  content: z.string().min(1).max(10000),
  message_type: z.enum(['text', 'markdown', 'card']).default('text'),
}).strict();

// ============ 工具注册表 ============

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  requiresPermission: boolean;
  permissionCategory: string;
}

export const ToolRegistry: Record<string, ToolDefinition> = {
  read: {
    name: 'read',
    description: '读取文件内容',
    inputSchema: ReadInputSchema,
    outputSchema: z.object({
      content: z.string(),
      lines: z.number(),
      truncated: z.boolean(),
    }),
    requiresPermission: false,
    permissionCategory: 'filesystem.read',
  },
  edit: {
    name: 'edit',
    description: '编辑文件内容（old_string → new_string）',
    inputSchema: EditInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      changes: z.number(),
    }),
    requiresPermission: true,
    permissionCategory: 'filesystem.write',
  },
  write: {
    name: 'write',
    description: '写入文件（覆盖）',
    inputSchema: WriteInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      bytes_written: z.number(),
    }),
    requiresPermission: true,
    permissionCategory: 'filesystem.write',
  },
  exec: {
    name: 'exec',
    description: '执行命令',
    inputSchema: ExecInputSchema,
    outputSchema: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exit_code: z.number(),
    }),
    requiresPermission: true,
    permissionCategory: 'system.execute',
  },
  web_search: {
    name: 'web_search',
    description: '搜索网络',
    inputSchema: WebSearchInputSchema,
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      })),
    }),
    requiresPermission: false,
    permissionCategory: 'web.search',
  },
  web_fetch: {
    name: 'web_fetch',
    description: '抓取网页内容',
    inputSchema: WebFetchInputSchema,
    outputSchema: z.object({
      content: z.string(),
      title: z.string().optional(),
    }),
    requiresPermission: false,
    permissionCategory: 'web.fetch',
  },
  agent: {
    name: 'agent',
    description: '创建子代理任务',
    inputSchema: AgentInputSchema,
    outputSchema: z.object({
      task_id: z.string(),
      status: z.enum(['created', 'running', 'completed', 'failed']),
    }),
    requiresPermission: true,
    permissionCategory: 'agent.create',
  },
  // 飞书工具
  lark_calendar_query: {
    name: 'lark_calendar_query',
    description: '查询日历事件',
    inputSchema: LarkCalendarQuerySchema,
    outputSchema: z.object({
      events: z.array(z.any()),
    }),
    requiresPermission: true,
    permissionCategory: 'lark.calendar',
  },
  lark_meeting_create: {
    name: 'lark_meeting_create',
    description: '创建会议',
    inputSchema: LarkMeetingCreateSchema,
    outputSchema: z.object({
      meeting_id: z.string(),
      link: z.string(),
    }),
    requiresPermission: true,
    permissionCategory: 'lark.meeting',
  },
  lark_doc_read: {
    name: 'lark_doc_read',
    description: '读取飞书文档',
    inputSchema: LarkDocReadSchema,
    outputSchema: z.object({
      content: z.string(),
      blocks: z.array(z.any()).optional(),
    }),
    requiresPermission: true,
    permissionCategory: 'lark.doc',
  },
  lark_doc_write: {
    name: 'lark_doc_write',
    description: '创建飞书文档',
    inputSchema: LarkDocWriteSchema,
    outputSchema: z.object({
      doc_id: z.string(),
      url: z.string(),
    }),
    requiresPermission: true,
    permissionCategory: 'lark.doc',
  },
  lark_message_send: {
    name: 'lark_message_send',
    description: '发送飞书消息',
    inputSchema: LarkMessageSendSchema,
    outputSchema: z.object({
      message_id: z.string(),
    }),
    requiresPermission: true,
    permissionCategory: 'lark.message',
  },
};

// ============ SchemaValidator 类 ============

export class SchemaValidator {
  private customSchemas: Map<string, ZodSchema> = new Map();

  /**
   * 验证工具输入
   */
  validateInput(toolName: string, input: unknown): { success: true; data: any } | { success: false; errors: string[] } {
    const tool = ToolRegistry[toolName];
    if (!tool) {
      return { success: false, errors: [`未知工具: ${toolName}`] };
    }

    try {
      const validated = tool.inputSchema.parse(input);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { success: false, errors };
      }
      return { success: false, errors: ['验证失败'] };
    }
  }

  /**
   * 验证工具输出
   */
  validateOutput(toolName: string, output: unknown): { success: true; data: any } | { success: false; errors: string[] } {
    const tool = ToolRegistry[toolName];
    if (!tool) {
      return { success: false, errors: [`未知工具: ${toolName}`] };
    }

    try {
      const validated = tool.outputSchema.parse(output);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { success: false, errors };
      }
      return { success: false, errors: ['输出验证失败'] };
    }
  }

  /**
   * 检查工具是否需要权限
   */
  requiresPermission(toolName: string): boolean {
    const tool = ToolRegistry[toolName];
    return tool?.requiresPermission ?? false;
  }

  /**
   * 获取工具权限类别
   */
  getPermissionCategory(toolName: string): string | null {
    const tool = ToolRegistry[toolName];
    return tool?.permissionCategory ?? null;
  }

  /**
   * 注册自定义 Schema
   */
  registerSchema(name: string, schema: ZodSchema): void {
    this.customSchemas.set(name, schema);
  }

  /**
   * 获取所有工具列表
   */
  listTools(): string[] {
    return Object.keys(ToolRegistry);
  }

  /**
   * 获取工具详情
   */
  getToolInfo(toolName: string): ToolDefinition | null {
    return ToolRegistry[toolName] ?? null;
  }
}

// 导出单例
const schemaValidator = new SchemaValidator();

module.exports = { SchemaValidator, schemaValidator, ToolRegistry };
