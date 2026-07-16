import { Request, Response } from 'express';
import { AgentFactory } from '../agents/agent.factory';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth.middleware';

export class AgentController {
  static async codeReview(req: AuthRequest, res: Response) {
    try {
      const { code, language } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Code is required' });
      }

      const agent = AgentFactory.getAgent('code_review');
      const result = await agent.process({ code, language });

      
      await prisma.chat.create({
        data: {
          userId: req.user!.id,
          title: `Code Review: ${language || 'Code'}`,
          agentType: 'code_review',
          messages: [
            { role: 'user', content: `Review this ${language || 'code'}:\n${code}` },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Code Review error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async bugFix(req: AuthRequest, res: Response) {
    try {
      const { error, context } = req.body;
      
      if (!error) {
        return res.status(400).json({ error: 'Error description is required' });
      }

      const agent = AgentFactory.getAgent('bug_fix');
      const result = await agent.process({ error, context });

      await prisma.chat.create({
        data: {
          userId: req.user!.id,
          title: 'Bug Fix Analysis',
          agentType: 'bug_fix',
          messages: [
            { role: 'user', content: `Fix this error:\n${error}` },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('Bug Fix error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async sqlGenerator(req: AuthRequest, res: Response) {
    try {
      const { query, context } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query description is required' });
      }

      const agent = AgentFactory.getAgent('sql_generator');
      const result = await agent.process({ query, context });

      await prisma.chat.create({
        data: {
          userId: req.user!.id,
          title: 'SQL Query Generation',
          agentType: 'sql_generator',
          messages: [
            { role: 'user', content: `Generate SQL for:\n${query}` },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      res.json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('SQL Generator error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}