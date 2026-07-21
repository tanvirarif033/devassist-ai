
import {
  AgentContext,
  ContextBuilderOptions,
  ProjectContext,
  ConversationMemory,
  FileContext,
  ErrorContext,
  CodingStandard,
  AgentType,
} from './types';
import { ProjectDetector } from './project-detector';
import { SchemaExtractor } from './schema-extractor';
import { FileCollector } from './file-collector';
import { FileAnalyzer } from './file-analyzer';
import { prisma } from '../database';

export class ContextBuilder {
  private projectDetector: ProjectDetector;
  private schemaExtractor: SchemaExtractor;
  private fileCollector: FileCollector;
  private fileAnalyzer: FileAnalyzer;
  private options: ContextBuilderOptions;

  constructor(options: ContextBuilderOptions = {}) {
    this.options = {
      maxMemoryMessages: 10,
      includeRelatedFiles: true,
      maxFileSize: 50 * 1024,
      includeProjectStructure: true,
      maxFilesToAnalyze: 5,
      ...options,
    };

    this.projectDetector = new ProjectDetector(options.projectRoot);
    this.schemaExtractor = new SchemaExtractor();
    this.fileCollector = new FileCollector(
      options.projectRoot,
      this.options.maxFileSize
    );
    this.fileAnalyzer = new FileAnalyzer(options.projectRoot);
  }

  async build(
    agentType: AgentType,
    userPrompt: string,
    userId: string,
    chatId?: string,
    additionalContext?: Partial<AgentContext>
  ): Promise<AgentContext> {
    console.log(`🔨 Building context for ${agentType} agent...`);

    // 1. Get project context
    const project = await this.projectDetector.detect();
    console.log(`📦 Project: ${project.name} (${project.language})`);

    // 2. Get conversation memory
    const memory = await this.getConversationMemory(userId, chatId);

    // 3. Get agent-specific context with enhanced file analysis
    const agentSpecific = await this.getEnhancedAgentSpecificContext(
      agentType,
      userPrompt,
      userId,
      chatId
    );

    // 4. Get coding standards
    const codingStandards = this.getEnhancedCodingStandards(project);

    // 5. Get database schema (for SQL generator)
    let databaseSchema = '';
    if (agentType === 'sql_generator') {
      databaseSchema = await this.schemaExtractor.extract(true, true);
    }

    // 6. Get project structure
    const projectStructure = this.options.includeProjectStructure 
      ? await this.fileCollector.getProjectStructure(2)
      : '';

    // 7. Build the complete context
    const context: AgentContext = {
      agentType,
      userPrompt,
      project,
      memory,
      ...agentSpecific,
      codingStandards,
      databaseSchema,
      projectStructure,
      ...additionalContext,
    };

    console.log(`✅ Context built successfully`);
    return context;
  }

  private async getConversationMemory(
    userId: string,
    chatId?: string
  ): Promise<ConversationMemory> {
    const messages: ConversationMemory['messages'] = [];

    if (chatId) {
      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          select: { messages: true },
        });

        if (chat && chat.messages) {
          const parsed = chat.messages as any[];
          const recent = parsed.slice(-this.options.maxMemoryMessages!);
          
          for (const msg of recent) {
            messages.push({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not load conversation memory:', error);
      }
    }

    return {
      messages,
      maxMessages: this.options.maxMemoryMessages || 10,
    };
  }

  private async getEnhancedAgentSpecificContext(
    agentType: AgentType,
    userPrompt: string,
    userId: string,
    chatId?: string
  ): Promise<Partial<AgentContext>> {
    const context: Partial<AgentContext> = {};

    switch (agentType) {
      case 'code_review':
        // Extract file info from prompt
        const filePaths = this.extractFilePaths(userPrompt);
        
        if (filePaths.length > 0) {
          // Get files with analysis
          const files = await this.fileCollector.getMultipleFiles(filePaths, true);
          
          // Filter out null values
          const validFiles = files.filter(f => f !== null) as FileContext[];
          
          if (validFiles.length > 0) {
            context.files = validFiles;
            
            // Get dependency graph for the main file
            if (validFiles.length > 0) {
              try {
                const graph = await this.fileAnalyzer.getDependencyGraph(validFiles[0].path);
                context.metadata = {
                  ...context.metadata,
                  dependencyGraph: Object.fromEntries(graph),
                };
              } catch (error) {
                console.warn('Could not build dependency graph:', error);
              }
            }
            
            // Include related files
            if (this.options.includeRelatedFiles) {
              const allRelated: FileContext[] = [];
              for (const file of validFiles) {
                if (file.relatedFiles) {
                  allRelated.push(...file.relatedFiles);
                }
              }
              if (allRelated.length > 0) {
                context.files = [...validFiles, ...allRelated];
              }
            }

            // Limit files
            if (context.files && context.files.length > (this.options.maxFilesToAnalyze || 5)) {
              context.files = context.files.slice(0, this.options.maxFilesToAnalyze);
            }
          }
        }
        break;

      case 'bug_fix':
        // Enhanced error extraction
        const error = await this.extractEnhancedError(userPrompt);
        if (error) {
          context.error = error;
          
          // If error has file reference, include that file with analysis
          if (error.filePath) {
            const fileContext = await this.fileCollector.getFileContext(error.filePath, true);
            if (fileContext) {
              context.files = [fileContext];
              
              // Get function context if available
              if (error.functionName) {
                try {
                  const analysis = await this.fileAnalyzer.analyzeFile(error.filePath);
                  const functionLines = this.extractFunctionContext(
                    fileContext.content,
                    error.functionName
                  );
                  if (functionLines) {
                    context.metadata = {
                      ...context.metadata,
                      functionContext: functionLines,
                    };
                  }
                } catch (e) {
                  console.warn('Could not extract function context:', e);
                }
              }
            }
          }
        }
        break;

      case 'sql_generator':
        // For SQL, add enhanced schema context
        const tableRelationships = await this.schemaExtractor.getTableRelationships();
        context.metadata = {
          ...context.metadata,
          tableRelationships,
        };
        break;
    }

    return context;
  }

  private async extractEnhancedError(text: string): Promise<ErrorContext | undefined> {
    const error: Partial<ErrorContext> = {};

    // Extract error message
    const messageMatch = text.match(/(?:Error|error|Exception):\s*(.+?)(?:\n|$)/i);
    if (messageMatch) {
      error.message = messageMatch[1].trim();
    }

    // Extract file path
    const fileMatch = text.match(/(?:file|path|at):\s*['"]?([^'"]+\.(?:ts|js|py|go|rs|java))['"]?/i);
    if (fileMatch) {
      error.filePath = fileMatch[1];
    }

    // Extract function name
    const funcMatch = text.match(/(?:function|method):\s*['"]?(\w+)['"]?/i);
    if (funcMatch) {
      error.functionName = funcMatch[1];
    }

    // Extract stack trace
    const stackMatch = text.match(/(?:Stack trace:|stack:)\s*([\s\S]+?)(?:\n\n|\n$)/i);
    if (stackMatch) {
      error.stackTrace = stackMatch[1].trim();
    }

    // Extract code context
    const codeMatch = text.match(/```(?:\w+)?\s*([\s\S]+?)```/);
    if (codeMatch) {
      error.code = codeMatch[1].trim();
    }

    // Extract line numbers
    const lineMatch = text.match(/(?:line|at line)\s*[:=]\s*(\d+)/i);
    if (lineMatch) {
      error.line = parseInt(lineMatch[1]);
    }

    // Extract HTTP status
    const statusMatch = text.match(/status\s*[:=]\s*(\d{3})/i);
    if (statusMatch) {
      error.httpStatus = parseInt(statusMatch[1]);
    }

    // Determine error type
    if (text.includes('TypeError')) error.type = 'runtime';
    else if (text.includes('SyntaxError')) error.type = 'syntax';
    else if (text.includes('ReferenceError')) error.type = 'compile';
    else if (text.includes('Network') || text.includes('fetch')) error.type = 'network';

    if (Object.keys(error).length === 0) {
      if (text.includes('error') || text.includes('bug') || text.includes('fail')) {
        error.message = text.substring(0, 200);
      } else {
        return undefined;
      }
    }

    return error as ErrorContext;
  }

  private extractFunctionContext(content: string, functionName: string): string | null {
    const lines = content.split('\n');
    let functionStart = -1;
    let braceCount = 0;
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`function ${functionName}`) || 
          line.includes(`${functionName}(`) ||
          line.includes(`const ${functionName} =`)) {
        functionStart = i;
        found = true;
        break;
      }
    }

    if (!found) return null;

    // Find the function body
    let endLine = functionStart;
    for (let i = functionStart; i < lines.length; i++) {
      const line = lines[i];
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      if (braceCount === 0 && i > functionStart) {
        endLine = i;
        break;
      }
    }

    const functionLines = lines.slice(functionStart, endLine + 1);
    return functionLines.join('\n');
  }

  private extractFilePaths(text: string): string[] {
    const paths: string[] = [];
    
    const patterns = [
      /(?:src\/|\.\/|\.\.\/|\/)?[\w\-_]+(?:\/[\w\-_]+)*\.(?:tsx?|jsx?|css|scss|json|html|md|py|go|rs|java)/g,
      /(?:file|path):\s*['"]([^'"]+)['"]/gi,
      /```(?:\w+)\s*([\w\/.-]+\.\w+)/g,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const path = match[1] || match[0];
        if (path && !paths.includes(path) && !path.startsWith('node_modules')) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  private getEnhancedCodingStandards(project: ProjectContext): CodingStandard[] {
    const standards: CodingStandard[] = [];

    // Base TypeScript standards
    standards.push({
      name: 'TypeScript Best Practices',
      rules: [
        'Use TypeScript with strict mode enabled',
        'Avoid using `any` type - use `unknown` or specific types instead',
        'Use `async/await` instead of raw Promises with .then/.catch',
        'Use `const` for immutable variables, `let` for mutable',
        'Use meaningful and descriptive variable names',
        'Add JSDoc comments for public APIs and complex logic',
        'Use interfaces for object shapes, types for unions and primitives',
        'Use enums for constants with meaningful names',
        'Use optional chaining (?.) and nullish coalescing (??)',
        'Use array methods (map, filter, reduce) over loops when possible',
      ],
      examples: {
        good: 'const user: User = await getUser(id);',
        bad: 'let user: any = getUser(id);',
      },
    });

    // React standards
    if (project.frontend?.includes('React')) {
      standards.push({
        name: 'React Best Practices',
        rules: [
          'Use functional components with hooks, avoid class components',
          'Use `useState` for local state management',
          'Use `useEffect` for side effects with proper cleanup',
          'Use `useCallback` and `useMemo` for performance optimization',
          'Use React.memo for component memoization when needed',
          'Keep components small, focused, and single-responsibility',
          'Use proper key props in lists (unique, stable identifiers)',
          'Avoid inline styles, use CSS modules or Tailwind CSS',
          'Use React Router for navigation',
          'Implement error boundaries for error handling',
        ],
        examples: {
          good: 'const MyComponent: React.FC<Props> = ({ data }) => { ... }',
          bad: 'function MyComponent(props) { ... }',
        },
      });
    }

    // Express standards
    if (project.backend === 'Express') {
      standards.push({
        name: 'Express Best Practices',
        rules: [
          'Use async/await with proper try/catch error handling',
          'Use proper HTTP status codes (200, 400, 401, 403, 404, 500)',
          'Validate all request input with Zod or similar',
          'Use middleware for cross-cutting concerns (auth, logging, validation)',
          'Implement proper error handling middleware',
          'Use environment variables for configuration (dotenv)',
          'Implement rate limiting for security',
          'Use compression for response optimization',
          'Implement request logging with Morgan',
          'Use helmet for security headers',
        ],
        examples: {
          good: 'app.use(helmet()); app.use(compression());',
          bad: '// No security middleware',
        },
      });
    }

    // Prisma standards
    if (project.orm === 'Prisma') {
      standards.push({
        name: 'Prisma Best Practices',
        rules: [
          'Use Prisma Client in a singleton pattern to avoid multiple instances',
          'Use transactions for related database operations',
          'Use proper error handling for database operations',
          'Use `select` to limit returned fields (never select all)',
          'Use `include` for eager loading of relations',
          'Use middleware for logging and monitoring',
          'Use `@default` and `@unique` decorators appropriately',
          'Use migrations for schema changes (never sync)',
          'Use Prisma Studio for data browsing',
          'Implement database connection retry logic',
        ],
        examples: {
          good: 'const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });',
          bad: 'const user = await prisma.user.findUnique({ where: { id } });',
        },
      });
    }

    // SQL standards
    if (project.database) {
      standards.push({
        name: 'SQL Best Practices',
        rules: [
          'Use parameterized queries to prevent SQL injection',
          'Use indexes on columns used in WHERE, JOIN, and ORDER BY',
          'Use EXPLAIN to analyze query performance',
          'Use appropriate data types (avoid VARCHAR for numbers)',
          'Use transactions for multiple related operations',
          'Use CTEs for complex queries',
          'Avoid SELECT * - specify only needed columns',
          'Use LIMIT to restrict result sets',
          'Use proper JOIN types (INNER, LEFT, RIGHT)',
          'Use database migrations for schema changes',
        ],
        examples: {
          good: 'SELECT id, name FROM users WHERE email = $1 LIMIT 10;',
          bad: 'SELECT * FROM users;',
        },
      });
    }

    return standards;
  }
}