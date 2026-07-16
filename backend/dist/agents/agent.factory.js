"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = void 0;
const code_review_agent_1 = require("./code-review.agent");
const bug_fix_agent_1 = require("./bug-fix.agent");
const sql_generator_agent_1 = require("./sql-generator.agent");
class AgentFactory {
    static getAgent(type) {
        if (!this.agents.has(type)) {
            switch (type) {
                case 'code_review':
                    this.agents.set(type, new code_review_agent_1.CodeReviewAgent());
                    break;
                case 'bug_fix':
                    this.agents.set(type, new bug_fix_agent_1.BugFixAgent());
                    break;
                case 'sql_generator':
                    this.agents.set(type, new sql_generator_agent_1.SQLGeneratorAgent());
                    break;
                default:
                    throw new Error(`Unknown agent type: ${type}`);
            }
        }
        return this.agents.get(type);
    }
    static clearCache() {
        this.agents.clear();
    }
}
exports.AgentFactory = AgentFactory;
AgentFactory.agents = new Map();
//# sourceMappingURL=agent.factory.js.map