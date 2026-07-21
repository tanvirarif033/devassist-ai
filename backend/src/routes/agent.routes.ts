

import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { agentRequestSchema } from '../validators/agent.validator';

const router = Router();

router.use(authenticate);

// Main agent endpoints
router.post('/code-review', validateRequest(agentRequestSchema), AgentController.codeReview);
router.post('/bug-fix', validateRequest(agentRequestSchema), AgentController.bugFix);
router.post('/sql-generator', validateRequest(agentRequestSchema), AgentController.sqlGenerator);

// Bulk operations
router.post('/bulk-code-review', AgentController.bulkCodeReview);

// Monitoring endpoints
router.get('/status', AgentController.getAgentStatus);
router.get('/logs', AgentController.getAgentLogs);
router.get('/performance', AgentController.getPerformanceStats);

// Cache management
router.post('/clear-cache', AgentController.clearAgentCache);

export default router;