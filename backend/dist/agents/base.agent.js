"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const openai_1 = require("@langchain/openai");
const config_1 = require("../config");
const database_1 = require("../database");
class BaseAgent {
    constructor(modelName = 'meta-llama/llama-3.2-3b-instruct:free') {
        this.modelName = modelName;
        this.model = new openai_1.ChatOpenAI({
            apiKey: config_1.config.openRouter.apiKey,
            configuration: {
                baseURL: config_1.config.openRouter.baseUrl,
            },
            modelName: modelName,
            temperature: 0.3,
            maxTokens: 1000,
        });
    }
    async logAgentActivity(agentType, input, output, tokens, duration) {
        try {
            await database_1.prisma.agentLog.create({
                data: {
                    agentType,
                    input,
                    output,
                    model: this.modelName,
                    tokens,
                    duration,
                },
            });
        }
        catch (error) {
            console.error('Failed to log agent activity:', error);
        }
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base.agent.js.map