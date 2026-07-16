import { BaseAgent, AgentResponse } from './base.agent';
export declare class CodeReviewAgent extends BaseAgent {
    constructor();
    process(input: {
        code: string;
        language?: string;
    }): Promise<AgentResponse>;
}
//# sourceMappingURL=code-review.agent.d.ts.map