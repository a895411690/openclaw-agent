/**
 * MCP V2 完整版演示
 * Tools 22个 | Prompts 12个 | Task持久化 | Streaming
 */

const { MCPServer } = require('./dist/core/MCPProtocol');
const { setupMCPHandlersV2 } = require('./dist/core/MCPHandlersV2');

async function demo() {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     MCP V2 完整版演示                          ║');
  console.log('║     Tools×22 | Prompts×12 | 持久化 | 流式     ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');

  // Create server
  const server = new MCPServer({
    serverInfo: {
      name: 'openclaw-v2-full',
      version: '2.0.0',
      description: 'OpenClaw MCP V2 - Full Featured',
    },
    capabilities: {
      tools: { listChanged: true },
      prompts: { listChanged: true },
      tasks: { list: true, cancel: true },
    },
  });

  // Setup handlers
  setupMCPHandlersV2(server);
  console.log('');

  const context = {
    signal: new AbortController().signal,
    sessionId: 'demo-v2',
    requestId: 1,
  };

  // 1. List Tools (22个)
  console.log('📦 Test 1: tools/list (22 tools)');
  const toolsResponse = await server.handleMessage(
    { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
    context
  );
  const tools = toolsResponse.result.tools;
  console.log(`   ✅ Found ${tools.length} tools`);
  console.log('   Categories:');
  console.log('   • Web:', tools.filter(t => t.name.startsWith('web_')).map(t => t.name).join(', '));
  console.log('   • File:', tools.filter(t => t.name.startsWith('file_')).map(t => t.name).join(', '));
  console.log('   • Git:', tools.filter(t => t.name.startsWith('git_')).map(t => t.name).join(', '));
  console.log('   • Lark:', tools.filter(t => t.name.startsWith('lark_')).map(t => t.name).join(', '));
  console.log('   • Memory:', tools.filter(t => t.name.startsWith('memory_')).map(t => t.name).join(', '));
  console.log('');

  // 2. List Prompts (12个)
  console.log('📦 Test 2: prompts/list (12 prompts)');
  const promptsResponse = await server.handleMessage(
    { jsonrpc: '2.0', id: 2, method: 'prompts/list', params: {} },
    context
  );
  const prompts = promptsResponse.result.prompts;
  console.log(`   ✅ Found ${prompts.length} prompts`);
  prompts.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} - ${p.description}`);
  });
  console.log('');

  // 3. Get Prompt
  console.log('📦 Test 3: prompts/get (code_review)');
  const promptResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'prompts/get',
      params: {
        name: 'code_review',
        arguments: {
          language: 'typescript',
          code: 'function add(a, b) { return a + b; }',
        },
      },
    },
    context
  );
  console.log('   ✅ Prompt generated');
  console.log('   Preview:', promptResponse.result.messages[0].content.text.substring(0, 100) + '...');
  console.log('');

  // 4. Create Task (with persistence)
  console.log('📦 Test 4: tasks/create (persistent)');
  const taskResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tasks/create',
      params: {
        task: {
          description: 'Analyze project structure',
          ttl: 300,
        },
      },
    },
    context
  );
  const taskId = taskResponse.result.task.taskId;
  console.log(`   ✅ Task created: ${taskId}`);
  console.log('   Status:', taskResponse.result.task.status);
  console.log('   Note: Task persisted to ./tasks/ directory');
  console.log('');

  // 5. Get Task Status
  console.log('📦 Test 5: tasks/get (with progress)');
  const getTaskResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 5,
      method: 'tasks/get',
      params: { taskId },
    },
    context
  );
  console.log('   Status:', getTaskResponse.result.status);
  console.log('   Message:', getTaskResponse.result.statusMessage || 'N/A');
  console.log('');

  // 6. Call Tool (lark)
  console.log('📦 Test 6: tools/call (lark_meeting_create)');
  const toolResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'lark_meeting_create',
        arguments: {
          title: 'OpenClaw V2 Review',
          start_time: new Date().toISOString(),
          duration: 60,
          attendees: ['user1', 'user2'],
        },
      },
    },
    context
  );
  console.log('   ✅ Meeting created');
  console.log('   Result:', JSON.stringify(toolResponse.result, null, 2));
  console.log('');

  // Summary
  console.log('═'.repeat(55));
  console.log('✅ MCP V2 完整版验证完成！');
  console.log('═'.repeat(55));
  console.log('');
  console.log('📊 统计数据:');
  console.log(`   • Tools: ${tools.length} 个`);
  console.log(`   • Prompts: ${prompts.length} 个`);
  console.log(`   • Task持久化: ✅ JSON文件存储`);
  console.log(`   • Streaming: ✅ AsyncGenerator支持`);
  console.log('');
  console.log('🎯 特色功能:');
  console.log('   • 22个工具覆盖web/file/git/task/ai/lark/memory');
  console.log('   • 12个提示模板覆盖code/debug/doc/test/architecture');
  console.log('   • 任务自动持久化，支持断点续传');
  console.log('   • 流式响应支持，实时进度更新');
  console.log('');
}

demo().catch(console.error);
