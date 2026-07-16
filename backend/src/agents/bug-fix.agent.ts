

import { BaseAgent, AgentResponse } from './base.agent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class BugFixAgent extends BaseAgent {
  constructor() {
   
    super();
  }

  async process(input: { error: string; context?: string }): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔄 BugFixAgent: Starting error analysis...`);
      console.log(`📝 Error: ${input.error.substring(0, 100)}...`);

      const systemPrompt = `You are an expert debugging assistant. Analyze the provided error and provide a comprehensive solution.

      Format your response as:
      1. **Error Explanation**: What the error means in simple terms
      2. **Root Cause**: Why this error occurred
      3. **Solution**: Step-by-step guide to fix it
      4. **Code Example**: Provide an example solution
      5. **Prevention**: How to avoid this error in the future

      Be thorough and educational in your explanation.`;

      const userPrompt = `Analyze this error:\n\n${input.error}\n\nContext: ${input.context || 'General purpose'}`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ];

     
      const response = await this.invokeWithFallback(messages);

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        result: response.content.toString(),
        metadata: {
          model: this.modelName,
          tokens: {
            prompt: 0,
            completion: 0,
            total: 0,
          },
          duration,
        },
      };

      await this.logAgentActivity(
        'bug_fix',
        input,
        response.content,
        result.metadata.tokens,
        duration
      );

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Bug Fix Agent Error:', error);
      
      return {
        success: false,
        result: `Failed to analyze error: ${error.message || 'Please try again.'}`,
        metadata: {
          model: this.modelName,
          tokens: { prompt: 0, completion: 0, total: 0 },
          duration,
        },
      };
    }
  }
}