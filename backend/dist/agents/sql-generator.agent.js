"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLGeneratorAgent = void 0;
const base_agent_1 = require("./base.agent");
const messages_1 = require("@langchain/core/messages");
class SQLGeneratorAgent extends base_agent_1.BaseAgent {
    constructor() {
        super('meta-llama/llama-3.2-3b-instruct:free');
    }
    async process(input) {
        const startTime = Date.now();
        try {
            const systemPrompt = `You are an expert SQL query generator. Convert natural language descriptions into accurate SQL queries.

      Format your response as:
      1. **SQL Query**: The generated SQL query
      2. **Explanation**: Step-by-step explanation of the query
      3. **Performance Tips**: Suggestions for optimization
      4. **Alternative Approaches**: Other ways to achieve the same result
      5. **Potential Issues**: Edge cases or limitations

      Use standard SQL syntax and include proper formatting.`;
            const userPrompt = `Generate SQL for:\n\n${input.query}\n\nContext: ${input.context || 'Standard SQL'}`;
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
            await this.logAgentActivity('sql_generator', input, response.content, result.metadata.tokens, duration);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error('SQL Generator Agent Error:', error);
            return {
                success: false,
                result: 'Failed to generate SQL query. Please try again.',
                metadata: {
                    model: this.modelName,
                    tokens: { prompt: 0, completion: 0, total: 0 },
                    duration,
                },
            };
        }
    }
}
exports.SQLGeneratorAgent = SQLGeneratorAgent;
//# sourceMappingURL=sql-generator.agent.js.map