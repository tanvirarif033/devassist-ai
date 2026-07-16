"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.createChatSchema = void 0;
const zod_1 = require("zod");
exports.createChatSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(100),
        agentType: zod_1.z.enum(['code_review', 'bug_fix', 'sql_generator']),
    }),
});
exports.sendMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string().min(1).max(10000),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid chat ID'),
    }),
});
//# sourceMappingURL=chat.validator.js.map