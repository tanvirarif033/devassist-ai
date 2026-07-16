// src/agents/sql-generator.agent.ts

import { BaseAgent, AgentResponse } from './base.agent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class SQLGeneratorAgent extends BaseAgent {
  constructor() {
   
    super();
  }

  async process(input: { query: string; context?: string }): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      console.log(`🔄 SQLGeneratorAgent: Starting SQL generation...`);
      console.log(`📝 Query: ${input.query.substring(0, 100)}...`);

      const systemPrompt = `You are an expert SQL query generator. Convert natural language descriptions into accurate SQL queries.

      Format your response as:
      1. **SQL Query**: The generated SQL query
      2. **Explanation**: Step-by-step explanation of the query
      3. **Performance Tips**: Suggestions for optimization
      4. **Alternative Approaches**: Other ways to achieve the same result
      5. **Potential Issues**: Edge cases or limitations

      Use standard SQL syntax and include proper formatting.`;

      const userPrompt = `Generate SQL for:\n\n${input.query}\n\nContext: ${input.context || 'Standard SQL'}`;

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
        'sql_generator',
        input,
        response.content,
        result.metadata.tokens,
        duration
      );

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ SQL Generator Agent Error:', error);
      
      return {
        success: false,
        result: `Failed to generate SQL: ${error.message || 'Please try again.'}`,
        metadata: {
          model: this.modelName,
          tokens: { prompt: 0, completion: 0, total: 0 },
          duration,
        },
      };
    }
  }
}