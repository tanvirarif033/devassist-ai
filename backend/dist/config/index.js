"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    DATABASE_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRE: zod_1.z.string().default('7d'),
    OPENROUTER_API_KEY: zod_1.z.string(),
    OPENROUTER_BASE_URL: zod_1.z.string().url().default('https://openrouter.ai/api/v1'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().default('100'),
});
const env = envSchema.safeParse(process.env);
if (!env.success) {
    console.error('❌ Invalid environment variables:', env.error.format());
    process.exit(1);
}
exports.config = {
    env: env.data.NODE_ENV,
    port: parseInt(env.data.PORT),
    databaseUrl: env.data.DATABASE_URL,
    jwt: {
        secret: env.data.JWT_SECRET,
        expire: env.data.JWT_EXPIRE,
    },
    openRouter: {
        apiKey: env.data.OPENROUTER_API_KEY,
        baseUrl: env.data.OPENROUTER_BASE_URL,
    },
    rateLimit: {
        windowMs: parseInt(env.data.RATE_LIMIT_WINDOW_MS),
        max: parseInt(env.data.RATE_LIMIT_MAX_REQUESTS),
    },
};
//# sourceMappingURL=index.js.map