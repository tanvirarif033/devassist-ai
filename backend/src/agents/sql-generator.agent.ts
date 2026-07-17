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

      const systemPrompt = `You are a Senior Database Engineer. Generate CLEAN, OPTIMIZED SQL queries.

      FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

      ## 📝 SQL Query
      \`\`\`sql
      -- Complete SQL query
      SELECT ...
      \`\`\`

      ## 🔍 Query Explanation
      [Step-by-step explanation of what each part does]

      ## ⚡ Performance Tips
      - [Tip 1: Index suggestion]
      - [Tip 2: Optimization suggestion]
      - [Tip 3: Best practice]

      ## 🔄 Alternative Approaches
      **Option 1**: [Alternative query]
      \`\`\`sql
      -- Alternative query
      \`\`\`
      
      **Option 2**: [Another approach]
      \`\`\`sql
      -- Another approach
      \`\`\`

      ## 🚨 Potential Issues
      - [Issue 1: Edge case]
      - [Issue 2: Performance concern]
      - [Issue 3: Data type issue]

      RULES:
      1. Use proper markdown headings
      2. Always provide working SQL
      3. Include indexing suggestions
      4. Keep it clean and readable
      5. Use bullet points for lists`;

      const userPrompt = `Generate a SQL query for this requirement:

      Requirement: ${input.query}
      Database Context: ${input.context || 'PostgreSQL'}

      Follow the exact format specified in the system prompt.`;

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