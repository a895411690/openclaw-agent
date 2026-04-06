/**
 * OpenClaw Agent v2.0 - Scheduled Tasks
 * 定时任务管理系统
 */

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  task: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  metadata: Record<string, any>;
}

class ScheduledTasksManager {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running: boolean = false;

  constructor() {
    this.initDefaultTasks();
  }

  private initDefaultTasks() {
    this.registerTask({
      id: 'cleanup_sessions',
      name: '清理过期会话',
      description: '定期清理过期的会话，释放内存',
      schedule: '0 * * * *',
      enabled: true,
      task: async () => {
        console.log('[ScheduledTasks] 执行会话清理任务');
      },
      metadata: { priority: 'high' }
    });

    this.registerTask({
      id: 'cleanup_memory',
      name: '清理过期记忆',
      description: '清理过期的记忆项，优化存储',
      schedule: '0 0 * * *',
      enabled: true,
      task: async () => {
        console.log('[ScheduledTasks] 执行记忆清理任务');
      },
      metadata: { priority: 'medium' }
    });

    this.registerTask({
      id: 'backup_data',
      name: '数据备份',
      description: '自动备份重要数据',
      schedule: '0 2 * * *',
      enabled: true,
      task: async () => {
        console.log('[ScheduledTasks] 执行数据备份任务');
      },
      metadata: { priority: 'high' }
    });

    this.registerTask({
      id: 'generate_report',
      name: '生成日报',
      description: '每日自动生成工作日报',
      schedule: '0 18 * * *',
      enabled: false,
      task: async () => {
        console.log('[ScheduledTasks] 执行日报生成任务');
      },
      metadata: { priority: 'low' }
    });

    this.registerTask({
      id: 'check_updates',
      name: '检查更新',
      description: '检查系统和插件更新',
      schedule: '0 1 * * *',
      enabled: true,
      task: async () => {
        console.log('[ScheduledTasks] 执行更新检查任务');
      },
      metadata: { priority: 'medium' }
    });

    this.registerTask({
      id: 'sync_feishu',
      name: '同步飞书数据',
      description: '同步飞书文档、日历等数据',
      schedule: '*/30 * * * *',
      enabled: false,
      task: async () => {
        console.log('[ScheduledTasks] 执行飞书数据同步任务');
      },
      metadata: { priority: 'medium' }
    });

    this.registerTask({
      id: 'health_check',
      name: '健康检查',
      description: '检查系统健康状态',
      schedule: '*/5 * * * *',
      enabled: true,
      task: async () => {
        console.log('[ScheduledTasks] 执行健康检查任务');
      },
      metadata: { priority: 'critical' }
    });
  }

  registerTask(task: ScheduledTask) {
    this.tasks.set(task.id, task);
    console.log(`[ScheduledTasks] Registered task: ${task.name}`);
    
    if (task.enabled && this.running) {
      this.scheduleTask(task.id);
    }
  }

  private parseCron(cron: string): number {
    const parts = cron.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }
    
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    let intervalMs = 60000;
    
    if (minute !== '*') {
      intervalMs = 3600000;
    }
    if (hour !== '*') {
      intervalMs = 86400000;
    }
    
    return intervalMs;
  }

  private scheduleTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled) return;

    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId)!);
    }

    try {
      const interval = this.parseCron(task.schedule);
      
      const runTask = async () => {
        try {
          task.lastRun = new Date();
          await task.task();
          this.updateNextRun(taskId);
        } catch (error) {
          console.error(`[ScheduledTasks] Task ${task.name} failed:`, error);
        }
        
        if (task.enabled) {
          this.timers.set(taskId, setTimeout(runTask, interval));
        }
      };

      this.updateNextRun(taskId);
      this.timers.set(taskId, setTimeout(runTask, 1000));
      
    } catch (error) {
      console.error(`[ScheduledTasks] Failed to schedule task ${task.name}:`, error);
    }
  }

  private updateNextRun(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    const now = new Date();
    const interval = this.parseCron(task.schedule);
    task.nextRun = new Date(now.getTime() + interval);
  }

  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  listTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      if (this.running) {
        this.scheduleTask(taskId);
      }
      console.log(`[ScheduledTasks] Enabled task: ${task.name}`);
      return true;
    }
    return false;
  }

  disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      if (this.timers.has(taskId)) {
        clearTimeout(this.timers.get(taskId)!);
        this.timers.delete(taskId);
      }
      console.log(`[ScheduledTasks] Disabled task: ${task.name}`);
      return true;
    }
    return false;
  }

  async runTaskNow(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    console.log(`[ScheduledTasks] Running task now: ${task.name}`);
    task.lastRun = new Date();
    await task.task();
    this.updateNextRun(taskId);
  }

  start() {
    if (this.running) return;
    
    this.running = true;
    console.log('[ScheduledTasks] Starting scheduler');
    
    this.tasks.forEach((task, taskId) => {
      if (task.enabled) {
        this.scheduleTask(taskId);
      }
    });
  }

  stop() {
    if (!this.running) return;
    
    this.running = false;
    console.log('[ScheduledTasks] Stopping scheduler');
    
    this.timers.forEach((timer, taskId) => {
      clearTimeout(timer);
    });
    this.timers.clear();
  }

  isRunning(): boolean {
    return this.running;
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      enabled: tasks.filter(t => t.enabled).length,
      disabled: tasks.filter(t => !t.enabled).length,
      running: this.running,
      lastRun: tasks.filter(t => t.lastRun).sort((a, b) => 
        (b.lastRun?.getTime() || 0) - (a.lastRun?.getTime() || 0)
      )[0]?.lastRun
    };
  }
}

const scheduledTasksInstance = new ScheduledTasksManager();

module.exports = { ScheduledTasksManager, scheduledTasks: scheduledTasksInstance };
