"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        username: zod_1.z.string().min(3, 'Username must be at least 3 characters').max(30),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    }),
});
//# sourceMappingURL=auth.validator.js.map