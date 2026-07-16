"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const agent_controller_1 = require("../controllers/agent.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const agent_validator_1 = require("../validators/agent.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/code-review', (0, validate_middleware_1.validateRequest)(agent_validator_1.agentRequestSchema), agent_controller_1.AgentController.codeReview);
router.post('/bug-fix', (0, validate_middleware_1.validateRequest)(agent_validator_1.agentRequestSchema), agent_controller_1.AgentController.bugFix);
router.post('/sql-generator', (0, validate_middleware_1.validateRequest)(agent_validator_1.agentRequestSchema), agent_controller_1.AgentController.sqlGenerator);
exports.default = router;
//# sourceMappingURL=agent.routes.js.map