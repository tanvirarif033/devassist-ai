import { ChatOpenAI } from '@langchain/openai';
export interface AgentResponse {
    success: boolean;
    result: string;
    metadata: {
        model: string;
        tokens: {
            prompt: number;
            completion: number;
            total: number;
        };
        duration: number;
    };
}
export declare abstract class BaseAgent {
    protected model: ChatOpenAI;
    protected modelName: string;
    constructor(modelName?: string);
    protected logAgentActivity(agentType: string, input: any, output: any, tokens: any, duration: number): Promise<void>;
    abstract process(input: any): Promise<AgentResponse>;
}
//# sourceMappingURL=base.agent.d.ts.map