export const MODEL_CONFIG = {
  models: [
    'google/gemini-2.0-flash-exp:free',        
    'mistralai/mistral-7b-instruct:free',     
    'microsoft/phi-3-mini-128k-instruct:free',
    'openai/gpt-oss-20b:free',                 
    'meta-llama/llama-3.2-3b-instruct:free',   
    'deepseek/deepseek-chat:free',            
  ],
  
  settings: {
    temperature: 0.3,
    maxTokens: 500,      
    timeout: 15000,      
  },
};
export interface ModelPerformance {
  modelName: string;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  avgDuration: number;
  lastUsed: Date;
}

export class ModelPerformanceTracker {
  private performance: Map<string, ModelPerformance> = new Map();

  recordSuccess(modelName: string, duration: number): void {
    const current = this.performance.get(modelName) || {
      modelName,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastUsed: new Date()
    };
    
    current.successCount++;
    current.totalDuration += duration;
    current.avgDuration = current.totalDuration / current.successCount;
    current.lastUsed = new Date();
    
    this.performance.set(modelName, current);
    this.logStats();
  }

  recordFailure(modelName: string): void {
    const current = this.performance.get(modelName) || {
      modelName,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastUsed: new Date()
    };
    
    current.failureCount++;
    current.lastUsed = new Date();
    
    this.performance.set(modelName, current);
    this.logStats();
  }

  getSuccessRate(modelName: string): number {
    const perf = this.performance.get(modelName);
    if (!perf) return 0;
    const total = perf.successCount + perf.failureCount;
    return total === 0 ? 0 : perf.successCount / total;
  }

  getBestModel(): string {
    const ordered = this.getOrderedModels();
    return ordered.length > 0 ? ordered[0] : MODEL_CONFIG.models[0];
  }

  /**
   * ✅ FIXED: Returns models ordered by performance
   * - Models with performance data come first
   * - Sorted by success rate (higher = better)
   * - If no data, returns default order
   */
  getOrderedModels(): string[] {
    
    const models = [...MODEL_CONFIG.models];
    
    
    const hasData = models.some(model => this.performance.has(model));
    
  
    if (!hasData) {
      console.log('📊 No performance data yet, using default model order');
      return models;
    }
    
   
    return models.sort((a, b) => {
      const perfA = this.performance.get(a);
      const perfB = this.performance.get(b);
      
      
      if (perfA && !perfB) return -1;
      
      
      if (!perfA && perfB) return 1;
      
   
      if (perfA && perfB) {
        const scoreA = (this.getSuccessRate(a) * 100) - (perfA.avgDuration / 1000);
        const scoreB = (this.getSuccessRate(b) * 100) - (perfB.avgDuration / 1000);
        
        
        if (scoreA !== scoreB) {
          return scoreB - scoreA; 
        }
      }
      
      
      return MODEL_CONFIG.models.indexOf(a) - MODEL_CONFIG.models.indexOf(b);
    });
  }

  logStats(): void {
    console.log('\n📊 Model Performance Stats:');
    console.log('─'.repeat(80));
    console.log(
      'Model'.padEnd(45) + 
      '| Success'.padEnd(10) + 
      '| Fail'.padEnd(8) + 
      '| Rate'.padEnd(8) + 
      '| Avg (ms)'
    );
    console.log('─'.repeat(80));
    
    const ordered = this.getOrderedModels();
    for (const model of ordered) {
      const perf = this.performance.get(model);
      if (perf) {
        const rate = this.getSuccessRate(model);
        console.log(
          model.padEnd(45) +
          `| ${perf.successCount.toString().padEnd(8)}` +
          `| ${perf.failureCount.toString().padEnd(6)}` +
          `| ${(rate * 100).toFixed(1)}%`.padEnd(8) +
          `| ${perf.avgDuration.toFixed(0)}`
        );
      } else {
        console.log(
          model.padEnd(45) +
          `| ${'0'.padEnd(8)}` +
          `| ${'0'.padEnd(6)}` +
          `| ${'N/A'.padEnd(8)}` +
          `| ${'N/A'}`
        );
      }
    }
    console.log('─'.repeat(80) + '\n');
  }

  clearStats(): void {
    this.performance.clear();
    console.log('🧹 Performance stats cleared');
  }
}

export const modelTracker = new ModelPerformanceTracker();