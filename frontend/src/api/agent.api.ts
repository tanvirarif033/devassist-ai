import { apiClient } from './client';
import type { AgentResponse } from '../types';

export const agentApi = {
  codeReview: async (data: { code: string; language?: string }): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/code-review', data);
    return response.data;
  },

  bugFix: async (data: { error: string; context?: string }): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/bug-fix', data);
    return response.data;
  },

  sqlGenerator: async (data: { query: string; context?: string }): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/sql-generator', data);
    return response.data;
  },
};