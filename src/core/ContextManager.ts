/**
 * OpenClaw Agent v2.0 - ContextManager
 * 三层上下文架构：Global / Session / Task
 * 参考: Claude Code Context Layers
 */

// ============ 类型定义 ============

export interface GlobalContext {
  // 全局配置
  config: {
    model: string;
    maxTokens: number;
    temperature: number;
    workingDirectory: string;
    outputDirectory: string;
  };
  // 环境变量
  env: Record<string, string>;
  // 全局状态
  state: Map<string, any>;
}

export interface SessionContext {
  // 会话标识
  sessionId: string;
  // 对话历史
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  // 工作目录
  workingDirectory: string;
  // 环境状态
  environment: {
    cwd: string;
    env: Record<string, string>;
    shell: string;
  };
  // 会话级变量
  variables: Map<string, any>;
}

export interface TaskContext {
  // 任务标识
  taskId: string;
  // 父任务（如果有）
  parentTaskId: string | null;
  // 任务特定记忆
  memory: Map<string, any>;
  // 中间结果
  intermediateResults: Map<string, any>;
  // 工具调用历史
  toolHistory: Array<{
    tool: string;
    input: any;
    output: any;
    timestamp: Date;
    duration: number;
  }>;
}

export interface FullContext {
  global: GlobalContext;
  session: SessionContext;
  task: TaskContext | null;
}

// ============ ContextManager 类 ============

export class ContextManager {
  private globalContext: GlobalContext;
  private sessionContexts: Map<string, SessionContext> = new Map();
  private taskContexts: Map<string, TaskContext> = new Map();
  private currentSessionId: string | null = null;
  private currentTaskId: string | null = null;

  constructor() {
    // 初始化全局上下文
    this.globalContext = {
      config: {
        model: 'default',
        maxTokens: 200000,
        temperature: 0.7,
        workingDirectory: process.cwd(),
        outputDirectory: './output',
      },
      env: { ...process.env } as Record<string, string>,
      state: new Map(),
    };
  }

  // ============ Global Context ============

  /**
   * 获取全局配置
   */
  getGlobalConfig(): GlobalContext['config'] {
    return { ...this.globalContext.config };
  }

  /**
   * 更新全局配置
   */
  updateGlobalConfig(updates: Partial<GlobalContext['config']>): void {
    this.globalContext.config = { ...this.globalContext.config, ...updates };
  }

  /**
   * 设置全局状态
   */
  setGlobalState(key: string, value: any): void {
    this.globalContext.state.set(key, value);
  }

  /**
   * 获取全局状态
   */
  getGlobalState(key: string): any {
    return this.globalContext.state.get(key);
  }

  // ============ Session Context ============

  /**
   * 创建会话
   */
  createSession(sessionId?: string): SessionContext {
    const id = sessionId || this.generateSessionId();
    const session: SessionContext = {
      sessionId: id,
      conversationHistory: [],
      workingDirectory: process.cwd(),
      environment: {
        cwd: process.cwd(),
        env: { ...process.env } as Record<string, string>,
        shell: process.env.SHELL || '/bin/bash',
      },
      variables: new Map(),
    };

    this.sessionContexts.set(id, session);
    this.currentSessionId = id;

    return session;
  }

  /**
   * 切换会话
   */
  switchSession(sessionId: string): boolean {
    if (this.sessionContexts.has(sessionId)) {
      this.currentSessionId = sessionId;
      return true;
    }
    return false;
  }

  /**
   * 获取当前会话
   */
  getCurrentSession(): SessionContext | null {
    if (!this.currentSessionId) return null;
    return this.sessionContexts.get(this.currentSessionId) || null;
  }

  /**
   * 添加对话记录
   */
  addConversation(role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
      metadata,
    });

    // 限制历史记录长度
    if (session.conversationHistory.length > 100) {
      session.conversationHistory = session.conversationHistory.slice(-100);
    }
  }

  /**
   * 获取对话历史
   */
  getConversationHistory(limit?: number): SessionContext['conversationHistory'] {
    const session = this.getCurrentSession();
    if (!session) return [];

    const history = session.conversationHistory;
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return [...history];
  }

  /**
   * 设置会话变量
   */
  setSessionVariable(key: string, value: any): void {
    const session = this.getCurrentSession();
    if (session) {
      session.variables.set(key, value);
    }
  }

  /**
   * 获取会话变量
   */
  getSessionVariable(key: string): any {
    const session = this.getCurrentSession();
    return session?.variables.get(key);
  }

  // ============ Task Context ============

  /**
   * 创建任务上下文
   */
  createTaskContext(taskId: string, parentTaskId?: string): TaskContext {
    const taskContext: TaskContext = {
      taskId,
      parentTaskId: parentTaskId || null,
      memory: new Map(),
      intermediateResults: new Map(),
      toolHistory: [],
    };

    this.taskContexts.set(taskId, taskContext);
    this.currentTaskId = taskId;

    return taskContext;
  }

  /**
   * 获取当前任务上下文
   */
  getCurrentTaskContext(): TaskContext | null {
    if (!this.currentTaskId) return null;
    return this.taskContexts.get(this.currentTaskId) || null;
  }

  /**
   * 记录工具调用
   */
  recordToolCall(tool: string, input: any, output: any, duration: number): void {
    const taskContext = this.getCurrentTaskContext();
    if (taskContext) {
      taskContext.toolHistory.push({
        tool,
        input,
        output,
        timestamp: new Date(),
        duration,
      });
    }
  }

  /**
   * 设置任务中间结果
   */
  setIntermediateResult(key: string, value: any): void {
    const taskContext = this.getCurrentTaskContext();
    if (taskContext) {
      taskContext.intermediateResults.set(key, value);
    }
  }

  /**
   * 获取任务中间结果
   */
  getIntermediateResult(key: string): any {
    const taskContext = this.getCurrentTaskContext();
    return taskContext?.intermediateResults.get(key);
  }

  // ============ 完整上下文获取 ============

  /**
   * 获取完整上下文（用于注入到 AI）
   */
  getFullContext(): FullContext {
    return {
      global: this.globalContext,
      session: this.getCurrentSession() || this.createSession(),
      task: this.getCurrentTaskContext(),
    };
  }

  /**
   * 构建上下文提示
   */
  buildContextPrompt(): string {
    const fullContext = this.getFullContext();
    const lines: string[] = [];

    // 全局上下文
    lines.push('=== 全局配置 ===');
    lines.push(`工作目录: ${fullContext.global.config.workingDirectory}`);
    lines.push(`模型: ${fullContext.global.config.model}`);
    lines.push('');

    // 会话上下文
    lines.push('=== 会话信息 ===');
    lines.push(`会话ID: ${fullContext.session.sessionId}`);
    lines.push(`当前目录: ${fullContext.session.workingDirectory}`);
    lines.push(`Shell: ${fullContext.session.environment.shell}`);
    lines.push('');

    // 最近的对话历史
    lines.push('=== 最近对话 ===');
    const recentHistory = fullContext.session.conversationHistory.slice(-5);
    for (const msg of recentHistory) {
      const time = msg.timestamp.toISOString().slice(11, 19);
      lines.push(`[${time}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    }
    lines.push('');

    // 任务上下文
    if (fullContext.task) {
      lines.push('=== 当前任务 ===');
      lines.push(`任务ID: ${fullContext.task.taskId}`);
      lines.push(`父任务: ${fullContext.task.parentTaskId || '无'}`);
      lines.push(`工具调用次数: ${fullContext.task.toolHistory.length}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  // ============ 工具方法 ============

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 清理过期上下文
   */
  cleanup(maxAge: number): { sessions: number; tasks: number } {
    const now = Date.now();
    let sessionsCleaned = 0;
    let tasksCleaned = 0;

    // 清理过期会话
    for (const [id, session] of this.sessionContexts) {
      const lastActivity = session.conversationHistory[session.conversationHistory.length - 1]?.timestamp;
      if (lastActivity && now - lastActivity.getTime() > maxAge) {
        this.sessionContexts.delete(id);
        sessionsCleaned++;
      }
    }

    // 清理过期任务
    for (const [id, task] of this.taskContexts) {
      const lastToolCall = task.toolHistory[task.toolHistory.length - 1]?.timestamp;
      if (lastToolCall && now - lastToolCall.getTime() > maxAge) {
        this.taskContexts.delete(id);
        tasksCleaned++;
      }
    }

    return { sessions: sessionsCleaned, tasks: tasksCleaned };
  }
}

// 导出单例
const contextManager = new ContextManager();

module.exports = { ContextManager, contextManager };
