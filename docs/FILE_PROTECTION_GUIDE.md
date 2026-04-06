# 🔒 OpenClaw 文件保护指南

## 防止文件被还原的完整方案

---

## 📋 目录

1. [Git 保护机制](#git-保护机制)
2. [配置文件保护](#配置文件保护)
3. [备份策略](#备份策略)
4. [使用指南](#使用指南)
5. [紧急恢复](#紧急恢复)

---

## 🔐 Git 保护机制

### 1. .gitattributes - Git 属性配置

**文件位置**: [`.gitattributes`](file:///Users/weijiahao/Downloads/openclaw-agent-main/.gitattributes)

**作用**: 防止 Git 合并时覆盖本地配置文件

```gitattributes
# 配置文件 - 合并时保留本地版本
config/security.json merge=ours
config/performance.json merge=ours
config/protection.json merge=ours
config/custom-*.json merge=ours

# 环境变量文件 - 永远不合并
.env merge=ours
.env.local merge=ours

# 用户数据目录 - 不跟踪
data/** -merge
custom/** -merge
tasks/** -merge
```

**工作原理**:
- `merge=ours`: 当发生合并冲突时，Git会自动保留本地版本
- `-merge`: 完全禁用这些文件的合并

### 2. 配置 Git merge.ours 驱动

```bash
# 执行一次配置:
git config merge.ours.driver true
```

### 3. .gitignore 保护

**文件位置**: [`.gitignore`](file:///Users/weijiahao/Downloads/openclaw-agent-main/.gitignore)

确保以下内容已添加:
```
# 配置文件保护
config/security.json
config/performance.json
config/protection.json
config/custom-*.json
.env
.env.local
secrets.json

# 用户数据
data/
custom/
tasks/
backup/
```

---

## ⚙️ 配置文件保护

### 受保护的文件列表

| 文件 | 说明 | 保护级别 |
|------|------|---------|
| `config/security.json` | 安全配置 | 🔴 高 |
| `config/performance.json` | 性能配置 | 🔴 高 |
| `config/protection.json` | 保护配置 | 🔴 高 |
| `.env` | 环境变量 | 🔴 高 |
| `.env.local` | 本地环境 | 🔴 高 |
| `data/**` | 用户数据 | 🟡 中 |
| `custom/**` | 自定义内容 | 🟡 中 |
| `tasks/**` | 任务数据 | 🟡 中 |

### 保护配置文件

**文件位置**: [`config/protection.json`](file:///Users/weijiahao/Downloads/openclaw-agent-main/config/protection.json)

```json
{
  "protectedFiles": {
    "gitIgnore": [...],
    "gitAttributes": [...]
  },
  "restoreProtections": {
    "confirmRequired": true,
    "safetyBackup": true
  }
}
```

---

## 💾 备份策略

### 1. 自动备份脚本

**脚本位置**: [`scripts/protect-files.sh`](file:///Users/weijiahao/Downloads/openclaw-agent-main/scripts/protect-files.sh)

**功能**:
- ✅ 设置 Git 保护
- ✅ 自动备份受保护文件
- ✅ 检查文件状态
- ✅ 防止意外还原警告

### 2. 使用备份脚本

```bash
# 赋予执行权限
chmod +x scripts/protect-files.sh

# 执行所有保护操作
./scripts/protect-files.sh

# 或使用特定命令
./scripts/protect-files.sh setup    # 设置保护
./scripts/protect-files.sh backup   # 备份文件
./scripts/protect-files.sh status   # 检查状态
./scripts/protect-files.sh warn     # 显示警告
./scripts/protect-files.sh help     # 显示帮助
```

### 3. 备份位置

备份文件保存在:
```
backup/protected/
├── security.json.20260406_123456
├── performance.json.20260406_123456
└── ...
```

---

## 📖 使用指南

### 日常使用流程

1. **首次设置** (只需一次)
```bash
./scripts/protect-files.sh setup
```

2. **定期检查** (推荐每周)
```bash
./scripts/protect-files.sh status
```

3. **重要操作前备份**
```bash
./scripts/protect-files.sh backup
```

### Git 操作安全指南

#### ✅ 安全的 Git 操作

```bash
# 拉取更新
git pull

# 提交更改
git add .
git commit -m "描述"
git push

# 查看状态
git status

# 查看差异
git diff
```

#### ❌ 危险的 Git 操作

```bash
# ❌ 不要使用这些命令！
git restore config/security.json
git checkout -- config/performance.json
git reset --hard HEAD~1
git merge -X theirs  # 会覆盖本地配置！
```

#### ⚠️ 如果确实需要还原

```bash
# 1. 首先备份当前状态
./scripts/protect-files.sh backup

# 2. 手动确认要还原的文件
ls -la backup/protected/

# 3. 从备份恢复
cp backup/protected/security.json.20260406_123456 config/security.json
```

---

## 🚨 紧急恢复

### 场景 1: Git 合并覆盖了配置

**症状**: 执行 `git pull` 或 `git merge` 后，配置文件被覆盖

**恢复步骤**:

```bash
# 1. 检查是否有备份
ls -la backup/protected/

# 2. 如果有备份，直接恢复
cp backup/protected/security.json.<timestamp> config/security.json

# 3. 如果没有备份，查看 Git 历史
git reflog

# 4. 找到最近的提交
git log --oneline -n 10

# 5. 从历史中恢复
git checkout <commit-hash> -- config/security.json
```

### 场景 2: 意外执行了危险命令

**症状**: 不小心执行了 `git restore` 或 `git reset --hard`

**恢复步骤**:

```bash
# 1. 立即停止，不要做任何操作！

# 2. 检查 Git reflog
git reflog

# 3. 找到之前的 HEAD
git reflog show HEAD

# 4. 恢复到之前的状态
git reset HEAD@{1}

# 5. 恢复工作目录
git checkout -- .

# 6. 从备份恢复配置文件
cp backup/protected/security.json.<timestamp> config/security.json
```

### 场景 3: 配置文件丢失

**症状**: 配置文件被删除或损坏

**恢复步骤**:

```bash
# 1. 检查备份
ls -la backup/protected/

# 2. 从最新备份恢复
cp backup/protected/security.json.<latest-timestamp> config/security.json

# 3. 如果没有备份，重新生成默认配置
# 参考 config/security.json 模板重新创建
```

---

## 🛡️ 最佳实践

### 1. 定期备份

建议:
- ✅ 每次重要修改前备份
- ✅ 每周自动备份
- ✅ 重要版本标注备份说明

### 2. Git 工作流

```bash
# 推荐的 Git 工作流:
1. ./scripts/protect-files.sh backup  # 先备份
2. git pull                          # 拉取更新
3. # 做你的修改
4. git add .                        # 添加文件
5. git commit                      # 提交
6. git push                         # 推送
```

### 3. 团队协作

如果多人协作:
- ✅ 配置文件不提交到 Git
- ✅ 提供配置模板
- ✅ 使用环境变量管理配置
- ✅ 文档化配置变更

---

## 📞 获取帮助

### 查看文件保护状态

```bash
./scripts/protect-files.sh status
```

### 查看帮助

```bash
./scripts/protect-files.sh help
```

---

## 📝 总结

**核心原则**:

1. 🔒 **预防为主 - 配置文件不提交到 Git
2. 💾 **备份先行 - 重要操作前先备份
3. ⚠️ **小心操作 - 避免使用危险 Git 命令
4. 🚨 **快速恢复 - 从备份快速恢复

**记住**: 配置文件是你的宝贵资产，请务必保护好！
