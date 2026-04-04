/**
 * OpenClaw Agent v2.0 - TaskRuntime
 * 任务运行时 - 子代理管理 + 后台队列 + 状态持久化
 * 参考: Claude Code Agent System
 */

const { z } = require('zod');

// ============ 类型定义 ============

export const TaskStatus = z.enum([
  'pending',      // 等待执行
  'running',      // 执行中
  'completed',    // 已完成
  'failed',       // 失败
  'cancelled',    // 已取消
]);

export type TaskStatus = z.infer<typeof TaskStatus>;

export interface Task {
  id: string;
  parentId: string | null;
  type: 'research' | 'code' | 'debug' | 'review' | 'custom';
  description: string;
  prompt: string;
  status: TaskStatus;
  model: 'default' | 'reasoning' | 'fast';
  runInBackground: boolean;
  outputFile: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number; // seconds
  tokens: number;
  output: string;
  error: string | null;
  metadata: Record<string, any>;
}

export interface TaskQueue {
  pending: Task[];
  running: Task[];
  completed: Task[];
  failed: Task[];
}

// ============ TaskRuntime 类 ============

export class TaskRuntime {
  private tasks: Map<string, Task> = new Map();
  private queue: TaskQueue = {
    pending: [],
    running: [],
    completed: [],
    failed: [],
  };
  private maxConcurrent: number = 3;
  private outputDir: string = './task_outputs';

  constructor(options?: { maxConcurrent?: number; outputDir?: string }) {
    if (options?.maxConcurrent) this.maxConcurrent = options.maxConcurrent;
    if (options?.outputDir) this.outputDir = options.outputDir;
  }

  /**
   * 创建任务
   */
  createTask(params: {
    description: string;
    prompt: string;
    type?: Task['type'];
    model?: Task['model'];
    runInBackground?: boolean;
    parentId?: string;
  }): Task {
    const task: Task = {
      id: this.generateTaskId(),
      parentId: params.parentId ?? null,
      type: params.type ?? 'custom',
      description: params.description,
      prompt: params.prompt,
      status: 'pending',
      model: params.model ?? 'default',
      runInBackground: params.runInBackground ?? false,
      outputFile: params.runInBackground ? `${this.outputDir}/task_${Date.now()}.json` : null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      duration: 0,
      tokens: 0,
      output: '',
      error: null,
      metadata: {},
    };

    this.tasks.set(task.id, task);
    this.queue.pending.push(task);

    // 触发任务调度
    this.scheduleTasks();

    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) ?? null;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    return this.tasks.get(taskId)?.status ?? null;
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === 'pending') {
      // 从 pending 队列移除
      this.queue.pending = this.queue.pending.filter(t => t.id !== taskId);
      task.status = 'cancelled';
      task.completedAt = new Date();
      return true;
    }

    if (task.status === 'running') {
      // 标记为取消，实际取消逻辑由执行器处理
      task.status = 'cancelled';
      task.completedAt = new Date();
      // 从 running 队列移除
      this.queue.running = this.queue.running.filter(t => t.id !== taskId);
      return true;
    }

    return false;
  }

  /**
   * 列出任务
   */
  listTasks(filter?: { status?: TaskStatus; type?: Task['type'] }): Task[] {
    let tasks = Array.from(this.tasks.values());

    if (filter?.status) {
      tasks = tasks.filter(t => t.status === filter.status);
    }

    if (filter?.type) {
      tasks = tasks.filter(t => t.type === filter.type);
    }

    return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * 调度任务
   */
  private scheduleTasks(): void {
    // 检查是否可以启动新任务
    while (
      this.queue.running.length < this.maxConcurrent &&
      this.queue.pending.length > 0
    ) {
      const task = this.queue.pending.shift();
      if (task) {
        this.startTask(task);
      }
    }
  }

  /**
   * 启动任务
   */
  private startTask(task: Task): void {
    task.status = 'running';
    task.startedAt = new Date();
    this.queue.running.push(task);

    // 异步执行任务
    this.executeTask(task).then(() => {
      // 任务完成，调度下一个
      this.scheduleTasks();
    });
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task): Promise<void> {
    const startTime = Date.now();

    try {
      // 这里调用实际的 AI 执行逻辑
      // 简化版本：模拟执行
      const output = await this.simulateExecution(task);

      task.output = output;
      task.status = 'completed';
      task.completedAt = new Date();
      task.duration = Math.floor((Date.now() - startTime) / 1000);

      // 移动到 completed 队列
      this.queue.running = this.queue.running.filter(t => t.id !== task.id);
      this.queue.completed.push(task);

      // 如果是后台任务，保存到文件
      if (task.runInBackground && task.outputFile) {
        await this.saveTaskOutput(task);
      }

    } catch (error) {
      task.error = error instanceof Error ? error.message : String(error);
      task.status = 'failed';
      task.completedAt = new Date();
      task.duration = Math.floor((Date.now() - startTime) / 1000);

      // 移动到 failed 队列
      this.queue.running = this.queue.running.filter(t => t.id !== task.id);
      this.queue.failed.push(task);
    }
  }

  /**
   * 模拟任务执行（实际实现中替换为真实的 AI 调用）
   */
  private async simulateExecution(task: Task): Promise<string> {
    // 模拟执行时间
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `Task "${task.description}" completed.\nType: ${task.type}\nPrompt: ${task.prompt.substring(0, 100)}...`;
  }

  /**
   * 保存任务输出到文件
   */
  private async saveTaskOutput(task: Task): Promise<void> {
    const output = {
      id: task.id,
      description: task.description,
      status: task.status,
      output: task.output,
      error: task.error,
      duration: task.duration,
      tokens: task.tokens,
      completedAt: task.completedAt,
    };

    // 实际实现中写入文件
    console.log(`[TaskRuntime] Task output saved to ${task.outputFile}`);
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取队列统计
   */
  getStats(): {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.tasks.size,
      pending: this.queue.pending.length,
      running: this.queue.running.length,
      completed: this.queue.completed.length,
      failed: this.queue.failed.length,
    };
  }

  /**
   * 清理已完成的任务
   */
  cleanup(completedBefore: Date): number {
    let cleaned = 0;
    for (const [id, task] of this.tasks) {
      if (
        (task.status === 'completed' || task.status === 'failed') &&
        task.completedAt &&
        task.completedAt < completedBefore
      ) {
        this.tasks.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// 导出单例
const taskRuntime = new TaskRuntime();

module.exports = { TaskRuntime, taskRuntime };
