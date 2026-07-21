// src/types/index.ts

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    model?: string;
    duration?: number;
    context?: any ;
  };
}

export interface Chat {
  id: string;
  title: string;
  agentType: AgentType;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export type AgentType = 'code_review' | 'bug_fix' | 'sql_generator';

// ✅ Enhanced Agent Request types for context engineering
export interface CodeReviewRequest {
  code?: string;
  language?: string;
  filePath?: string;
  context?: string;
}

export interface BugFixRequest {
  error: string;
  context?: string;
  filePath?: string;
  stackTrace?: string;
}

export interface SQLGeneratorRequest {
  query: string;
  context?: string;
  database?: string;
  tableNames?: string[];
}

export type AgentRequest = CodeReviewRequest | BugFixRequest | SQLGeneratorRequest;

export interface AgentResponse {
  success: boolean;
  data: {
    success: boolean;
    result: string;
    metadata: {
      model: string;
      duration: number;
      tokens?: {
        prompt: number;
        completion: number;
        total: number;
      };
    };
    chatId?: string;
  };
}

// ✅ New types for bulk operations
export interface BulkCodeReviewRequest {
  files: {
    path: string;
    content: string;
    language?: string;
  }[];
  language?: string;
}

export interface BulkCodeReviewResponse {
  success: boolean;
  data: {
    results: {
      file: string;
      success: boolean;
      chatId?: string;
      error?: string;
    }[];
    totalFiles: number;
    successful: number;
    failed: number;
    chatIds: string[];
  };
}

// ✅ Performance stats types
export interface PerformanceStats {
  agentType: string;
  total: number;
  success: number;
  successRate: number;
}

export interface AgentStatus {
  availableAgents: AgentType[];
  activeAgents: AgentType[];
  agentCount: number;
}