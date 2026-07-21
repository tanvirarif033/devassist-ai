

export type AgentType = 'code_review' | 'bug_fix' | 'sql_generator';

export interface ProjectContext {
  name: string;
  language: string;
  frontend?: string;
  backend?: string;
  database?: string;
  orm?: string;
  packageManager?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  structure?: string;
  metadata?: {  
    hasDocker?: boolean;
    hasGraphQL?: boolean;
    hasTests?: boolean;
    hasCI?: boolean;
    [key: string]: any; 
  };
}

export interface FileAnalysis {
  imports: {
    moduleName: string;
    importedItems: string[];
    sourceFile: string;
  }[];
  exports: string[];
  dependencies: string[];
  functions: string[];
  classes: string[];
  interfaces: string[];
  types: string[];
}

export interface FileContext {
  path: string;
  content: string;
  language: string;
  relatedFiles?: FileContext[];
  analysis?: FileAnalysis;
}

export interface ErrorContext {
  message: string;
  stackTrace?: string;
  code?: string;
  line?: number;
  column?: number;
  type?: 'runtime' | 'compile' | 'syntax' | 'network';
  httpStatus?: number;
  consoleOutput?: string[];
  filePath?: string;
  functionName?: string;
}

export interface ConversationMemory {
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }[];
  maxMessages: number;
  summary?: string;
}

export interface CodingStandard {
  name: string;
  rules: string[];
  examples?: Record<string, string>;
}

export interface AgentContext {
  agentType: AgentType;
  userPrompt: string;
  project: ProjectContext;
  memory: ConversationMemory;
  files?: FileContext[];
  error?: ErrorContext;
  codingStandards?: CodingStandard[];
  databaseSchema?: string;
  framework?: string;
  state?: Record<string, any>;
  metadata?: Record<string, any>;
  projectStructure?: string;
}

export interface ContextBuilderOptions {
  projectRoot?: string;
  maxMemoryMessages?: number;
  includeRelatedFiles?: boolean;
  maxFileSize?: number;
  includeProjectStructure?: boolean;
  maxFilesToAnalyze?: number;
}