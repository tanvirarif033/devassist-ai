"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeReviewAgent = void 0;
const base_agent_1 = require("./base.agent");
const messages_1 = require("@langchain/core/messages");
class CodeReviewAgent extends base_agent_1.BaseAgent {
    constructor() {
        super('meta-llama/llama-3.2-3b-instruct:free');
    }
    async process(input) {
        const startTime = Date.now();
        try {
            const systemPrompt = `You are an expert code reviewer. Analyze the provided code and return a structured review.
      
      Format your response as:
      1. **Code Explanation**: Brief overview of what the code does
      2. **Best Practices**: Suggestions for following best practices
      3. **Potential Bugs**: Any bugs or edge cases to consider
      4. **Performance Improvements**: Suggestions for performance optimization
      5. **Security Issues**: Any security vulnerabilities found

      Be specific and provide examples where applicable.`;
            const userPrompt = `Review this ${input.language || 'code'}:\n\n${input.code}`;
            const response = await this.model.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]);
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
            await this.logAgentActivity('code_review', input, response.content, result.metadata.tokens, duration);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error('Code Review Agent Error:', error);
            return {
                success: false,
                result: 'Failed to review code. Please try again.',
                metadata: {
                    model: this.modelName,
                    tokens: { prompt: 0, completion: 0, total: 0 },
                    duration,
                },
            };
        }
    }
}
exports.CodeReviewAgent = CodeReviewAgent;
//# sourceMappingURL=code-review.agent.js.map