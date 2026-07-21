// src/api/chat.api.ts

import { apiClient } from './client';
import type { Chat } from '../types';

export const chatApi = {
  createChat: async (data: { title: string; agentType: string }): Promise<Chat> => {
    const response = await apiClient.post('/chats', data);
    return response.data.data;
  },

  getChats: async (): Promise<Chat[]> => {
    const response = await apiClient.get('/chats');
    return response.data.data;
  },

  getChat: async (id: string): Promise<Chat> => {
    const response = await apiClient.get(`/chats/${id}`);
    return response.data.data;
  },

  // ✅ Enhanced to handle message metadata
  sendMessage: async (id: string, data: { message: string }): Promise<{
    response: string;
    metadata: {
      model: string;
      duration: number;
      tokens?: {
        prompt: number;
        completion: number;
        total: number;
      };
    };
    chat: Chat;
  }> => {
    const response = await apiClient.post(`/chats/${id}/messages`, data);
    return response.data.data;
  },

  deleteChat: async (id: string): Promise<void> => {
    await apiClient.delete(`/chats/${id}`);
  },
};