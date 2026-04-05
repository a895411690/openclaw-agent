/**
 * OpenClaw Agent v2.0 - IntentEngine
 * 基于 Claude Code 架构的意图识别引擎
 */



// ============ 类型定义 ============

type IntentType = 
  | 'research'
  | 'implement'
  | 'debug'
  | 'compare'
  | 'query'
  | 'schedule'
  | 'document'
  | 'communicate'
  | 'unknown';

interface Intent {
  type: IntentType;
  confidence: number;
  keywords: string[];
  entities: Record<string, string>;
  suggestedTools: string[];
}

interface ToolChain {
  tools: string[];
  strategy: 'parallel' | 'sequential' | 'iterative';
  estimatedTime: number;
}

// ============ 意图识别模式 ============

const IntentPatterns: Record<string, RegExp[]> = {
  research: [
    /研究|分析|了解|看看|查一下|调研/,
    /什么是|怎么样|如何|为什么/,
  ],
  implement: [
    /实现|写|创建|搭建|开发|写个|做个/,
    /帮我写|帮我做|帮我搭/,
  ],
  debug: [
    /报错|失败|fix|错误|问题|bug|崩溃|卡死/,
    /怎么.*不行|为什么.*失败/,
  ],
  compare: [
    /对比|比较|vs|versus|哪个好|区别/,
  ],
  query: [
    /查询|获取|查看|列出|显示/,
    /有哪些|是什么|在哪里/,
  ],
  schedule: [
    /安排|约|会议|日历|时间|预约|提醒/,
  ],
  document: [
    /文档|文件|写入|读取|编辑|创建.*doc|创建.*表格/,
  ],
  communicate: [
    /发消息|发送|通知|告诉.*说|提醒.*一下/,
  ],
  unknown: [],
};

// ============ 工具链映射 ============

const ToolChainMap: Record<string, ToolChain> = {
  research: {
    tools: ['web_search', 'web_fetch', 'memory_search'],
    strategy: 'parallel',
    estimatedTime: 30,
  },
  implement: {
    tools: ['memory_search', 'read', 'edit', 'exec'],
    strategy: 'sequential',
    estimatedTime: 60,
  },
  debug: {
    tools: ['read', 'exec', 'web_search'],
    strategy: 'iterative',
    estimatedTime: 45,
  },
  compare: {
    tools: ['web_search'],
    strategy: 'parallel',
    estimatedTime: 20,
  },
  query: {
    tools: ['memory_search', 'read'],
    strategy: 'sequential',
    estimatedTime: 10,
  },
  schedule: {
    tools: ['lark_calendar_query', 'lark_meeting_create'],
    strategy: 'sequential',
    estimatedTime: 15,
  },
  document: {
    tools: ['lark_doc_read', 'lark_doc_write', 'lark_doc_update'],
    strategy: 'sequential',
    estimatedTime: 20,
  },
  communicate: {
    tools: ['lark_message_send', 'lark_chat_query'],
    strategy: 'sequential',
    estimatedTime: 10,
  },
  unknown: {
    tools: ['memory_search', 'ask_clarification'],
    strategy: 'sequential',
    estimatedTime: 5,
  },
};

// ============ IntentEngine 类 ============

class IntentEngine {
  private context: Map<string, any> = new Map();

  /**
   * 识别用户意图
   */
  recognize(input: string): Intent {
    const normalized = input.toLowerCase();
    let bestMatch: string = 'unknown';
    let maxConfidence = 0;
    const matchedKeywords: string[] = [];

    for (const [intentType, patterns] of Object.entries(IntentPatterns)) {
      if (intentType === 'unknown') continue;

      let matchCount = 0;
      const keywords: string[] = [];

      for (const pattern of patterns) {
        const matches = normalized.match(pattern);
        if (matches) {
          matchCount++;
          keywords.push(...matches);
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(matchCount * 0.3 + 0.4, 0.95);
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestMatch = intentType;
          matchedKeywords.length = 0;
          matchedKeywords.push(...keywords);
        }
      }
    }

    // 提取实体
    const entities = this.extractEntities(normalized);

    // 获取建议工具链
    const toolChain = ToolChainMap[bestMatch];

    return {
      type: bestMatch as IntentType,
      confidence: maxConfidence,
      keywords: matchedKeywords,
      entities,
      suggestedTools: toolChain.tools,
    };
  }

  /**
   * 提取实体（时间、人物、对象等）
   */
  private extractEntities(input: string): Record<string, string> {
    const entities: Record<string, string> = {};

    // 提取时间
    const timePattern = /(今天|明天|后天|下周|下月|\d+月\d+日|\d{4}-\d{2}-\d{2})/;
    const timeMatch = input.match(timePattern);
    if (timeMatch) entities.time = timeMatch[1];

    // 提取人物
    const personPattern = /(?:给|向|和|跟)([\u4e00-\u9fa5]{2,4})(?:说|发|聊)/;
    const personMatch = input.match(personPattern);
    if (personMatch) entities.person = personMatch[1];

    // 提取主题/对象
    const topicPattern = /(?:关于|针对|把|将)([^,.!?，。！？]+?)(?:的|进行|做)/;
    const topicMatch = input.match(topicPattern);
    if (topicMatch) entities.topic = topicMatch[1].trim();

    return entities;
  }

  /**
   * 生成执行计划
   */
  generatePlan(intent: Intent): ToolChain {
    const baseChain = ToolChainMap[intent.type];

    // 根据实体调整工具链
    const adjustedTools = [...baseChain.tools];

    if (intent.entities.time && !adjustedTools.includes('lark_calendar_query')) {
      adjustedTools.unshift('lark_calendar_query');
    }

    if (intent.entities.person && !adjustedTools.includes('lark_chat_query')) {
      adjustedTools.push('lark_chat_query');
    }

    return {
      tools: adjustedTools,
      strategy: baseChain.strategy,
      estimatedTime: baseChain.estimatedTime,
    };
  }

  /**
   * 获取执行计划描述
   */
  getPlanDescription(intent: Intent, plan: ToolChain): string {
    const strategyDesc: Record<string, string> = {
      parallel: '并行执行',
      sequential: '顺序执行',
      iterative: '迭代执行',
    };

    const toolIcons: Record<string, string> = {
      web_search: '🔍',
      web_fetch: '📄',
      memory_search: '🧠',
      read: '📖',
      edit: '✏️',
      exec: '⚡',
      lark_calendar_query: '📅',
      lark_meeting_create: '📆',
      lark_doc_read: '📄',
      lark_doc_write: '📝',
      lark_message_send: '💬',
      lark_chat_query: '👥',
    };

    const toolList = plan.tools
      .map((tool, i) => `${i + 1}. ${toolIcons[tool] || '🔧'} ${tool}`)
      .join('\n   ');

    return `
🎯 **意图识别**: ${intent.type} (置信度: ${(intent.confidence * 100).toFixed(0)}%)
🔑 **关键词**: ${intent.keywords.join(', ') || '无'}
📋 **执行策略**: ${strategyDesc[plan.strategy]}
⏱️ **预计耗时**: ${plan.estimatedTime}秒

🛠️ **工具链**:
   ${toolList}

${intent.entities.time ? `📅 **时间**: ${intent.entities.time}` : ''}
${intent.entities.person ? `👤 **人物**: ${intent.entities.person}` : ''}
${intent.entities.topic ? `📌 **主题**: ${intent.entities.topic}` : ''}
    `.trim();
  }

  /**
   * 更新上下文
   */
  setContext(key: string, value: any): void {
    this.context.set(key, value);
  }

  /**
   * 获取上下文
   */
  getContext(key: string): any {
    return this.context.get(key);
  }
}

// 导出单例
const intentEngineInstance = new IntentEngine();

module.exports = { IntentEngine, intentEngine: intentEngineInstance };
