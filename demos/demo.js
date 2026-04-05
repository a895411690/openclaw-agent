/**
 * OpenClaw Agent v2.0 - 快速演示
 * 简化版 JavaScript 实现
 */

const z = require('zod');

// ============ IntentEngine ============
const IntentPatterns = {
  research: [/研究|分析|了解|看看|查一下|调研/, /什么是|怎么样|如何|为什么/],
  implement: [/实现|写|创建|搭建|开发|写个|做个/, /帮我写|帮我做|帮我搭/],
  debug: [/报错|失败|fix|错误|问题|bug|崩溃|卡死/, /怎么.*不行|为什么.*失败/],
  compare: [/对比|比较|vs|versus|哪个好|区别/],
  query: [/查询|获取|查看|列出|显示/, /有哪些|是什么|在哪里/],
  schedule: [/安排|约|会议|日历|时间|预约|提醒/],
  document: [/文档|文件|写入|读取|编辑|创建.*doc|创建.*表格/],
  communicate: [/发消息|发送|通知|告诉.*说|提醒.*一下/],
};

const ToolChainMap = {
  research: { tools: ['web_search', 'web_fetch', 'memory_search'], strategy: 'parallel', estimatedTime: 30 },
  implement: { tools: ['memory_search', 'read', 'edit', 'exec'], strategy: 'sequential', estimatedTime: 60 },
  debug: { tools: ['read', 'exec', 'web_search'], strategy: 'iterative', estimatedTime: 45 },
  compare: { tools: ['web_search'], strategy: 'parallel', estimatedTime: 20 },
  query: { tools: ['memory_search', 'read'], strategy: 'sequential', estimatedTime: 10 },
  schedule: { tools: ['lark_calendar_query', 'lark_meeting_create'], strategy: 'sequential', estimatedTime: 15 },
  document: { tools: ['lark_doc_read', 'lark_doc_write', 'lark_doc_update'], strategy: 'sequential', estimatedTime: 20 },
  communicate: { tools: ['lark_message_send', 'lark_chat_query'], strategy: 'sequential', estimatedTime: 10 },
};

function recognizeIntent(input) {
  const normalized = input.toLowerCase();
  let bestMatch = 'unknown';
  let maxConfidence = 0;
  const matchedKeywords = [];

  for (const [intentType, patterns] of Object.entries(IntentPatterns)) {
    let matchCount = 0;
    const keywords = [];

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

  return {
    type: bestMatch,
    confidence: maxConfidence,
    keywords: matchedKeywords,
    suggestedTools: ToolChainMap[bestMatch]?.tools || [],
  };
}

// ============ 演示 ============
console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║     🦞 OpenClaw Agent v2.0             ║');
console.log('║     Claude Code Architecture           ║');
console.log('║     核心架构验证演示                   ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

const demoInputs = [
  '研究一下 OpenClaw 的最新进展',
  '帮我写一个简单的 HTTP server',
  '安排一个下周的团队会议',
  '查一下我的日历',
  '对比一下 Claude Code 和 OpenClaw',
  '报错：找不到模块',
];

console.log(`✅ 已加载 ${Object.keys(IntentPatterns).length} 种意图模式`);
console.log(`✅ 已配置 ${Object.keys(ToolChainMap).length} 个工具链映射`);
console.log('');
console.log('─'.repeat(50));

for (const input of demoInputs) {
  const intent = recognizeIntent(input);
  const plan = ToolChainMap[intent.type] || { tools: [], strategy: 'unknown', estimatedTime: 0 };

  console.log(`\n📝 输入: "${input}"`);
  console.log(`🎯 意图: ${intent.type} (置信度: ${(intent.confidence * 100).toFixed(0)}%)`);
  console.log(`🔑 关键词: ${intent.keywords.join(', ') || '无'}`);
  console.log(`🛠️  工具链: ${plan.tools.join(' → ') || '询问澄清'}`);
  console.log(`📋 策略: ${plan.strategy} | ⏱️ 预计: ${plan.estimatedTime}s`);
  console.log('─'.repeat(50));
}

console.log('\n✅ 核心架构验证完成！');
console.log('');
console.log('下一步: 集成飞书 CLI 真实工具');
