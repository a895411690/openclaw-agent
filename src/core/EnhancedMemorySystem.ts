/**
 * OpenClaw Agent v2.1 - Enhanced Memory System
 * 基于 Hindsight 项目的记忆架构
 * 实现 Retain/Recall/Reflect 三大核心操作
 */

// ============ 类型定义 ============

interface Memory {
  id: string;
  content: string;
  type: 'fact' | 'experience' | 'skill' | 'decision' | 'insight';
  entities: string[];
  timestamp: Date;
  confidence: number;
  tags: string[];
  context: {
    sessionId?: string;
    taskId?: string;
    conversationId?: string;
  };
  metadata: Record<string, any>;
}

interface Query {
  query: string;
  entities?: string[];
  tags?: string[];
  type?: Memory['type'];
  limit?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  importance?: number;
}

interface Reflection {
  insights: string[];
  improvements: string[];
  patterns: string[];
  memoryUpdates: Memory[];
  timestamp: Date;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  relationships: Array<{
    target: string;
    type: string;
    strength: number;
  }>;
  lastUpdated: Date;
}

interface EntityGraph {
  entities: Map<string, Entity>;
  relationships: Map<string, Map<string, number>>;
}

// ============ 增强记忆系统类 ============

class EnhancedMemorySystem {
  private memories: Map<string, Memory> = new Map();
  private entityGraph: EntityGraph = {
    entities: new Map(),
    relationships: new Map(),
  };
  private memoryLimit: number = 10000;
  private decayRate: number = 0.95;

  constructor(options?: {
    memoryLimit?: number;
    decayRate?: number;
  }) {
    if (options?.memoryLimit) this.memoryLimit = options.memoryLimit;
    if (options?.decayRate) this.decayRate = options.decayRate;
  }

  // ============ 核心操作: Retain ============

  /**
   * 记忆保留 - 保存重要信息
   */
  async retain(content: string, options?: {
    type?: Memory['type'];
    entities?: string[];
    tags?: string[];
    context?: Memory['context'];
    metadata?: Record<string, any>;
  }): Promise<Memory> {
    const memory: Memory = {
      id: this.generateMemoryId(),
      content,
      type: options?.type || 'fact',
      entities: options?.entities || this.extractEntities(content),
      timestamp: new Date(),
      confidence: 1.0,
      tags: options?.tags || this.generateTags(content),
      context: options?.context || {},
      metadata: options?.metadata || {},
    };

    // 保存记忆
    this.memories.set(memory.id, memory);

    // 更新实体图谱
    this.updateEntityGraph(memory);

    // 检查记忆上限
    this.enforceMemoryLimit();

    // 记录记忆
    console.log(`[MemorySystem] Retained memory: ${memory.id.substring(0, 8)}...`);

    return memory;
  }

  // ============ 核心操作: Recall ============

  /**
   * 记忆回忆 - 检索相关记忆
   */
  async recall(query: Query): Promise<Memory[]> {
    const memories = Array.from(this.memories.values());
    
    // 过滤和排序
    let filteredMemories = memories.filter(memory => {
      // 类型过滤
      if (query.type && memory.type !== query.type) return false;
      
      // 标签过滤
      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some(tag => memory.tags.includes(tag));
        if (!hasTag) return false;
      }
      
      // 实体过滤
      if (query.entities && query.entities.length > 0) {
        const hasEntity = query.entities.some(entity => memory.entities.includes(entity));
        if (!hasEntity) return false;
      }
      
      // 时间范围过滤
      if (query.timeRange) {
        const memoryTime = memory.timestamp.getTime();
        const startTime = query.timeRange.start.getTime();
        const endTime = query.timeRange.end.getTime();
        if (memoryTime < startTime || memoryTime > endTime) return false;
      }
      
      // 内容匹配
      const contentMatch = memory.content.toLowerCase().includes(query.query.toLowerCase());
      const entityMatch = memory.entities.some(entity => 
        entity.toLowerCase().includes(query.query.toLowerCase())
      );
      const tagMatch = memory.tags.some(tag => 
        tag.toLowerCase().includes(query.query.toLowerCase())
      );
      
      return contentMatch || entityMatch || tagMatch;
    });

    // 计算相关性分数
    filteredMemories = filteredMemories.map(memory => {
      const relevance = this.calculateRelevance(memory, query);
      return { ...memory, confidence: memory.confidence * relevance };
    });

    // 排序并限制结果
    filteredMemories.sort((a, b) => b.confidence - a.confidence);
    const limit = query.limit || 10;
    const result = filteredMemories.slice(0, limit);

    // 更新记忆置信度
    result.forEach(memory => {
      memory.confidence = Math.min(memory.confidence * 1.1, 1.0);
      this.memories.set(memory.id, memory);
    });

    console.log(`[MemorySystem] Recalled ${result.length} memories for query: ${query.query}`);
    return result;
  }

  // ============ 核心操作: Reflect ============

  /**
   * 记忆反思 - 分析和优化记忆
   */
  async reflect(memories?: Memory[]): Promise<Reflection> {
    const targetMemories = memories || Array.from(this.memories.values());
    
    if (targetMemories.length === 0) {
      return {
        insights: [],
        improvements: [],
        patterns: [],
        memoryUpdates: [],
        timestamp: new Date(),
      };
    }

    // 分析记忆模式
    const patterns = this.analyzePatterns(targetMemories);
    const insights = this.generateInsights(targetMemories, patterns);
    const improvements = this.suggestImprovements(insights);
    const memoryUpdates = this.updateMemoriesBasedOnInsights(targetMemories, insights);

    // 应用记忆衰减
    this.applyMemoryDecay();

    const reflection: Reflection = {
      insights,
      improvements,
      patterns,
      memoryUpdates,
      timestamp: new Date(),
    };

    console.log(`[MemorySystem] Generated reflection with ${insights.length} insights`);
    return reflection;
  }

  // ============ 实体图谱操作 ============

  /**
   * 获取实体图谱
   */
  async getEntityGraph(): Promise<EntityGraph> {
    return this.entityGraph;
  }

  /**
   * 搜索实体
   */
  async searchEntities(query: string): Promise<Entity[]> {
    const entities = Array.from(this.entityGraph.entities.values());
    return entities.filter(entity => 
      entity.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ============ 辅助方法 ============

  private generateMemoryId(): string {
    return `memory_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private extractEntities(content: string): string[] {
    // 简单的实体提取，实际应用中可以使用 NLP 模型
    const entityPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const matches = content.match(entityPattern) || [];
    return [...new Set(matches)];
  }

  private generateTags(content: string): string[] {
    const commonTags = [
      'important', 'reference', 'actionable', 'insight',
      'code', 'documentation', 'meeting', 'decision'
    ];
    return commonTags.filter(tag => 
      content.toLowerCase().includes(tag)
    );
  }

  private updateEntityGraph(memory: Memory) {
    memory.entities.forEach(entityName => {
      // 创建或更新实体
      if (!this.entityGraph.entities.has(entityName)) {
        this.entityGraph.entities.set(entityName, {
          id: entityName,
          name: entityName,
          type: 'unknown',
          relationships: [],
          lastUpdated: new Date(),
        });
      }

      // 更新实体关系
      memory.entities.forEach(otherEntity => {
        if (entityName !== otherEntity) {
          if (!this.entityGraph.relationships.has(entityName)) {
            this.entityGraph.relationships.set(entityName, new Map());
          }
          const relationships = this.entityGraph.relationships.get(entityName)!;
          const currentStrength = relationships.get(otherEntity) || 0;
          relationships.set(otherEntity, currentStrength + 0.1);
        }
      });
    });
  }

  private calculateRelevance(memory: Memory, query: Query): number {
    let score = 0;

    // 内容匹配分数
    const contentMatch = memory.content.toLowerCase().includes(query.query.toLowerCase()) ? 1.0 : 0.0;
    score += contentMatch * 0.5;

    // 实体匹配分数
    if (query.entities) {
      const entityMatch = query.entities.some(entity => memory.entities.includes(entity)) ? 1.0 : 0.0;
      score += entityMatch * 0.3;
    }

    // 标签匹配分数
    if (query.tags) {
      const tagMatch = query.tags.some(tag => memory.tags.includes(tag)) ? 1.0 : 0.0;
      score += tagMatch * 0.1;
    }

    // 时间衰减
    const timeDiff = Date.now() - memory.timestamp.getTime();
    const timeScore = Math.exp(-timeDiff / (1000 * 60 * 60 * 24)); // 1天衰减
    score *= timeScore;

    return score;
  }

  private analyzePatterns(memories: Memory[]): string[] {
    const patterns: string[] = [];
    
    // 分析时间模式
    const timeGroups: Record<string, number> = {};
    memories.forEach(memory => {
      const hour = memory.timestamp.getHours();
      const timeSlot = `${hour}:00`;
      timeGroups[timeSlot] = (timeGroups[timeSlot] || 0) + 1;
    });
    
    // 分析类型模式
    const typeGroups: Record<string, number> = {};
    memories.forEach(memory => {
      typeGroups[memory.type] = (typeGroups[memory.type] || 0) + 1;
    });

    // 生成模式描述
    if (Object.keys(timeGroups).length > 0) {
      const peakTime = Object.entries(timeGroups).reduce((a, b) => timeGroups[a[0]] > timeGroups[b[0]] ? a : b)[0];
      patterns.push(`Most active time: ${peakTime}`);
    }

    if (Object.keys(typeGroups).length > 0) {
      const mostCommonType = Object.entries(typeGroups).reduce((a, b) => typeGroups[a[0]] > typeGroups[b[0]] ? a : b)[0];
      patterns.push(`Most common memory type: ${mostCommonType}`);
    }

    return patterns;
  }

  private generateInsights(memories: Memory[], patterns: string[]): string[] {
    const insights: string[] = [];

    // 基于模式生成洞察
    patterns.forEach(pattern => {
      insights.push(`Pattern identified: ${pattern}`);
    });

    // 分析记忆质量
    const highConfidenceMemories = memories.filter(m => m.confidence > 0.8);
    if (highConfidenceMemories.length > 0) {
      insights.push(`Found ${highConfidenceMemories.length} high-confidence memories`);
    }

    // 分析实体重要性
    const entityCounts: Record<string, number> = {};
    memories.forEach(memory => {
      memory.entities.forEach(entity => {
        entityCounts[entity] = (entityCounts[entity] || 0) + 1;
      });
    });
    
    const topEntities = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([entity, count]) => `${entity} (${count} mentions)`);
    
    if (topEntities.length > 0) {
      insights.push(`Top entities: ${topEntities.join(', ')}`);
    }

    return insights;
  }

  private suggestImprovements(insights: string[]): string[] {
    const improvements: string[] = [];

    // 基于洞察生成改进建议
    if (insights.some(insight => insight.includes('high-confidence'))) {
      improvements.push('Consider prioritizing high-confidence memories for recall');
    }

    if (insights.some(insight => insight.includes('Top entities'))) {
      improvements.push('Enhance entity-based memory retrieval');
    }

    improvements.push('Regularly review and consolidate similar memories');
    improvements.push('Implement memory pruning for low-confidence items');

    return improvements;
  }

  private updateMemoriesBasedOnInsights(memories: Memory[], insights: string[]): Memory[] {
    const updates: Memory[] = [];

    // 基于洞察更新记忆
    memories.forEach(memory => {
      if (memory.confidence < 0.5) {
        memory.confidence *= this.decayRate;
        updates.push(memory);
      }
    });

    return updates;
  }

  private applyMemoryDecay() {
    this.memories.forEach((memory, id) => {
      memory.confidence *= this.decayRate;
      if (memory.confidence < 0.1) {
        this.memories.delete(id);
        console.log(`[MemorySystem] Pruned memory: ${id.substring(0, 8)}...`);
      } else {
        this.memories.set(id, memory);
      }
    });
  }

  private enforceMemoryLimit() {
    if (this.memories.size > this.memoryLimit) {
      const sortedMemories = Array.from(this.memories.values())
        .sort((a, b) => b.confidence - a.confidence);
      
      const toKeep = sortedMemories.slice(0, this.memoryLimit);
      const toRemove = sortedMemories.slice(this.memoryLimit);
      
      // 重新构建记忆映射
      this.memories.clear();
      toKeep.forEach(memory => {
        this.memories.set(memory.id, memory);
      });

      console.log(`[MemorySystem] Pruned ${toRemove.length} memories to stay within limit`);
    }
  }

  // ============ 管理方法 ============

  /**
   * 获取记忆统计
   */
  getStats() {
    return {
      totalMemories: this.memories.size,
      totalEntities: this.entityGraph.entities.size,
      totalRelationships: Array.from(this.entityGraph.relationships.values())
        .reduce((sum, rels) => sum + rels.size, 0),
      memoryTypes: Array.from(this.memories.values())
        .reduce((acc, mem) => {
          acc[mem.type] = (acc[mem.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
    };
  }

  /**
   * 清理过期记忆
   */
  cleanup(maxAge: number) {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, memory] of this.memories) {
      if (now - memory.timestamp.getTime() > maxAge) {
        this.memories.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 导出记忆
   */
  exportMemories() {
    return Array.from(this.memories.values());
  }

  /**
   * 导入记忆
   */
  importMemories(memories: Memory[]) {
    memories.forEach(memory => {
      this.memories.set(memory.id, memory);
      this.updateEntityGraph(memory);
    });
    this.enforceMemoryLimit();
  }
}

// 导出单例
const enhancedMemorySystemInstance = new EnhancedMemorySystem();

module.exports = { 
  EnhancedMemorySystem, 
  enhancedMemorySystem: enhancedMemorySystemInstance
};
