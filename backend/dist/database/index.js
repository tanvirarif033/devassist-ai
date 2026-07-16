"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
class Database {
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new client_1.PrismaClient({
                log: process.env.NODE_ENV === 'development'
                    ? ['query', 'info', 'warn', 'error']
                    : ['error'],
            });
        }
        return Database.instance;
    }
}
exports.prisma = Database.getInstance();
// Graceful shutdown
process.on('SIGINT', async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await exports.prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=index.js.map