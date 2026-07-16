// src/agents/base.agent.ts

import { ChatOpenAI } from '@langchain/openai';
import { config } from '../config';
import { prisma } from '../database';
import { MODEL_CONFIG, modelTracker } from './model.config';

export interface AgentResponse {
  success: boolean;
  result: string;
  metadata: {
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    duration: number;
  };
}

export abstract class BaseAgent {
  protected model: ChatOpenAI;
  protected modelName: string;
  private defaultModel: string;

  constructor(modelName?: string) {
    // If no model provided, use the first from config
    this.defaultModel = modelName || MODEL_CONFIG.models[0];
    this.modelName = this.defaultModel;
    this.model = this.createModel(this.modelName);
    
    console.log(`🔧 Initialized agent with default model: ${this.modelName}`);
  }

  protected createModel(modelName: string): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: config.openRouter.apiKey,
      configuration: {
        baseURL: config.openRouter.baseUrl,
      },
      modelName: modelName,
      temperature: MODEL_CONFIG.settings.temperature,
      maxTokens: MODEL_CONFIG.settings.maxTokens,
      timeout: MODEL_CONFIG.settings.timeout,
    });
  }

  /**
   * Try multiple models with fallback
   * Uses performance tracking to try best models first
   */
  protected async invokeWithFallback(messages: any[]): Promise<any> {
    // Get models ordered by performance (best first)
    const orderedModels = modelTracker.getOrderedModels();
    
    console.log(`🔄 Will try ${orderedModels.length} models in order...`);
    
    let lastError: Error | null = null;

    for (const modelName of orderedModels) {
      try {
        console.log(`⏳ Trying model: ${modelName}...`);
        const startTime = Date.now();
        
        const model = this.createModel(modelName);
        const response = await model.invoke(messages);
        
        const duration = Date.now() - startTime;
        
        // Record success
        modelTracker.recordSuccess(modelName, duration);
        
        // Update to successful model
        this.modelName = modelName;
        console.log(`✅ Success with model: ${modelName} (${duration}ms)`);
        
        return response;
        
      } catch (error: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, error.message || error);
        modelTracker.recordFailure(modelName);
        lastError = error;
      }
    }

    // If all models fail, throw error with details
    throw new Error(
      `All models failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  protected async logAgentActivity(
    agentType: string,
    input: any,
    output: any,
    tokens: any,
    duration: number
  ): Promise<void> {
    try {
      await prisma.agentLog.create({
        data: {
          agentType,
          input,
          output,
          model: this.modelName,
          tokens,
          duration,
        },
      });
    } catch (error) {
      console.error('Failed to log agent activity:', error);
    }
  }

  abstract process(input: any): Promise<AgentResponse>;
}