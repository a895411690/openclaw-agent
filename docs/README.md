# OpenClaw Agent v2.0

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/openclaw-agent)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

> 🦞 OpenClaw Agent v2.0 - 基于 Claude Code 架构的智能体系统
> 
> 完整实现 MCP 协议、意图驱动编排、飞书集成、任务持久化

[English](#english) | [中文](#中文)

---

## 🌟 English

### Features

- 🤖 **Intent Engine** - 8 types of intent recognition with entity extraction
- 🛠️ **22 Tools** - Web, file, git, shell, Lark (Feishu), memory tools
- 📝 **12 Prompts** - Code review, debug, documentation templates
- 🔌 **MCP Protocol** - Full JSON-RPC 2.0 + Model Context Protocol implementation
- 💾 **Task Persistence** - Persistent task storage with resume support
- 🌊 **Streaming** - Real-time streaming responses
- 🚀 **Multi-Channel** - stdio, HTTP, SSE transport support
- 📱 **Lark Integration** - Calendar, meetings, docs, messaging

### Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run demo
npm run demo

# Run MCP V2 demo
node mcp-v2-demo.js
```

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                 OpenClaw Agent v2.0                 │
├─────────────────────────────────────────────────────┤
│  Transport Layer → Protocol Layer → Agent Loop      │
│  (stdio/http/sse)   (MCP)          (Intent→Tools)   │
├─────────────────────────────────────────────────────┤
│  Tools (22)  │  Prompts (12)  │  Tasks │  Resources │
├─────────────────────────────────────────────────────┤
│  Web │ File │ Git │ Shell │ Lark │ Memory          │
└─────────────────────────────────────────────────────┘
```

### Documentation

- [Architecture Analysis](./CLAUDE_CODE_ARCHITECTURE.md) - Claude Code architecture study
- [Evolution Guide](./ARCHITECTURE_EVOLUTION.md) - OpenClaw evolution roadmap
- [Code Review](./AI_TOOL_HUB_REVIEW.md) - Code quality review

---

## 🌟 中文

### 核心特性

- 🤖 **意图引擎** - 8种意图识别 + 实体提取
- 🛠️ **22个工具** - 网页、文件、Git、Shell、飞书、记忆
- 📝 **12个提示** - 代码审查、调试、文档模板
- 🔌 **MCP协议** - 完整 JSON-RPC 2.0 + Model Context Protocol
- 💾 **任务持久化** - 支持断点续传
- 🌊 **流式响应** - 实时流式输出
- 🚀 **多通道** - 支持 stdio、HTTP、SSE
- 📱 **飞书集成** - 日历、会议、文档、消息

### 快速开始

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 运行演示
npm run demo

# 运行 MCP V2 演示
node mcp-v2-demo.js
```

### 系统架构

```
┌─────────────────────────────────────────────────────┐
│                 OpenClaw Agent v2.0                 │
├─────────────────────────────────────────────────────┤
│  传输层 → 协议层 → 智能体循环                         │
│  (stdio/http/sse)   (MCP)          (意图→工具)       │
├─────────────────────────────────────────────────────┤
│  工具(22)  │  提示(12)  │  任务  │  资源              │
├─────────────────────────────────────────────────────┤
│  网页 │ 文件 │ Git │ Shell │ 飞书 │ 记忆              │
└─────────────────────────────────────────────────────┘
```

### 文档

- [架构分析](./CLAUDE_CODE_ARCHITECTURE.md) - Claude Code 架构学习
- [进化指南](./ARCHITECTURE_EVOLUTION.md) - OpenClaw 演进路线
- [代码审查](./AI_TOOL_HUB_REVIEW.md) - 代码质量审查

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Total Lines** | ~4,200 lines |
| **Tools** | 22 |
| **Prompts** | 12 |
| **Core Modules** | 8 |
| **Test Coverage** | Demo ready |

---

## 🛠️ Tech Stack

- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 18+
- **Protocol**: MCP (Model Context Protocol)
- **Validation**: Zod 3.22+
- **Transport**: stdio, HTTP, SSE

---

## 📦 Project Structure

```
openclaw-v2/
├── src/
│   ├── core/
│   │   ├── IntentEngine.ts          # 意图引擎
│   │   ├── SchemaValidator.ts       # Schema验证
│   │   ├── TaskRuntime.ts           # 任务运行时
│   │   ├── ContextManager.ts        # 上下文管理
│   │   ├── Transport.ts             # 传输层
│   │   ├── MCPProtocol.ts           # MCP协议
│   │   ├── MCPHandlers.ts           # MCP处理器
│   │   └── MCPHandlersV2.ts         # MCP完整版
│   └── index.ts                     # 主入口
├── docs/
│   ├── CLAUDE_CODE_ARCHITECTURE.md  # 架构分析
│   ├── ARCHITECTURE_EVOLUTION.md    # 进化指南
│   └── AI_TOOL_HUB_REVIEW.md        # 代码审查
├── demos/
│   ├── demo.js                      # 意图演示
│   ├── mcp-demo.js                  # MCP演示
│   ├── mcp-v2-demo.js               # MCP V2演示
│   └── transport-demo.js            # 传输层演示
├── lark-tools.js                    # 飞书工具封装
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Roadmap

### ✅ Completed (v2.0.0)
- [x] Intent Engine with 8 types
- [x] 22 Tools (Web, File, Git, Lark, etc.)
- [x] 12 Prompts (Code, Debug, Doc, etc.)
- [x] MCP Protocol (JSON-RPC 2.0)
- [x] Task Persistence
- [x] Streaming Support
- [x] Multi-Channel Transport

### 🔄 Planned (v2.1.0)
- [ ] Modularize MCPHandlersV2.ts
- [ ] Add LRU caching
- [ ] Implement connection pooling
- [ ] Add middleware system
- [ ] Improve type safety

### 📅 Future (v3.0.0)
- [ ] Plugin architecture
- [ ] ML-based intent recognition
- [ ] Distributed task execution
- [ ] Web UI dashboard

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Claude Code](https://www.anthropic.com) - Architecture reference
- [Model Context Protocol](https://modelcontextprotocol.io) - Protocol specification
- [Lark (Feishu)](https://open.larkoffice.com) - Integration support

---

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

<p align="center">
  <strong>🦞 OpenClaw Agent - Building the future of AI agents</strong>
</p>
