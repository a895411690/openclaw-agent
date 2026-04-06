/**
 * OpenClaw Agent v2.0
 * 主入口 - 基于 Claude Code 架构的智能体系统
 */

const { intentEngine } = require('./core/IntentEngine');
const { schemaValidator } = require('./core/SchemaValidator');
const { taskRuntime } = require('./core/TaskRuntime');
const { contextManager } = require('./core/ContextManager');
const { skillsManager } = require('./core/SkillsManager');
const { scheduledTasks } = require('./core/ScheduledTasks');
const { enhancedMemorySystem } = require('./core/EnhancedMemorySystem');

// ============ OpenClawAgent 主类 ============

class OpenClawAgent {
  private version = '2.0.0';

  constructor() {
    // 初始化上下文
    contextManager.createSession();
    // 启动定时任务
    scheduledTasks.start();
    // 初始化增强记忆系统
    console.log('🧠 增强记忆系统初始化完成');
    console.log(`🦞 OpenClaw Agent v${this.version} initialized`);
  }

  /**
   * 处理用户输入
   */
  async process(input: string): Promise<{
    intent: any;
    plan: string;
    execution?: any;
    memoryInsights?: any;
  }> {
    // 记录对话
    contextManager.addConversation('user', input);

    // 1. 记忆检索 - 查找相关记忆
    const relevantMemories = await enhancedMemorySystem.recall({
      query: input,
      limit: 5
    });

    // 2. 意图识别
    const intent = intentEngine.recognize(input);

    // 3. 生成执行计划
    const plan = intentEngine.generatePlan(intent);
    const planDescription = intentEngine.getPlanDescription(intent, plan);

    // 4. 如果置信度足够高，直接执行
    let execution = null;
    if (intent.confidence > 0.7) {
      execution = await this.executePlan(intent, plan);
    }

    // 5. 记录助手回复
    const response = execution
      ? `执行完成: ${execution.summary}`
      : `检测到意图: ${intent.type}，请确认执行计划`;
    contextManager.addConversation('assistant', response, { intent: intent.type });

    // 6. 记忆保留 - 保存对话内容
    await enhancedMemorySystem.retain(`User: ${input}\nAssistant: ${response}`, {
      type: 'experience',
      tags: ['conversation', intent.type],
      context: {
        sessionId: contextManager.getCurrentSession()?.sessionId
      }
    });

    // 7. 定期进行记忆反思
    if (Math.random() > 0.7) {
      await enhancedMemorySystem.reflect();
    }

    return {
      intent,
      plan: planDescription,
      execution,
      memoryInsights: {
        relevantMemories: relevantMemories.length,
        memoryStats: enhancedMemorySystem.getStats()
      }
    };
  }

  /**
   * 执行计划
   */
  private async executePlan(intent: any, plan: any): Promise<any> {
    const results: any[] = [];

    for (const toolName of plan.tools) {
      // 检查工具是否存在
      const tool = schemaValidator.getToolInfo(toolName);
      if (!tool) {
        results.push({ tool: toolName, error: 'Tool not found' });
        continue;
      }

      // 执行工具
      const result = await this.executeTool(toolName, {});
      results.push({ tool: toolName, result });

      // 记录工具调用
      contextManager.recordToolCall(toolName, {}, result, 0);
    }

    return {
      summary: `Executed ${results.length} tools`,
      results,
    };
  }

  /**
   * 执行单个工具
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    // 这里实现实际的工具调用逻辑
    return { status: 'mock', tool: toolName };
  }

  /**
   * 创建子代理任务
   */
  createSubagentTask(params: {
    description: string;
    prompt: string;
    type?: any;
    runInBackground?: boolean;
  }): any {
    return taskRuntime.createTask({
      description: params.description,
      prompt: params.prompt,
      type: params.type || 'custom',
      runInBackground: params.runInBackground || false,
    });
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    version: string;
    sessionId: string | null;
    taskStats: ReturnType<typeof taskRuntime.getStats>;
    availableTools: string[];
    skillsStats: any;
    scheduledTasksStats: any;
    memoryStats: any;
  } {
    return {
      version: this.version,
      sessionId: contextManager.getCurrentSession()?.sessionId || null,
      taskStats: taskRuntime.getStats(),
      availableTools: schemaValidator.listTools(),
      skillsStats: {
        total: skillsManager.listSkills().length,
        categories: skillsManager.listCategories(),
      },
      scheduledTasksStats: scheduledTasks.getStats(),
      memoryStats: enhancedMemorySystem.getStats(),
    };
  }
}

// ============ CLI 入口 ============

async function main() {
  const agent = new OpenClawAgent();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║     🦞 OpenClaw Agent v2.1                        ║');
  console.log('║     安全加固 + 性能优化 + 功能扩展                 ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');

  const status = agent.getStatus();
  console.log('🔧 系统状态:');
  console.log('  版本:', status.version);
  console.log('  会话ID:', status.sessionId);
  console.log('');
  
  console.log('🛠️  工具系统:');
  console.log('  可用工具:', status.availableTools.length, '个');
  console.log('');
  
  console.log('🎯 技能系统:');
  console.log('  技能总数:', status.skillsStats.total);
  console.log('  技能分类:', status.skillsStats.categories.join(', '));
  console.log('');
  
  console.log('⏰ 定时任务:');
  console.log('  任务总数:', status.scheduledTasksStats.total);
  console.log('  已启用:', status.scheduledTasksStats.enabled);
  console.log('  运行状态:', status.scheduledTasksStats.running ? '运行中' : '已停止');
  console.log('');

  console.log('🧠 记忆系统:');
  console.log('  记忆总数:', status.memoryStats.totalMemories);
  console.log('  实体总数:', status.memoryStats.totalEntities);
  console.log('  关系总数:', status.memoryStats.totalRelationships);
  console.log('  记忆类型:', Object.entries(status.memoryStats.memoryTypes).map(([type, count]) => `${type}: ${count}`).join(', '));
  console.log('');

  console.log('✅ 增强功能已加载:');
  console.log('  1. 安全加固 - groupPolicy 配置');
  console.log('  2. 性能优化 - Token 和会话管理');
  console.log('  3. 功能扩展 - 8个专业技能 + 7个定时任务');
  console.log('  4. 智能记忆 - 基于 Hindsight 架构的 Retain/Recall/Reflect 系统');
  console.log('');
  console.log('🚀 系统已准备就绪，开始处理用户输入...');
  console.log('');

  // 演示：处理用户输入
  const demoInputs = [
    '研究一下 OpenClaw 的最新进展',
    '帮我写一个简单的 HTTP server',
    '安排一个下周的团队会议',
    '查一下我的日历',
  ];

  for (const input of demoInputs) {
    console.log(`\n📝 Input: "${input}"`);
    const result = await agent.process(input);
    console.log(result.plan);
    if (result.memoryInsights) {
      console.log('🧠 记忆洞察:');
      console.log('  相关记忆:', result.memoryInsights.relevantMemories, '个');
      console.log('  记忆总数:', result.memoryInsights.memoryStats.totalMemories);
    }
    console.log('─'.repeat(60));
  }
}

// 如果是直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OpenClawAgent };
