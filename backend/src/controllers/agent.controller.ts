

import { Request, Response } from 'express';
import { AgentFactory } from '../agents/agent.factory';
import { prisma } from '../database';
import { AuthRequest } from '../middleware/auth.middleware';

export class AgentController {
  /**
   * Code Review Agent Endpoint
   * Reviews code and provides detailed feedback with context
   */
  static async codeReview(req: AuthRequest, res: Response) {
    try {
      const { code, language, filePath, context: userContext } = req.body;
      const userId = req.user!.id;
      
      console.log(`📝 Code Review Request:`, { 
        codeLength: code?.length, 
        language,
        filePath,
        userId
      });
      
      // Validate input
      if (!code && !filePath) {
        return res.status(400).json({ 
          error: 'Either code or filePath is required' 
        });
      }

      // Get the agent
      const agent = AgentFactory.getAgent('code_review');
      
      // Create a chat for this review
      const chat = await prisma.chat.create({
        data: {
          userId,
          title: `Code Review: ${filePath || language || 'Code'}`,
          agentType: 'code_review',
          messages: [],
        },
      });

      // Build input for the agent
      const input: any = {
        userId: userId,
        chatId: chat.id,
        language: language || 'javascript',
        context: userContext,
      };

      // If filePath is provided, use it for context
      if (filePath) {
        input.filePath = filePath;
        input.code = code; // Optional additional code
      } else {
        input.code = code;
      }

      // Process the request
      const result = await agent.process(input);

      // Save to chat history
      const userMessageContent = filePath 
        ? `Review this file: ${filePath}\n${code ? `\nCode:\n${code}` : ''}`
        : `Review this code:\n${code}`;

      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          messages: [
            { role: 'user', content: userMessageContent },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      // Return response
      res.json({
        success: result.success,
        data: {
          ...result,
          chatId: chat.id,
        },
      });

    } catch (error: any) {
      console.error('❌ Code Review error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Bug Fix Agent Endpoint
   * Analyzes errors and provides solutions with context
   */
  static async bugFix(req: AuthRequest, res: Response) {
    try {
      const { error, context: userContext, filePath, stackTrace } = req.body;
      const userId = req.user!.id;
      
      console.log(`🐛 Bug Fix Request:`, { 
        error: error?.substring(0, 100), 
        context: userContext,
        filePath,
        userId
      });
      
      // Validate input
      if (!error) {
        return res.status(400).json({ 
          error: 'Error description is required' 
        });
      }

      // Get the agent
      const agent = AgentFactory.getAgent('bug_fix');

      // Create a chat for this bug fix
      const chat = await prisma.chat.create({
        data: {
          userId,
          title: 'Bug Fix Analysis',
          agentType: 'bug_fix',
          messages: [],
        },
      });

      // Build input for the agent
      const input: any = {
        error: error,
        context: userContext || 'General debugging context',
        userId: userId,
        chatId: chat.id,
        filePath: filePath,
        stackTrace: stackTrace,
      };

      // Process the request
      const result = await agent.process(input);

      // Save to chat history
      const userMessageContent = `Fix this error:\n${error}${filePath ? `\n\nFile: ${filePath}` : ''}${stackTrace ? `\n\nStack Trace:\n${stackTrace}` : ''}`;

      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          messages: [
            { role: 'user', content: userMessageContent },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      // Return response
      res.json({
        success: result.success,
        data: {
          ...result,
          chatId: chat.id,
        },
      });

    } catch (error: any) {
      console.error('❌ Bug Fix error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * SQL Generator Agent Endpoint
   * Generates SQL queries with database schema context
   */
  static async sqlGenerator(req: AuthRequest, res: Response) {
    try {
      const { query, context: userContext, database, tableNames } = req.body;
      const userId = req.user!.id;
      
      console.log(`🗄️ SQL Generator Request:`, { 
        query: query?.substring(0, 100), 
        context: userContext,
        database,
        userId
      });
      
      // Validate input
      if (!query) {
        return res.status(400).json({ 
          error: 'Query description is required' 
        });
      }

      // Get the agent
      const agent = AgentFactory.getAgent('sql_generator');

      // Create a chat for this SQL generation
      const chat = await prisma.chat.create({
        data: {
          userId,
          title: 'SQL Query Generation',
          agentType: 'sql_generator',
          messages: [],
        },
      });

      // Build input for the agent
      const input: any = {
        query: query,
        context: userContext || database || 'PostgreSQL',
        userId: userId,
        chatId: chat.id,
        database: database,
        tableNames: tableNames,
      };

      // Process the request
      const result = await agent.process(input);

      // Save to chat history
      const userMessageContent = `Generate SQL for:\n${query}${database ? `\n\nDatabase: ${database}` : ''}${tableNames ? `\n\nTables: ${tableNames.join(', ')}` : ''}`;

      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          messages: [
            { role: 'user', content: userMessageContent },
            { role: 'assistant', content: result.result },
          ],
        },
      });

      // Return response
      res.json({
        success: result.success,
        data: {
          ...result,
          chatId: chat.id,
        },
      });

    } catch (error: any) {
      console.error('❌ SQL Generator error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Agent Status
   * Returns information about available agents and their status
   */
  static async getAgentStatus(req: AuthRequest, res: Response) {
    try {
      const activeAgents = AgentFactory.getActiveAgentTypes();
      
      res.json({
        success: true,
        data: {
          availableAgents: ['code_review', 'bug_fix', 'sql_generator'],
          activeAgents: activeAgents,
          agentCount: activeAgents.length,
        },
      });

    } catch (error: any) {
      console.error('❌ Get Agent Status error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Clear Agent Cache
   * Clears the agent cache for performance testing
   */
  static async clearAgentCache(req: AuthRequest, res: Response) {
    try {
      AgentFactory.clearCache();
      
      res.json({
        success: true,
        message: 'Agent cache cleared successfully',
      });

    } catch (error: any) {
      console.error('❌ Clear Agent Cache error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Agent Logs
   * Returns recent agent logs for monitoring
   */
  static async getAgentLogs(req: AuthRequest, res: Response) {
    try {
      const { agentType, limit = 10 } = req.query;
      
      // ✅ Fix: Remove 'success' from select since it doesn't exist in the model
      const logs = await prisma.agentLog.findMany({
        where: agentType ? { agentType: agentType as string } : undefined,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string) || 10,
        select: {
          id: true,
          agentType: true,
          model: true,
          duration: true,
          createdAt: true,
          input: true,
          output: true,
          tokens: true,
        },
      });

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });

    } catch (error: any) {
      console.error('❌ Get Agent Logs error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Bulk Code Review
   * Reviews multiple files or a directory
   */
  static async bulkCodeReview(req: AuthRequest, res: Response) {
    try {
      const { files, language } = req.body;
      const userId = req.user!.id;
      
      console.log(`📚 Bulk Code Review Request:`, { 
        fileCount: files?.length, 
        language,
        userId
      });
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ 
          error: 'Files array is required with at least one file' 
        });
      }

      const agent = AgentFactory.getAgent('code_review');
      const results = [];
      const chatIds = [];

      for (const file of files) {
        try {
          // Create a chat for each file
          const chat = await prisma.chat.create({
            data: {
              userId,
              title: `Code Review: ${file.path || 'File'}`,
              agentType: 'code_review',
              messages: [],
            },
          });

          const input: any = {
            code: file.content || file.code,
            language: file.language || language || 'javascript',
            filePath: file.path,
            userId: userId,
            chatId: chat.id,
          };

          const result = await agent.process(input);

          await prisma.chat.update({
            where: { id: chat.id },
            data: {
              messages: [
                { role: 'user', content: `Review this file: ${file.path}` },
                { role: 'assistant', content: result.result },
              ],
            },
          });

          results.push({
            file: file.path || 'unnamed',
            success: result.success,
            chatId: chat.id,
          });
          chatIds.push(chat.id);

        } catch (error: any) {
          console.error(`❌ Error reviewing file ${file.path}:`, error);
          results.push({
            file: file.path || 'unnamed',
            success: false,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        data: {
          results,
          totalFiles: files.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          chatIds,
        },
      });

    } catch (error: any) {
      console.error('❌ Bulk Code Review error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get Agent Performance Stats
   * Returns performance metrics for all agents
   */
  static async getPerformanceStats(req: AuthRequest, res: Response) {
    try {
      // ✅ Fix: Remove 'success' from groupBy since it doesn't exist
      const stats = await prisma.agentLog.groupBy({
        by: ['agentType', 'model'],
        _count: {
          id: true,
        },
        _avg: {
          duration: true,
        },
        orderBy: {
          agentType: 'asc',
        },
      });

      // ✅ Fix: Get all logs and calculate success based on output or other criteria
      // Since there's no 'success' field, we'll use the presence of output or other logic
      const logs = await prisma.agentLog.findMany({
        select: {
          agentType: true,
          output: true,
          duration: true,
        },
      });

      // Calculate success rates based on whether output exists or duration is reasonable
      const successRates: Record<string, { total: number; success: number }> = {};
      for (const log of logs) {
        if (!successRates[log.agentType]) {
          successRates[log.agentType] = { total: 0, success: 0 };
        }
        successRates[log.agentType].total++;
        // Consider successful if output exists and duration is less than timeout
        if (log.output && log.duration < 30000) {
          successRates[log.agentType].success++;
        }
      }

      res.json({
        success: true,
        data: {
          stats,
          successRates: Object.entries(successRates).map(([agentType, data]) => ({
            agentType,
            total: data.total,
            success: data.success,
            successRate: data.total > 0 ? (data.success / data.total) * 100 : 0,
          })),
        },
      });

    } catch (error: any) {
      console.error('❌ Get Performance Stats error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}