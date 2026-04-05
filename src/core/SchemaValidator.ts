/**
 * OpenClaw Agent v2.0 - SchemaValidator
 * 简化版 Schema 验证系统
 */

interface ToolDefinition {
  name: string;
  description: string;
  requiresPermission: boolean;
  permissionCategory: string;
}

const SchemaToolRegistry: Record<string, ToolDefinition> = {
  read: {
    name: 'read',
    description: '读取文件内容',
    requiresPermission: false,
    permissionCategory: 'filesystem.read',
  },
  edit: {
    name: 'edit',
    description: '编辑文件内容（old_string → new_string）',
    requiresPermission: true,
    permissionCategory: 'filesystem.write',
  },
  write: {
    name: 'write',
    description: '写入文件（覆盖）',
    requiresPermission: true,
    permissionCategory: 'filesystem.write',
  },
  exec: {
    name: 'exec',
    description: '执行命令',
    requiresPermission: true,
    permissionCategory: 'system.execute',
  },
  web_search: {
    name: 'web_search',
    description: '搜索网络',
    requiresPermission: false,
    permissionCategory: 'web.search',
  },
  web_fetch: {
    name: 'web_fetch',
    description: '抓取网页内容',
    requiresPermission: false,
    permissionCategory: 'web.fetch',
  },
  agent: {
    name: 'agent',
    description: '创建子代理任务',
    requiresPermission: true,
    permissionCategory: 'agent.create',
  },
  lark_calendar_query: {
    name: 'lark_calendar_query',
    description: '查询日历事件',
    requiresPermission: true,
    permissionCategory: 'lark.calendar',
  },
  lark_meeting_create: {
    name: 'lark_meeting_create',
    description: '创建会议',
    requiresPermission: true,
    permissionCategory: 'lark.meeting',
  },
  lark_doc_read: {
    name: 'lark_doc_read',
    description: '读取飞书文档',
    requiresPermission: true,
    permissionCategory: 'lark.doc',
  },
  lark_doc_write: {
    name: 'lark_doc_write',
    description: '创建飞书文档',
    requiresPermission: true,
    permissionCategory: 'lark.doc',
  },
  lark_message_send: {
    name: 'lark_message_send',
    description: '发送飞书消息',
    requiresPermission: true,
    permissionCategory: 'lark.message',
  },
};

class SchemaValidator {
  validateInput(toolName: string, input: unknown): { success: true; data: any } | { success: false; errors: string[] } {
    const tool = SchemaToolRegistry[toolName];
    if (!tool) {
      return { success: false, errors: [`未知工具: ${toolName}`] };
    }
    return { success: true, data: input };
  }

  validateOutput(toolName: string, output: unknown): { success: true; data: any } | { success: false; errors: string[] } {
    const tool = SchemaToolRegistry[toolName];
    if (!tool) {
      return { success: false, errors: [`未知工具: ${toolName}`] };
    }
    return { success: true, data: output };
  }

  requiresPermission(toolName: string): boolean {
    const tool = SchemaToolRegistry[toolName];
    return tool?.requiresPermission ?? false;
  }

  getPermissionCategory(toolName: string): string | null {
    const tool = SchemaToolRegistry[toolName];
    return tool?.permissionCategory ?? null;
  }

  registerSchema(name: string, schema: any): void {
  }

  listTools(): string[] {
    return Object.keys(SchemaToolRegistry);
  }

  getToolInfo(toolName: string): ToolDefinition | null {
    return SchemaToolRegistry[toolName] ?? null;
  }
}

const schemaValidatorInstance = new SchemaValidator();

module.exports = { SchemaValidator, schemaValidator: schemaValidatorInstance, ToolRegistry: SchemaToolRegistry };
