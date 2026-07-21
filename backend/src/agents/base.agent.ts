

import { ChatMistralAI } from '@langchain/mistralai';
import { config } from '../config';
import { prisma } from '../database';
import { MODEL_CONFIG, modelTracker } from './model.config';
import { ContextService } from '../services/context.service';
import { AgentType } from '../context/types';

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
  protected model: ChatMistralAI;
  protected modelName: string;
  protected defaultModel: string;
  protected contextService: ContextService;

  constructor(modelName?: string) {
    this.defaultModel = modelName || MODEL_CONFIG.models[0];
    this.modelName = this.defaultModel;
    this.model = this.createModel(this.modelName);
    this.contextService = new ContextService();
    
    console.log(`🔧 Initialized agent with default model: ${this.modelName}`);
  }

  protected createModel(modelName: string): ChatMistralAI {
    // ✅ Fix: ChatMistralAI uses 'model' not 'modelName'
    // ✅ Fix: timeout is not a direct parameter, we handle it differently
    return new ChatMistralAI({
      apiKey: config.mistral.apiKey,
      model: modelName,  // Changed from 'modelName' to 'model'
      temperature: MODEL_CONFIG.settings.temperature,
      maxTokens: MODEL_CONFIG.settings.maxTokens,
      // ✅ timeout is handled through the request options, not here
    });
  }

  protected async invokeWithFallback(messages: any[]): Promise<any> {
    const orderedModels = modelTracker.getOrderedModels();
    
    console.log(`🔄 Will try ${orderedModels.length} models in order...`);
    
    let lastError: Error | null = null;

    for (const modelName of orderedModels) {
      try {
        console.log(`⏳ Trying model: ${modelName}...`);
        const startTime = Date.now();
        
        // ✅ Create model with timeout handled via AbortController
        const model = this.createModel(modelName);
        
        // ✅ Handle timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, MODEL_CONFIG.settings.timeout);
        
        try {
          const response = await model.invoke(messages, {
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          const duration = Date.now() - startTime;
          
          if (response && typeof response === 'object' && 'content' in response) {
            modelTracker.recordSuccess(modelName, duration);
            this.modelName = modelName;
            console.log(`✅ Success with model: ${modelName} (${duration}ms)`);
            return response;
          } else {
            throw new Error('Empty or invalid response from model');
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          throw error;
        }
        
      } catch (error: any) {
        console.warn(`⚠️ Model ${modelName} failed:`, error.message || error);
        modelTracker.recordFailure(modelName);
        lastError = error;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
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

  protected async processWithContext(
    agentType: AgentType,
    userPrompt: string,
    userId: string,
    chatId?: string,
    additionalContext?: Record<string, any>
  ): Promise<{ context: any; formattedPrompt: string }> {
    console.log(`📦 Building context for ${agentType} agent...`);
    
    const context = await this.contextService.buildContext(
      agentType,
      userPrompt,
      userId,
      chatId,
      additionalContext
    );

    const formattedPrompt = this.contextService.formatContextForPrompt(context);
    
    return { context, formattedPrompt };
  }

  abstract process(input: any, userId?: string, chatId?: string): Promise<AgentResponse>;
}