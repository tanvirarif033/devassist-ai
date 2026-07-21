// src/api/agent.api.ts

import { apiClient } from './client';
import type { 
  AgentResponse, 
  CodeReviewRequest, 
  BugFixRequest, 
  SQLGeneratorRequest,
  BulkCodeReviewRequest,
  BulkCodeReviewResponse,
  PerformanceStats,
  AgentStatus
} from '../types';

export const agentApi = {
  // ✅ Enhanced with context support
  codeReview: async (data: CodeReviewRequest): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/code-review', data);
    return response.data;
  },

  bugFix: async (data: BugFixRequest): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/bug-fix', data);
    return response.data;
  },

  sqlGenerator: async (data: SQLGeneratorRequest): Promise<AgentResponse> => {
    const response = await apiClient.post('/agents/sql-generator', data);
    return response.data;
  },

  // ✅ Bulk operations
  bulkCodeReview: async (data: BulkCodeReviewRequest): Promise<BulkCodeReviewResponse> => {
    const response = await apiClient.post('/agents/bulk-code-review', data);
    return response.data;
  },

  // ✅ Monitoring endpoints
  getAgentStatus: async (): Promise<AgentStatus> => {
    const response = await apiClient.get('/agents/status');
    return response.data.data;
  },

  getAgentLogs: async (agentType?: string, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams();
    if (agentType) params.append('agentType', agentType);
    params.append('limit', String(limit));
    const response = await apiClient.get(`/agents/logs?${params.toString()}`);
    return response.data;
  },

  getPerformanceStats: async (): Promise<PerformanceStats[]> => {
    const response = await apiClient.get('/agents/performance');
    return response.data.data.successRates;
  },

  clearAgentCache: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/agents/clear-cache');
    return response.data;
  },
};