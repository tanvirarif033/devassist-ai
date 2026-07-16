import { Request, Response } from 'express';
import { prisma } from '../database';
import { AgentFactory } from '../agents/agent.factory';
import { AuthRequest } from '../middleware/auth.middleware';

export class ChatController {
  async createChat(req: AuthRequest, res: Response) {
    try {
      const { title, agentType } = req.body;
      const userId = req.user!.id;

      const chat = await prisma.chat.create({
        data: {
          title,
          agentType,
          userId,
          messages: [],
        },
      });

      res.status(201).json({
        success: true,
        data: chat,
      });
    } catch (error) {
      console.error('Create chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserChats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const chats = await prisma.chat.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          agentType: true,
          messages: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        success: true,
        data: chats,
      });
    } catch (error) {
      console.error('Get chats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getChatById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const chat = await prisma.chat.findUnique({
        where: { id },
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      res.json({
        success: true,
        data: chat,
      });
    } catch (error) {
      console.error('Get chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      const chat = await prisma.chat.findUnique({
        where: { id },
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Get the appropriate agent
      const agent = AgentFactory.getAgent(chat.agentType as any);

      // Process the message based on agent type
      let processedResult;
      switch (chat.agentType) {
        case 'code_review':
          processedResult = await agent.process({ code: message });
          break;
        case 'bug_fix':
          processedResult = await agent.process({ error: message });
          break;
        case 'sql_generator':
          processedResult = await agent.process({ query: message });
          break;
        default:
          return res.status(400).json({ error: 'Invalid agent type' });
      }

      // Update chat with new messages
      const messages = chat.messages as any[];
      messages.push(
        { role: 'user', content: message },
        { role: 'assistant', content: processedResult.result }
      );

      const updatedChat = await prisma.chat.update({
        where: { id },
        data: {
          messages,
          updatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: {
          response: processedResult.result,
          metadata: processedResult.metadata,
          chat: updatedChat,
        },
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteChat(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      await prisma.chat.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Chat deleted successfully',
      });
    } catch (error) {
      console.error('Delete chat error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}