"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRequestSchema = void 0;
const zod_1 = require("zod");
exports.agentRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().optional(),
        error: zod_1.z.string().optional(),
        query: zod_1.z.string().optional(),
        context: zod_1.z.string().optional(),
        language: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=agent.validator.js.map