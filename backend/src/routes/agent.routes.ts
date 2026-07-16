import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { agentRequestSchema } from '../validators/agent.validator';

const router = Router();

router.use(authenticate);

router.post('/code-review', validateRequest(agentRequestSchema), AgentController.codeReview);
router.post('/bug-fix', validateRequest(agentRequestSchema), AgentController.bugFix);
router.post('/sql-generator', validateRequest(agentRequestSchema), AgentController.sqlGenerator);

export default router;