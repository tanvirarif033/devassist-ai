"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const chat_routes_1 = __importDefault(require("./chat.routes"));
const agent_routes_1 = __importDefault(require("./agent.routes"));
const router = (0, express_1.Router)();
// Register all routes
const routeGroups = [
    { path: '/auth', routes: auth_routes_1.default },
    { path: '/chats', routes: chat_routes_1.default },
    { path: '/agents', routes: agent_routes_1.default },
];
routeGroups.forEach(({ path, routes }) => {
    router.use(path, routes);
});
exports.default = router;
//# sourceMappingURL=index.js.map