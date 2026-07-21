// src/services/context.service.ts

import { ContextBuilder } from '../context/context-builder';
import { AgentType, AgentContext } from '../context/types';

export class ContextService {
  private builder: ContextBuilder;

  constructor(projectRoot?: string) {
    this.builder = new ContextBuilder({
      projectRoot: projectRoot || process.cwd(),
      maxMemoryMessages: 10,
      includeRelatedFiles: true,
      includeProjectStructure: true,
      maxFilesToAnalyze: 5,
    });
  }

  async buildContext(
    agentType: AgentType,
    userPrompt: string,
    userId: string,
    chatId?: string,
    additionalContext?: Record<string, any>
  ): Promise<AgentContext> {
    return this.builder.build(
      agentType,
      userPrompt,
      userId,
      chatId,
      additionalContext
    );
  }

  formatContextForPrompt(context: AgentContext): string {
    let prompt = '';

    // Project Context
    prompt += `## Project Context\n`;
    prompt += `- Name: ${context.project.name}\n`;
    prompt += `- Language: ${context.project.language}\n`;
    if (context.project.frontend) prompt += `- Frontend: ${context.project.frontend}\n`;
    if (context.project.backend) prompt += `- Backend: ${context.project.backend}\n`;
    if (context.project.database) prompt += `- Database: ${context.project.database}\n`;
    if (context.project.orm) prompt += `- ORM: ${context.project.orm}\n`;
    if (context.project.packageManager) prompt += `- Package Manager: ${context.project.packageManager}\n`;
    if (context.project.version) prompt += `- Version: ${context.project.version}\n`;
    
    // Dependencies
    if (context.project.dependencies) {
      const deps = Object.keys(context.project.dependencies).slice(0, 10);
      if (deps.length > 0) {
        prompt += `- Key Dependencies: ${deps.join(', ')}\n`;
      }
    }
    prompt += '\n';

    // Project Structure
    if (context.projectStructure) {
      prompt += context.projectStructure;
      prompt += '\n';
    }

    // Conversation Memory
    if (context.memory.messages.length > 0) {
      prompt += `## Conversation History\n`;
      for (const msg of context.memory.messages.slice(-5)) {
        const content = msg.content.length > 200 
          ? msg.content.substring(0, 200) + '...' 
          : msg.content;
        prompt += `**${msg.role}**: ${content}\n`;
      }
      prompt += '\n';
    }

    // Coding Standards
    if (context.codingStandards && context.codingStandards.length > 0) {
      prompt += `## Coding Standards\n`;
      for (const standard of context.codingStandards) {
        prompt += `### ${standard.name}\n`;
        for (const rule of standard.rules) {
          prompt += `- ${rule}\n`;
        }
        if (standard.examples) {
          prompt += '\n**Examples:**\n';
          for (const [key, value] of Object.entries(standard.examples)) {
            prompt += `- ${key}: \`${value}\`\n`;
          }
        }
        prompt += '\n';
      }
    }

    // Files with Analysis
    if (context.files && context.files.length > 0) {
      prompt += `## Files\n`;
      for (const file of context.files) {
        prompt += `### File: ${file.path} (${file.language})\n`;
        
        // File analysis summary
        if (file.analysis) {
          const analysis = file.analysis;
          if (analysis.exports.length > 0) {
            prompt += `**Exports**: ${analysis.exports.join(', ')}\n`;
          }
          if (analysis.functions.length > 0) {
            prompt += `**Functions**: ${analysis.functions.join(', ')}\n`;
          }
          if (analysis.classes.length > 0) {
            prompt += `**Classes**: ${analysis.classes.join(', ')}\n`;
          }
          if (analysis.interfaces.length > 0) {
            prompt += `**Interfaces**: ${analysis.interfaces.join(', ')}\n`;
          }
          // ✅ Fix: Properly handle imports with type safety
          if (analysis.imports && analysis.imports.length > 0) {
            // Get unique module names from imports
            const importModules = analysis.imports
              .map((imp: any) => imp.moduleName)
              .filter((moduleName: string, index: number, self: string[]) => 
                self.indexOf(moduleName) === index
              )
              .slice(0, 5);
            if (importModules.length > 0) {
              prompt += `**Imports**: ${importModules.join(', ')}\n`;
            }
          }
          prompt += '\n';
        }
        
        // File content
        prompt += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
        
        // Related files
        if (file.relatedFiles && file.relatedFiles.length > 0) {
          prompt += `**Related Files:**\n`;
          for (const related of file.relatedFiles) {
            prompt += `- ${related.path}\n`;
          }
          prompt += '\n';
        }
      }
    }

    // Error Context
    if (context.error) {
      prompt += `## Error Context\n`;
      prompt += `- **Message**: ${context.error.message}\n`;
      if (context.error.type) prompt += `- **Type**: ${context.error.type}\n`;
      if (context.error.line) prompt += `- **Line**: ${context.error.line}\n`;
      if (context.error.filePath) prompt += `- **File**: ${context.error.filePath}\n`;
      if (context.error.functionName) prompt += `- **Function**: ${context.error.functionName}\n`;
      if (context.error.httpStatus) prompt += `- **HTTP Status**: ${context.error.httpStatus}\n`;
      
      if (context.error.stackTrace) {
        prompt += `\n**Stack Trace:**\n\`\`\`\n${context.error.stackTrace}\n\`\`\`\n`;
      }
      
      if (context.error.code) {
        prompt += `\n**Code:**\n\`\`\`\n${context.error.code}\n\`\`\`\n`;
      }
      
      if (context.error.consoleOutput) {
        prompt += `\n**Console Output:**\n\`\`\`\n${context.error.consoleOutput.join('\n')}\n\`\`\`\n`;
      }
      
      prompt += '\n';
    }

    // Database Schema
    if (context.databaseSchema) {
      prompt += context.databaseSchema;
      prompt += '\n';
    }

    // ✅ Fix: Safely handle metadata with proper type checking
    if (context.metadata) {
      // Handle dependency graph
      if (context.metadata.dependencyGraph) {
        prompt += `## Dependency Graph\n`;
        const graph = context.metadata.dependencyGraph as Record<string, string[]>;
        for (const [file, deps] of Object.entries(graph)) {
          if (deps && deps.length > 0) {
            prompt += `- ${file} → ${deps.join(', ')}\n`;
          }
        }
        prompt += '\n';
      }
      
      // Handle table relationships
      if (context.metadata.tableRelationships) {
        prompt += context.metadata.tableRelationships;
        prompt += '\n';
      }
      
      // Handle function context
      if (context.metadata.functionContext) {
        prompt += `## Function Context\n`;
        prompt += `\`\`\`\n${context.metadata.functionContext}\n\`\`\`\n\n`;
      }
    }

    // User Prompt
    prompt += `## User Request\n`;
    prompt += context.userPrompt;
    prompt += '\n';

    return prompt;
  }

  // Helper to get a summary of the context
  getContextSummary(context: AgentContext): string {
    const summary = {
      project: context.project.name,
      language: context.project.language,
      frontend: context.project.frontend || 'N/A',
      backend: context.project.backend || 'N/A',
      database: context.project.database || 'N/A',
      files: context.files?.length || 0,
      memory: context.memory.messages.length,
      hasError: !!context.error,
      hasSchema: !!context.databaseSchema,
      standards: context.codingStandards?.length || 0,
    };

    let output = '📊 Context Summary\n';
    output += `- Project: ${summary.project}\n`;
    output += `- Language: ${summary.language}\n`;
    output += `- Frontend: ${summary.frontend}\n`;
    output += `- Backend: ${summary.backend}\n`;
    output += `- Database: ${summary.database}\n`;
    output += `- Files: ${summary.files}\n`;
    output += `- Memory: ${summary.memory} messages\n`;
    output += `- Error: ${summary.hasError ? 'Yes' : 'No'}\n`;
    output += `- Schema: ${summary.hasSchema ? 'Yes' : 'No'}\n`;
    output += `- Standards: ${summary.standards}\n`;

    return output;
  }
}