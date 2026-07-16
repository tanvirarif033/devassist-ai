import { BaseAgent } from './base.agent';
type AgentType = 'code_review' | 'bug_fix' | 'sql_generator';
export declare class AgentFactory {
    private static agents;
    static getAgent(type: AgentType): BaseAgent;
    static clearCache(): void;
}
export {};
//# sourceMappingURL=agent.factory.d.ts.map