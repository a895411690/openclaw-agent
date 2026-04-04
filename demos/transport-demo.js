/**
 * Transport Layer 演示
 */

const { TransportManager, StdioTransport, HTTPTransport, SSETransport } = require('./dist/core/Transport');

async function demo() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Transport Layer 演示               ║');
  console.log('║     Claude Code Architecture           ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  const manager = new TransportManager();

  // 注册传输层
  manager.register('stdio', new StdioTransport(), true);
  manager.register('http', new HTTPTransport('http://localhost:3000'));
  manager.register('sse', new SSETransport('http://localhost:3000/events'));

  console.log('✅ 已注册传输层:', manager.list().join(', '));
  console.log('✅ 默认传输层:', 'stdio');
  console.log('');

  // 连接所有传输层
  await manager.connectAll();
  console.log('');

  // 获取默认传输层
  const transport = manager.get();
  console.log('📡 使用传输层:', transport.constructor.name);
  console.log('📡 连接状态:', transport.isActive() ? '已连接' : '未连接');
  console.log('');

  // 发送测试消息
  const testMessage = {
    id: `msg_${Date.now()}`,
    type: 'request',
    method: 'test',
    params: { hello: 'world' },
    timestamp: Date.now(),
  };

  console.log('📤 发送消息:', JSON.stringify(testMessage, null, 2));
  await transport.send(testMessage);
  console.log('✅ 消息已发送');
  console.log('');

  // 断开连接
  await manager.disconnectAll();
  console.log('');
  console.log('✅ Transport Layer 演示完成！');
}

demo().catch(console.error);
