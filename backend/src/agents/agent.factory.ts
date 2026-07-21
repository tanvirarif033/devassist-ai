
import { CodeReviewAgent } from './code-review.agent';
import { BugFixAgent } from './bug-fix.agent';
import { SQLGeneratorAgent } from './sql-generator.agent';
import { BaseAgent } from './base.agent';

export type AgentType = 'code_review' | 'bug_fix' | 'sql_generator';

export class AgentFactory {
  private static agents: Map<AgentType, BaseAgent> = new Map();

  static getAgent(type: AgentType): BaseAgent {
    if (!this.agents.has(type)) {
      console.log(`🔨 Creating new agent instance: ${type}`);
      
      switch (type) {
        case 'code_review':
          this.agents.set(type, new CodeReviewAgent());
          break;
        case 'bug_fix':
          this.agents.set(type, new BugFixAgent());
          break;
        case 'sql_generator':
          this.agents.set(type, new SQLGeneratorAgent());
          break;
        default:
          throw new Error(`Unknown agent type: ${type}`);
      }
    }
    return this.agents.get(type)!;
  }

  static clearCache(): void {
    console.log(`🧹 Clearing agent cache...`);
    this.agents.clear();
  }

  static getActiveAgentTypes(): AgentType[] {
    return Array.from(this.agents.keys());
  }
}