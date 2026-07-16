import { z } from 'zod';
export declare const createChatSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        agentType: z.ZodEnum<["code_review", "bug_fix", "sql_generator"]>;
    }, "strip", z.ZodTypeAny, {
        agentType: "code_review" | "bug_fix" | "sql_generator";
        title: string;
    }, {
        agentType: "code_review" | "bug_fix" | "sql_generator";
        title: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        agentType: "code_review" | "bug_fix" | "sql_generator";
        title: string;
    };
}, {
    body: {
        agentType: "code_review" | "bug_fix" | "sql_generator";
        title: string;
    };
}>;
export declare const sendMessageSchema: z.ZodObject<{
    body: z.ZodObject<{
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
    }, {
        message: string;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        message: string;
    };
}, {
    params: {
        id: string;
    };
    body: {
        message: string;
    };
}>;
//# sourceMappingURL=chat.validator.d.ts.map