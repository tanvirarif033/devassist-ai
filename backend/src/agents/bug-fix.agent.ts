

import { BaseAgent, AgentResponse } from './base.agent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export class BugFixAgent extends BaseAgent {
  constructor() {
    super();
  }

  async process(input: { error: string; context?: string; userId?: string; chatId?: string }): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      const { context, formattedPrompt } = await this.processWithContext(
        'bug_fix',
        input.error,
        input.userId || 'system',
        input.chatId
      );

      console.log(`🔄 BugFixAgent: Starting error analysis with context...`);
      console.log(`📦 Context built with error: ${context.error?.message?.substring(0, 50) || 'No error extracted'}`);

      const systemPrompt = `You are a Senior Debugging Expert. Provide CLEAN, ACTIONABLE solutions to fix errors.

      FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

      ## 🐛 Error Summary
      [1-2 sentences explaining what the error means]

      ## 🔍 Root Cause
      [Detailed explanation of why this error occurs]

      ## 🔧 Solution
      [Step-by-step solution with code]

      ### Fixed Code:
      \`\`\`javascript
      // Complete working code
      \`\`\`

      ## 📝 Step-by-Step Implementation
      1. Step 1: [Description]
      2. Step 2: [Description]
      3. Step 3: [Description]

      ## 💡 Prevention Tips
      - [Tip 1]
      - [Tip 2]
      - [Tip 3]

      RULES:
      1. Use proper markdown headings
      2. Always provide working code
      3. Keep it clean and readable
      4. Be thorough but concise
      5. Use bullet points for lists`;

      const userMessage = `Fix this error and provide a CLEAN response:

      Error: ${input.error}
      Context: ${input.context || 'General'}

      ${formattedPrompt}

      Follow the exact format specified in the system prompt.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
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
        { input, context },
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