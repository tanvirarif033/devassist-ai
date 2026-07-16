// src/agents/code-review.agent.ts

import { BaseAgent, AgentResponse } from './base.agent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class CodeReviewAgent extends BaseAgent {
  constructor() {
    
    super();
  }

  async process(input: { code: string; language?: string }): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔄 CodeReviewAgent: Starting code review...`);
      console.log(`📝 Code length: ${input.code.length} characters`);
      console.log(`📝 Language: ${input.language || 'unknown'}`);

      const systemPrompt = `You are an expert code reviewer. Analyze the provided code and return a structured review.
      
      Format your response as:
      1. **Code Explanation**: Brief overview of what the code does
      2. **Best Practices**: Suggestions for following best practices
      3. **Potential Bugs**: Any bugs or edge cases to consider
      4. **Performance Improvements**: Suggestions for performance optimization
      5. **Security Issues**: Any security vulnerabilities found

      Be specific and provide examples where applicable.`;

      const userPrompt = `Review this ${input.language || 'code'}:\n\n${input.code}`;

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
        'code_review',
        input,
        response.content,
        result.metadata.tokens,
        duration
      );

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Code Review Agent Error:', error);
      
      return {
        success: false,
        result: `Failed to review code: ${error.message || 'Please try again.'}`,
        metadata: {
          model: this.modelName,
          tokens: { prompt: 0, completion: 0, total: 0 },
          duration,
        },
      };
    }
  }
}