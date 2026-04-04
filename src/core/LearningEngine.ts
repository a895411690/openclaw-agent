/**
 * OpenClaw Agent v2.0 - LearningEngine
 * 综合学习进化系统
 * 
 * 功能：
 * 1. 交互智能 - 预测用户需求
 * 2. 工具优化 - 自动优化工具链
 * 3. 代码自修 - 自我改进代码
 * 4. 知识沉淀 - 构建知识体系
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============ 类型定义 ============

export interface LearningPattern {
  id: string;
  type: 'intent' | 'tool' | 'workflow' | 'error';
  pattern: any;
  confidence: number;
  frequency: number;
  lastUsed: Date;
  metadata: Record<string, any>;
}

export interface UserPreference {
  key: string;
  value: any;
  confidence: number;
  learnedFrom: string[];
  updatedAt: Date;
}

export interface ToolPerformance {
  toolName: string;
  successRate: number;
  avgExecutionTime: number;
  errorPatterns: string[];
  optimizationSuggestions: string[];
}

export interface KnowledgeNode {
  id: string;
  type: 'concept' | 'tool' | 'workflow' | 'solution';
  content: string;
  relationships: string[];
  source: string;
  confidence: number;
  createdAt: Date;
}

// ============ 学习引擎 ============

export class LearningEngine {
  private patterns: Map<string, LearningPattern> = new Map();
  private preferences: Map<string, UserPreference> = new Map();
  private toolStats: Map<string, ToolPerformance> = new Map();
  private knowledgeGraph: Map<string, KnowledgeNode> = new Map();
  private learningHistory: any[] = [];
  private storageDir: string;

  constructor(storageDir: string = './learning') {
    this.storageDir = storageDir;
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      await this.loadLearnedData();
    } catch (error) {
      console.error('[LearningEngine] Init failed:', error);
    }
  }

  // ============ 1. 交互智能 - 预测用户需求 ============

  /**
   * 学习时间规律
   */
  async learnTemporalPatterns(userId: string, interactions: any[]): Promise<void> {
    const hourlyDistribution = new Array(24).fill(0);
    const dailyPatterns: Record<string, string[]> = {};

    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      const day = new Date(interaction.timestamp).toISOString().split('T')[0];
      
      hourlyDistribution[hour]++;
      
      if (!dailyPatterns[day]) {
        dailyPatterns[day] = [];
      }
      dailyPatterns[day].push(interaction.intent);
    });

    // 识别高频时段
    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    // 识别重复模式
    const sequences = this.extractSequences(Object.values(dailyPatterns));
    
    await this.savePattern({
      id: `temporal_${userId}`,
      type: 'intent',
      pattern: {
        peakHours,
        sequences,
        hourlyDistribution
      },
      confidence: this.calculateConfidence(interactions.length),
      frequency: interactions.length,
      lastUsed: new Date(),
      metadata: { userId, type: 'temporal' }
    });

    console.log(`[LearningEngine] Learned temporal patterns for ${userId}:`, {
      peakHours,
      sequences: sequences.length
    });
  }

  /**
   * 预测用户需求
   */
  async predictUserNeeds(userId: string, context: any): Promise<any[]> {
    const temporalPattern = this.patterns.get(`temporal_${userId}`);
    
    if (!temporalPattern) {
      return [];
    }

    const currentHour = new Date().getHours();
    const predictions: any[] = [];

    // 基于时间预测
    if (temporalPattern.pattern.peakHours.includes(currentHour)) {
      temporalPattern.pattern.sequences.forEach((seq: string[]) => {
        if (seq.length > 0) {
          predictions.push({
            type: 'temporal',
            intent: seq[0],
            confidence: temporalPattern.confidence,
            reason: `Peak usage hour (${currentHour}:00)`
          });
        }
      });
    }

    // 基于上下文预测
    if (context.previousIntent) {
      const followUpPatterns = this.findFollowUpPatterns(context.previousIntent);
      predictions.push(...followUpPatterns);
    }

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  // ============ 2. 工具优化 - 自动优化工具链 ============

  /**
   * 记录工具执行
   */
  async recordToolExecution(toolName: string, result: any): Promise<void> {
    const stats = this.toolStats.get(toolName) || {
      toolName,
      successRate: 1.0,
      avgExecutionTime: 0,
      errorPatterns: [],
      optimizationSuggestions: []
    };

    const isSuccess = !result.error;
    stats.successRate = stats.successRate * 0.9 + (isSuccess ? 0.1 : 0);

    if (result.duration) {
      stats.avgExecutionTime = stats.avgExecutionTime * 0.9 + result.duration * 0.1;
    }

    if (!isSuccess && result.error) {
      const errorPattern = this.extractErrorPattern(result.error);
      if (!stats.errorPatterns.includes(errorPattern)) {
        stats.errorPatterns.push(errorPattern);
      }
    }

    stats.optimizationSuggestions = this.generateOptimizationSuggestions(stats);
    this.toolStats.set(toolName, stats);
  }

  // ============ 3. 代码自修 - 自我改进代码 ============

  /**
   * 分析代码问题
   */
  async analyzeCodeIssues(): Promise<any[]> {
    const issues: any[] = [];

    // 分析性能瓶颈
    const performanceStats = Array.from(this.toolStats.values());
    const slowTools = performanceStats.filter(s => s.avgExecutionTime > 1000);
    
    slowTools.forEach(tool => {
      issues.push({
        type: 'performance',
        severity: 'medium',
        description: `Slow tool: ${tool.toolName} (${tool.avgExecutionTime.toFixed(0)}ms)`,
        suggestion: 'Consider adding caching or async processing'
      });
    });

    return issues;
  }

  // ============ 4. 知识沉淀 - 构建知识体系 ============

  /**
   * 提取知识
   */
  async extractKnowledge(source: string, content: string, type: KnowledgeNode['type']): Promise<void> {
    const node: KnowledgeNode = {
      id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      relationships: [],
      source,
      confidence: 0.8,
      createdAt: new Date()
    };

    const relatedNodes = this.findRelatedNodes(content, type);
    node.relationships = relatedNodes.map(n => n.id);
    this.knowledgeGraph.set(node.id, node);
  }

  // ============ 辅助方法 ============

  private extractSequences(patterns: string[][]): string[][] {
    const sequences: string[][] = [];
    patterns.forEach(dayPatterns => {
      for (let i = 0; i < dayPatterns.length - 1; i++) {
        sequences.push([dayPatterns[i], dayPatterns[i + 1]]);
      }
    });
    return sequences;
  }

  private calculateConfidence(sampleSize: number): number {
    return Math.min(0.5 + sampleSize * 0.05, 0.95);
  }

  private findFollowUpPatterns(intent: string): any[] {
    const patterns: any[] = [];
    for (const pattern of this.patterns.values()) {
      if (pattern.type === 'workflow' && pattern.metadata.previousIntent === intent) {
        patterns.push({
          type: 'follow_up',
          intent: pattern.metadata.nextIntent,
          confidence: pattern.confidence
        });
      }
    }
    return patterns;
  }

  private extractErrorPattern(error: string): string {
    return error.split(':')[0] || 'unknown';
  }

  private generateOptimizationSuggestions(stats: ToolPerformance): string[] {
    const suggestions: string[] = [];
    if (stats.successRate < 0.8) {
      suggestions.push('Add error handling and retry logic');
    }
    if (stats.avgExecutionTime > 1000) {
      suggestions.push('Implement caching mechanism');
    }
    return suggestions;
  }

  private findRelatedNodes(content: string, type: string): KnowledgeNode[] {
    const related: KnowledgeNode[] = [];
    for (const node of this.knowledgeGraph.values()) {
      if (node.type === type && this.calculateSimilarity(content, node.content) > 0.7) {
        related.push(node);
      }
    }
    return related.slice(0, 5);
  }

  private calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(' '));
    const wordsB = new Set(b.toLowerCase().split(' '));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    return intersection.size / Math.max(wordsA.size, wordsB.size);
  }

  private async savePattern(pattern: LearningPattern): Promise<void> {
    this.patterns.set(pattern.id, pattern);
  }

  private async loadLearnedData(): Promise<void> {
    // 实现数据加载逻辑
  }

  getStats(): any {
    return {
      patterns: this.patterns.size,
      preferences: this.preferences.size,
      toolStats: this.toolStats.size,
      knowledgeNodes: this.knowledgeGraph.size
    };
  }
}

export const learningEngine = new LearningEngine();
console.log('[LearningEngine] Module loaded. Learning evolution enabled.');
