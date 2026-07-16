import { BaseAgent, AgentResponse } from './base.agent';
export declare class BugFixAgent extends BaseAgent {
    constructor();
    process(input: {
        error: string;
        context?: string;
    }): Promise<AgentResponse>;
}
//# sourceMappingURL=bug-fix.agent.d.ts.map