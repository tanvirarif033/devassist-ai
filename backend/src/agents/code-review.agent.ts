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

      const systemPrompt = `You are a Senior Code Reviewer. Provide a DETAILED but CLEAN code review.

      FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

      ## 📊 Code Overview
      [Write 2-3 sentences explaining what the code does]

      ## 🐛 Issues Found

      ### Issue 1: [Issue Name]
      - **Location**: Line X
      - **Problem**: [What's wrong]
      - **Fix**: [How to fix it]
      - **Fixed Code**:
      \`\`\`javascript
      // Fixed code here
      \`\`\`

      ### Issue 2: [Issue Name]
      [Same format as above]

      ## ✅ Improved Code
      \`\`\`javascript
      // Complete improved version
      \`\`\`

      ## 💡 Key Improvements
      - [Improvement 1]
      - [Improvement 2]
      - [Improvement 3]

      ## 📝 Summary
      [2-3 sentences summarizing the review]

      RULES:
      1. Use proper markdown headings (##, ###)
      2. Use code blocks with language tags
      3. Keep it clean and readable
      4. Don't use tables unless necessary
      5. Use bullet points for lists
      6. Be thorough but concise
      7. Always provide working code`;

      const userPrompt = `Review this code and provide a DETAILED but CLEAN response:

      Language: ${input.language || 'javascript'}
      
      Code:
      \`\`\`
      ${input.code}
      \`\`\`

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