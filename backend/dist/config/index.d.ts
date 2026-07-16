export declare const config: {
    env: "development" | "production" | "test";
    port: number;
    databaseUrl: string;
    jwt: {
        secret: string;
        expire: string;
    };
    openRouter: {
        apiKey: string;
        baseUrl: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
};
export type Config = typeof config;
//# sourceMappingURL=index.d.ts.map