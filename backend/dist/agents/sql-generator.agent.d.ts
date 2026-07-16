import { BaseAgent, AgentResponse } from './base.agent';
export declare class SQLGeneratorAgent extends BaseAgent {
    constructor();
    process(input: {
        query: string;
        context?: string;
    }): Promise<AgentResponse>;
}
//# sourceMappingURL=sql-generator.agent.d.ts.map