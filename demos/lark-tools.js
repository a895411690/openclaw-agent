/**
 * OpenClaw Agent v2.0 - 飞书 CLI 工具封装
 * Lark CLI Tools Integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 飞书 CLI 路径
const LARK_CLI = 'npx lark-cli';

/**
 * 执行飞书 CLI 命令
 */
function larkCommand(command, args = []) {
  try {
    const cmd = `${LARK_CLI} ${command} ${args.join(' ')}`;
    console.log(`[执行] ${cmd}`);
    const result = execSync(cmd, { encoding: 'utf-8', cwd: '/root/.openclaw/workspace/openclaw-v2' });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

/**
 * 查询日历
 */
function queryCalendar(days = 7) {
  console.log(`\n📅 查询未来 ${days} 天的日历事件...`);
  // 实际实现中调用飞书 API
  // 这里返回模拟数据
  return {
    success: true,
    events: [
      { title: '团队周会', start: '2026-04-07 10:00', end: '2026-04-07 11:00' },
      { title: '项目评审', start: '2026-04-08 14:00', end: '2026-04-08 15:30' },
    ],
  };
}

/**
 * 创建会议
 */
function createMeeting(title, startTime, duration = 60, attendees = []) {
  console.log(`\n📆 创建会议: ${title}`);
  console.log(`   时间: ${startTime}`);
  console.log(`   时长: ${duration}分钟`);
  console.log(`   参与者: ${attendees.join(', ') || '无'}`);

  return {
    success: true,
    meetingId: `meet_${Date.now()}`,
    link: `https://meetings.feishu.cn/${Date.now()}`,
  };
}

/**
 * 发送消息
 */
function sendMessage(chatId, content) {
  console.log(`\n💬 发送消息到群组: ${chatId}`);
  console.log(`   内容: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);

  return {
    success: true,
    messageId: `msg_${Date.now()}`,
  };
}

/**
 * 创建文档
 */
function createDocument(title, content, folderToken = null) {
  console.log(`\n📝 创建飞书文档: ${title}`);

  // 保存到本地作为演示
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const fileName = `doc_${Date.now()}.md`;
  const filePath = path.join(outputDir, fileName);

  const docContent = `# ${title}\n\n创建时间: ${new Date().toISOString()}\n\n---\n\n${content}`;
  fs.writeFileSync(filePath, docContent);

  console.log(`   ✓ 文档已保存到: ${filePath}`);

  return {
    success: true,
    docId: `doc_${Date.now()}`,
    url: `file://${filePath}`,
    localPath: filePath,
  };
}

/**
 * 读取文档
 */
function readDocument(docId) {
  console.log(`\n📄 读取飞书文档: ${docId}`);

  return {
    success: true,
    content: `文档 ${docId} 的内容...`,
    blocks: [],
  };
}

/**
 * 完整工作流演示：从会议到文档
 */
async function demoWorkflow() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 飞书 CLI 集成演示：会议 → 文档 → 通知');
  console.log('='.repeat(60));

  // 步骤 1: 查询日历
  const calendar = queryCalendar(7);
  console.log('\n📋 日历事件:');
  calendar.events.forEach((e, i) => {
    console.log(`   ${i + 1}. ${e.title} (${e.start})`);
  });

  // 步骤 2: 创建会议
  const meeting = createMeeting(
    'OpenClaw v2.0 架构评审',
    '2026-04-07 15:00',
    60,
    ['张三', '李四', '王五']
  );

  // 步骤 3: 创建会议文档
  const doc = createDocument(
    'OpenClaw v2.0 架构评审纪要',
    `## 会议信息
- 时间: 2026-04-07 15:00
- 会议链接: ${meeting.link}
- 参与者: 张三、李四、王五

## 议程
1. Phase 1 意图引擎回顾
2. Phase 2 任务运行时演示
3. Phase 3 上下文架构说明
4. Phase 4 飞书 CLI 集成验证

## 待办
- [ ] 完善飞书工具封装
- [ ] 实现真实 API 调用
- [ ] 端到端工作流测试
`,
  );

  // 步骤 4: 发送通知
  const message = sendMessage(
    'team-group-id',
    `📅 会议创建成功！\n\n主题: OpenClaw v2.0 架构评审\n时间: 2026-04-07 15:00\n文档: ${doc.url}\n\n请准时参加~`
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ 工作流完成！');
  console.log('='.repeat(60));
  console.log('\n📊 执行摘要:');
  console.log(`   • 日历查询: ${calendar.events.length} 个事件`);
  console.log(`   • 会议创建: ${meeting.meetingId}`);
  console.log(`   • 文档创建: ${doc.docId}`);
  console.log(`   • 消息发送: ${message.messageId}`);
  console.log('');
}

// 导出模块
module.exports = {
  larkCommand,
  queryCalendar,
  createMeeting,
  sendMessage,
  createDocument,
  readDocument,
  demoWorkflow,
};

// 如果直接运行此文件
if (require.main === module) {
  demoWorkflow();
}
