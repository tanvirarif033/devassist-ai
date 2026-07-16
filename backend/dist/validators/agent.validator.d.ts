import { z } from 'zod';
export declare const agentRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        code: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        query: z.ZodOptional<z.ZodString>;
        context: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code?: string | undefined;
        query?: string | undefined;
        error?: string | undefined;
        language?: string | undefined;
        context?: string | undefined;
    }, {
        code?: string | undefined;
        query?: string | undefined;
        error?: string | undefined;
        language?: string | undefined;
        context?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        code?: string | undefined;
        query?: string | undefined;
        error?: string | undefined;
        language?: string | undefined;
        context?: string | undefined;
    };
}, {
    body: {
        code?: string | undefined;
        query?: string | undefined;
        error?: string | undefined;
        language?: string | undefined;
        context?: string | undefined;
    };
}>;
//# sourceMappingURL=agent.validator.d.ts.map