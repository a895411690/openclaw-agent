# 🦞 OpenClaw Agent v2.2

基于 Claude Code 架构的智能体系统 - 安全、高效、功能强大

---

## 📋 项目简介

OpenClaw Agent 是一个基于 Claude Code 2.1.88 架构的智能体系统，具有以下特点：

- **安全加固** - 严格的权限控制和文件保护
- **性能优化** - 智能的 Token 管理和会话管理
- **功能扩展** - 丰富的专业技能和定时任务
- **文件保护** - 防止配置文件被意外还原
- **MCP 协议** - 完整的 Model Context Protocol 支持
- **智能记忆** - 基于 Hindsight 架构的 Retain/Recall/Reflect 系统

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

### 3. 运行演示

```bash
npm run start
```

### 4. 部署到 OpenClaw

1. **配置文件设置**
   ```bash
   # 复制配置模板
   cp config/security.json.example config/security.json
   cp config/performance.json.example config/performance.json
   cp config/protection.json.example config/protection.json
   
   # 根据需要修改配置
   ```

2. **初始化文件保护**
   ```bash
   chmod +x scripts/protect-files.sh
   ./scripts/protect-files.sh setup
   ```

3. **在 OpenClaw 平台部署**
   - 登录 OpenClaw 平台
   - 进入智能体管理
   - 选择 "从 GitHub 导入"
   - 输入仓库 URL: `https://github.com/a895411690/openclaw-agent`
   - 选择 main 分支
   - 点击 "部署"

---

## 🌟 核心功能

### 🔒 安全加固

- **群组策略**: `groupPolicy: "allowlist"` - 白名单模式
- **私聊策略**: `dmPolicy: "pairing"` - 配对模式
- **权限控制**: 高权限工具受限制
- **速率限制**: 每分钟 60 次请求，每天 200k tokens
- **Git 保护**: 配置文件在合并时保留本地版本

### ⚡ 性能优化

- **Token 管理**: 最大 16k 上下文，4k 响应，自动修剪
- **会话管理**: 最多 10 个活跃会话，24h TTL
- **记忆管理**: 最多 1000 项，7 天过期，自动压缩
- **缓存系统**: 100 项，5 分钟过期

### 🎯 专业技能 (8个)

1. **代码审查** - 自动审查代码质量和安全问题
2. **文档生成** - 自动生成 API 文档和 README
3. **测试生成** - 自动生成单元测试和集成测试
4. **数据分析** - 分析数据、生成图表和洞察
5. **图像生成** - 根据描述生成图片和设计稿
6. **内容创作** - 撰写文章、博客和营销文案
7. **多语言翻译** - 支持多种语言互译
8. **会议纪要** - 记录会议内容和行动项

### ⏰ 定时任务 (7个)

1. **清理过期会话** - 每小时执行
2. **清理过期记忆** - 每天执行
3. **数据备份** - 每天凌晨 2 点执行
4. **生成日报** - 每天下午 6 点执行
5. **检查更新** - 每天凌晨 1 点执行
6. **同步飞书数据** - 每 30 分钟执行
7. **健康检查** - 每 5 分钟执行

### 🧠 智能记忆系统

基于 Hindsight 架构的增强记忆系统，实现了三大核心操作：

1. **Retain (记忆保留)** - 自动保存重要的对话内容和经验
   - 支持 5 种记忆类型：事实、经验、技能、决策、洞察
   - 自动提取实体和生成标签
   - 构建实体关系图谱
   - 最多保存 10,000 条记忆

2. **Recall (记忆回忆)** - 根据用户输入智能检索相关记忆
   - 支持关键词、实体、标签、时间范围多维度检索
   - 计算相关性分数并排序
   - 记忆使用频率自动提升置信度
   - 时间衰减机制保持记忆新鲜度

3. **Reflect (记忆反思)** - 定期分析记忆并生成洞察
   - 自动识别记忆模式和趋势
   - 生成改进建议
   - 记忆衰减和清理机制
   - 智能合并和压缩相似记忆

**特点**：
- 实体关系网络构建
- 记忆质量自动评估
- 智能记忆优先级管理
- 记忆导入/导出功能

### 🛡️ 文件保护系统

- **Git 保护**: `.gitattributes` 防止合并覆盖
- **自动备份**: 重要文件自动备份
- **紧急恢复**: 完整的恢复指南
- **使用工具**: `./scripts/protect-files.sh`

---

## 📁 项目结构

```
openclaw-agent/
├── config/                    # 配置文件
│   ├── security.json.example  # 安全配置模板
│   ├── performance.json.example  # 性能配置模板
│   └── protection.json.example  # 文件保护配置模板
├── docs/                      # 文档
│   ├── FILE_PROTECTION_GUIDE.md  # 文件保护指南
│   └── ...
├── scripts/                   # 脚本
│   ├── protect-files.sh       # 文件保护脚本
│   ├── backup.sh              # 备份脚本
│   └── restore.sh             # 恢复脚本
├── src/                       # 源代码
│   ├── core/                  # 核心模块
│   │   ├── EnhancedMemorySystem.ts  # 增强记忆系统
│   │   ├── SkillsManager.ts   # 技能管理器
│   │   ├── ScheduledTasks.ts  # 定时任务管理器
│   │   ├── IntentEngine.ts    # 意图识别引擎
│   │   ├── MCPHandlersV2.ts   # MCP 协议处理
│   │   └── ...
│   └── index.ts               # 主入口
├── .gitattributes             # Git 属性配置
├── .gitignore                 # Git 忽略配置
├── package.json               # 项目配置
└── README.md                  # 项目说明
```

---

## 📖 使用指南

### 日常使用

```bash
# 启动 Agent
npm run start

# 构建项目
npm run build

# 检查文件保护状态
./scripts/protect-files.sh status

# 备份重要文件
./scripts/protect-files.sh backup

# 查看帮助
./scripts/protect-files.sh help
```

### 安全 Git 操作

```bash
# ✅ 安全操作
git pull
git push
git status
git diff

# ❌ 危险操作 (不要使用!)
git restore config/security.json
git checkout -- config/performance.json
git reset --hard HEAD~1
git merge -X theirs
```

### 紧急恢复

如果文件被意外还原：

```bash
# 1. 检查备份
ls -la backup/protected/

# 2. 从备份恢复
cp backup/protected/security.json.<timestamp> config/security.json
```

---

## 🔧 配置说明

### 安全配置 (`config/security.json`)

```json
{
  "channels": {
    "feishu": {
      "groupPolicy": "allowlist",
      "dmPolicy": "pairing"
    }
  },
  "toolPermissions": {
    "elevatedTools": ["bash", "exec"],
    "defaultPolicy": "ask"
  }
}
```

### 性能配置 (`config/performance.json`)

```json
{
  "tokenManagement": {
    "maxContextTokens": 16000,
    "autoTrimContext": true
  },
  "sessionManagement": {
    "maxActiveSessions": 10,
    "sessionTTL": 86400000
  }
}
```

---

## 📞 支持与帮助

### 文档
- [文件保护指南](docs/FILE_PROTECTION_GUIDE.md)
- [架构进化指南](docs/ARCHITECTURE_EVOLUTION.md)
- [Claude Code 架构分析](docs/CLAUDE_CODE_ARCHITECTURE.md)

### 工具
- **文件保护脚本**: `./scripts/protect-files.sh`
- **备份脚本**: `./scripts/backup.sh`
- **恢复脚本**: `./scripts/restore.sh`

### 命令
```bash
# 查看文件保护状态
./scripts/protect-files.sh status

# 查看帮助
./scripts/protect-files.sh help
```

---

## 🚀 部署到 OpenClaw

### 步骤

1. **准备配置文件**
   - 复制并修改配置模板
   - 设置适当的权限和策略

2. **初始化保护**
   - 运行 `./scripts/protect-files.sh setup`
   - 确保配置文件安全

3. **在 OpenClaw 平台**
   - 登录 OpenClaw 平台
   - 进入智能体管理
   - 选择 "从 GitHub 导入"
   - 输入仓库 URL 和分支
   - 点击 "部署"

4. **验证部署**
   - 检查 Agent 启动状态
   - 测试技能系统
   - 验证定时任务运行

---

## 📝 版本历史

- **v2.2** - 2026-04-06
  - 智能记忆：集成基于 Hindsight 架构的增强记忆系统
  - Retain/Recall/Reflect 三大核心记忆操作
  - 实体关系图谱构建
  - 自动记忆分析和洞察生成
  - 记忆导入/导出功能

- **v2.1** - 2026-04-06
  - 安全加固：添加 groupPolicy 配置
  - 性能优化：添加 Token 和会话管理
  - 功能扩展：8个专业技能和7个定时任务
  - 文件保护：完整的防止文件还原系统

- **v2.0** - 2026-04-04
  - 基于 Claude Code 2.1.88 架构
  - MCP 协议支持
  - 意图识别引擎
  - 基础工具链

---

## 🎉 结语

OpenClaw Agent v2.1 是一个功能强大、安全可靠的智能体系统，基于 Claude Code 架构，具有丰富的专业技能和完善的文件保护机制。

通过严格的安全配置、智能的性能优化和强大的功能扩展，OpenClaw Agent 为您提供了一个高效、安全、可靠的 AI 助手体验。

---

**🦞 OpenClaw Agent - 智能、安全、高效**
