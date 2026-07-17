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

    console.log(`📩 Sending message to chat: ${id}`);
    console.log(`📝 Message: ${message}`);

    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    console.log(`🤖 Agent Type: ${chat.agentType}`);

    const agent = AgentFactory.getAgent(chat.agentType as any);
    
    let inputData;
    switch (chat.agentType) {
      case 'code_review':
        inputData = { code: message, language: 'javascript' };
        break;
      case 'bug_fix':
        // ✅ For bug fix, pass both error and context
        inputData = { 
          error: message, 
          context: 'General debugging context' 
        };
        break;
      case 'sql_generator':
        inputData = { query: message, context: 'PostgreSQL' };
        break;
      default:
        return res.status(400).json({ error: 'Invalid agent type' });
    }

    // Set timeout for agent processing
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Agent processing timeout (30s)')), 30000);
    });

    const processPromise = agent.process(inputData);
    const processedResult = await Promise.race([processPromise, timeoutPromise]) as any;

    console.log(`✅ Agent response: ${processedResult.success ? 'Success' : 'Failed'}`);

    const messages = chat.messages as any[] || [];
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
  } catch (error: any) {
    console.error('❌ Send message error:', error);
    
    let errorMessage = 'Internal server error';
    if (error.message?.includes('timeout')) {
      errorMessage = 'The AI is taking too long to respond. Please try again.';
    } else if (error.message?.includes('API key')) {
      errorMessage = 'AI service configuration error. Please contact support.';
    } else if (error.message?.includes('model')) {
      errorMessage = 'AI model unavailable. Please try again later.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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