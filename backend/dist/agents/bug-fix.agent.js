"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BugFixAgent = void 0;
const base_agent_1 = require("./base.agent");
const messages_1 = require("@langchain/core/messages");
class BugFixAgent extends base_agent_1.BaseAgent {
    constructor() {
        super('meta-llama/llama-3.2-3b-instruct:free');
    }
    async process(input) {
        const startTime = Date.now();
        try {
            const systemPrompt = `You are an expert debugging assistant. Analyze the provided error and provide a comprehensive solution.

      Format your response as:
      1. **Error Explanation**: What the error means in simple terms
      2. **Root Cause**: Why this error occurred
      3. **Solution**: Step-by-step guide to fix it
      4. **Code Example**: Provide an example solution
      5. **Prevention**: How to avoid this error in the future

      Be thorough and educational in your explanation.`;
            const userPrompt = `Analyze this error:\n\n${input.error}\n\nContext: ${input.context || 'General purpose'}`;
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
            await this.logAgentActivity('bug_fix', input, response.content, result.metadata.tokens, duration);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error('Bug Fix Agent Error:', error);
            return {
                success: false,
                result: 'Failed to analyze error. Please try again.',
                metadata: {
                    model: this.modelName,
                    tokens: { prompt: 0, completion: 0, total: 0 },
                    duration,
                },
            };
        }
    }
}
exports.BugFixAgent = BugFixAgent;
//# sourceMappingURL=bug-fix.agent.js.map