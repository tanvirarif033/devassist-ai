import { apiClient } from './client';
import type { Chat } from '../types';

export const chatApi = {
  createChat: async (data: { title: string; agentType: string }): Promise<Chat> => {
    const response = await apiClient.post('/chats', data);
    // The response structure: { success: true, data: chat }
    return response.data.data;
  },

  getChats: async (): Promise<Chat[]> => {
    const response = await apiClient.get('/chats');
    // The response structure: { success: true, data: chats[] }
    return response.data.data;
  },

  getChat: async (id: string): Promise<Chat> => {
    const response = await apiClient.get(`/chats/${id}`);
    // The response structure: { success: true, data: chat }
    return response.data.data;
  },

  sendMessage: async (id: string, data: { message: string }): Promise<{
    response: string;
    metadata: any;
  }> => {
    const response = await apiClient.post(`/chats/${id}/messages`, data);
    // The response structure: { success: true, data: { response, metadata, chat } }
    return response.data.data;
  },

  deleteChat: async (id: string): Promise<void> => {
    await apiClient.delete(`/chats/${id}`);
  },
};