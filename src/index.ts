/**
 * OpenClaw Agent v2.0
 * 主入口 - 基于 Claude Code 架构的智能体系统
 */

const { intentEngine } = require('./core/IntentEngine');
const { schemaValidator } = require('./core/SchemaValidator');
const { taskRuntime } = require('./core/TaskRuntime');
const { contextManager } = require('./core/ContextManager');

// ============ OpenClawAgent 主类 ============

class OpenClawAgent {
  private version = '2.0.0';

  constructor() {
    // 初始化上下文
    contextManager.createSession();
    console.log(`🦞 OpenClaw Agent v${this.version} initialized`);
  }

  /**
   * 处理用户输入
   */
  async process(input: string): Promise<{
    intent: any;
    plan: string;
    execution?: any;
  }> {
    // 记录对话
    contextManager.addConversation('user', input);

    // 1. 意图识别
    const intent = intentEngine.recognize(input);

    // 2. 生成执行计划
    const plan = intentEngine.generatePlan(intent);
    const planDescription = intentEngine.getPlanDescription(intent, plan);

    // 3. 如果置信度足够高，直接执行
    let execution = null;
    if (intent.confidence > 0.7) {
      execution = await this.executePlan(intent, plan);
    }

    // 记录助手回复
    const response = execution
      ? `执行完成: ${execution.summary}`
      : `检测到意图: ${intent.type}，请确认执行计划`;
    contextManager.addConversation('assistant', response, { intent: intent.type });

    return {
      intent,
      plan: planDescription,
      execution,
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
  } {
    return {
      version: this.version,
      sessionId: contextManager.getCurrentSession()?.sessionId || null,
      taskStats: taskRuntime.getStats(),
      availableTools: schemaValidator.listTools(),
    };
  }
}

// ============ CLI 入口 ============

async function main() {
  const agent = new OpenClawAgent();

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     🦞 OpenClaw Agent v2.0             ║');
  console.log('║     Claude Code Architecture           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  const status = agent.getStatus();
  console.log('Status:', JSON.stringify(status, null, 2));
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
    console.log('─'.repeat(50));
  }
}

// 如果是直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OpenClawAgent };
