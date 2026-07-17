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

export interface AgentRequest {
  code?: string;
  error?: string;
  query?: string;
  context?: string;
  language?: string;
}

export interface AgentResponse {
  success: boolean;
  data: {
    success: boolean;
    result: string;
    metadata: {
      model: string;
      duration: number;
    };
  };
}