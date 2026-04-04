/**
 * MCP Protocol 演示
 */

const { MCPServer, MCPErrorCode } = require('./dist/core/MCPProtocol');
const { setupMCPHandlers } = require('./dist/core/MCPHandlers');

async function demo() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     MCP Protocol 演示                  ║');
  console.log('║     Model Context Protocol v2.0        ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // 创建 MCP Server
  const server = new MCPServer({
    serverInfo: {
      name: 'openclaw-demo',
      version: '2.0.0',
      description: 'OpenClaw MCP Demo Server',
    },
    capabilities: {
      resources: {
        subscribe: true,
        listChanged: true,
      },
      tools: {
        listChanged: true,
      },
      prompts: {
        listChanged: true,
      },
      tasks: {
        list: true,
        cancel: true,
      },
    },
  });

  // 设置处理器
  setupMCPHandlers(server);
  console.log('✅ MCP Server initialized');
  console.log('');

  // 模拟客户端请求
  const clientContext = {
    signal: new AbortController().signal,
    sessionId: 'demo-session',
    requestId: 1,
  };

  // 1. Initialize
  console.log('📡 Test 1: Initialize');
  const initResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'demo-client',
          version: '1.0.0',
        },
      },
    },
    clientContext
  );
  console.log('   Response:', JSON.stringify(initResponse.result, null, 2));
  console.log('');

  // 2. List Resources
  console.log('📡 Test 2: resources/list');
  const resourcesResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/list',
      params: {},
    },
    clientContext
  );
  console.log('   Resources:', JSON.stringify(resourcesResponse.result.resources, null, 2));
  console.log('');

  // 3. List Tools
  console.log('📡 Test 3: tools/list');
  const toolsResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {},
    },
    clientContext
  );
  console.log('   Tools:', toolsResponse.result.tools.map((t) => t.name).join(', '));
  console.log('');

  // 4. Call Tool (web_search)
  console.log('📡 Test 4: tools/call (web_search)');
  const toolResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'web_search',
        arguments: {
          queries: ['OpenClaw MCP', 'Claude Code'],
        },
      },
    },
    clientContext
  );
  console.log('   Result:', JSON.stringify(toolResponse.result, null, 2));
  console.log('');

  // 5. List Prompts
  console.log('📡 Test 5: prompts/list');
  const promptsResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 5,
      method: 'prompts/list',
      params: {},
    },
    clientContext
  );
  console.log('   Prompts:', promptsResponse.result.prompts.map((p) => p.name).join(', '));
  console.log('');

  // 6. Create Task
  console.log('📡 Test 6: tasks/create');
  const taskResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 6,
      method: 'tasks/create',
      params: {
        task: {
          description: 'Analyze project structure',
          ttl: 300,
        },
      },
    },
    clientContext
  );
  console.log('   Task created:', taskResponse.result.task.taskId);
  console.log('   Status:', taskResponse.result.task.status);
  console.log('');

  // 7. Get Task
  console.log('📡 Test 7: tasks/get');
  const getTaskResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 7,
      method: 'tasks/get',
      params: {
        taskId: taskResponse.result.task.taskId,
      },
    },
    clientContext
  );
  console.log('   Task status:', getTaskResponse.result.status);
  console.log('');

  // 8. Error Handling Test
  console.log('📡 Test 8: Error Handling (unknown method)');
  const errorResponse = await server.handleMessage(
    {
      jsonrpc: '2.0',
      id: 8,
      method: 'unknown/method',
      params: {},
    },
    clientContext
  );
  console.log('   Error code:', errorResponse.error.code);
  console.log('   Error message:', errorResponse.error.message);
  console.log('');

  console.log('═'.repeat(50));
  console.log('✅ MCP Protocol Demo Complete!');
  console.log('═'.repeat(50));
  console.log('');
  console.log('Implemented:');
  console.log('  • JSON-RPC 2.0 Protocol');
  console.log('  • Resources (list, read, subscribe)');
  console.log('  • Tools (list, call)');
  console.log('  • Prompts (list, get)');
  console.log('  • Tasks (create, get, list, cancel)');
  console.log('  • Error Handling');
  console.log('');
}

demo().catch(console.error);
