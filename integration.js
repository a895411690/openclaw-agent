/**
 * AI Tool Hub + OpenClaw Agent 整合方案
 * 
 * 功能：将 AI Tool Hub 的前端展示与 OpenClaw Agent 的后端执行能力结合
 * 实现从"浏览工具"到"使用工具"的闭环
 */

// ============ 整合架构 ============

/**
 * 架构图：
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │                    用户界面层 (Frontend)                   │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
 * │  │ AI Tool Hub │───▶│  工具详情   │───▶│  执行按钮   │ │
 * │  │  (浏览60工具)│    │  (查看详情) │    │ (唤起Agent) │ │
 * │  └─────────────┘    └─────────────┘    └─────────────┘ │
 * └─────────────────────────────────────────────────────────┘
 *                           │
 *                           ▼ 调用
 * ┌─────────────────────────────────────────────────────────┐
 * │                    API 网关层 (Gateway)                  │
 * │  ┌──────────────────────────────────────────────────┐   │
 * │  │              OpenClaw Agent API                   │   │
 * │  │  POST /api/execute                               │   │
 * │  │  { tool: "web_search", input: {...} }            │   │
 * │  └──────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────┘
 *                           │
 *                           ▼ 路由
 * ┌─────────────────────────────────────────────────────────┐
 * │                    执行层 (Backend)                      │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
 * │  │IntentEngine│  │MCP Server │  │ToolExec  │  │TaskMgr │ │
 * │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
 * └─────────────────────────────────────────────────────────┘
 */

// ============ 整合代码 ============

class AIToolHubIntegration {
  constructor(options = {}) {
    this.agentEndpoint = options.agentEndpoint || 'http://localhost:3000/api';
    this.tools = [];
    this.initialized = false;
  }

  /**
   * 初始化整合
   */
  async init() {
    // 加载工具列表
    await this.loadTools();
    
    // 注入执行按钮到 AI Tool Hub
    this.injectExecuteButtons();
    
    // 监听工具点击事件
    this.setupEventListeners();
    
    this.initialized = true;
    console.log('[AIToolHub] Integration initialized');
  }

  /**
   * 加载工具列表
   */
  async loadTools() {
    try {
      const response = await fetch('https://a895411690.github.io/ai-tool-hub/tools.json');
      const data = await response.json();
      this.tools = data.tools || [];
      console.log(`[AIToolHub] Loaded ${this.tools.length} tools`);
    } catch (error) {
      console.error('[AIToolHub] Failed to load tools:', error);
      this.tools = this.getDefaultTools();
    }
  }

  getDefaultTools() {
    return [
      { id: 1, name: '秘塔写作猫', category: 'writing', url: 'https://xiezuocat.com' },
      { id: 2, name: 'ChatGPT', category: 'writing', url: 'https://chat.openai.com' },
      { id: 3, name: 'Claude', category: 'writing', url: 'https://claude.ai' },
      { id: 4, name: 'Midjourney', category: 'painting', url: 'https://midjourney.com' },
      { id: 5, name: 'Stable Diffusion', category: 'painting', url: 'https://stability.ai' },
      { id: 6, name: 'GitHub Copilot', category: 'code', url: 'https://github.com/features/copilot' },
      { id: 7, name: 'Kimi', category: 'writing', url: 'https://kimi.moonshot.cn' },
      { id: 8, name: '豆包', category: 'writing', url: 'https://www.doubao.com' },
    ];
  }

  /**
   * 注入执行按钮
   */
  injectExecuteButtons() {
    const toolCards = document.querySelectorAll('.tool-card');
    
    toolCards.forEach((card, index) => {
      const tool = this.tools[index];
      if (!tool) return;

      const executeBtn = document.createElement('button');
      executeBtn.className = 'agent-execute-btn';
      executeBtn.innerHTML = '<i class="fas fa-play"></i> 执行';
      executeBtn.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 10;
      `;
      
      executeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openExecuteModal(tool);
      });
      
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
      }
      
      card.appendChild(executeBtn);
    });
  }

  /**
   * 打开执行模态框
   */
  openExecuteModal(tool) {
    console.log(`[AIToolHub] Opening execute modal for: ${tool.name}`);
    // Modal implementation here
    alert(`执行工具: ${tool.name}\n\n实际实现会调用 OpenClaw Agent API`);
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    document.addEventListener('toolsLoaded', () => {
      if (this.initialized) {
        this.injectExecuteButtons();
      }
    });
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIToolHubIntegration;
}

console.log('[AIToolHubIntegration] Module loaded. Version 1.0.0');
