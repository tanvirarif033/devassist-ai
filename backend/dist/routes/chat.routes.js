"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const chat_validator_1 = require("../validators/chat.validator");
const router = (0, express_1.Router)();
const chatController = new chat_controller_1.ChatController();
router.use(auth_middleware_1.authenticate); // All chat routes require authentication
router.post('/', (0, validate_middleware_1.validateRequest)(chat_validator_1.createChatSchema), chatController.createChat);
router.get('/', chatController.getUserChats);
router.get('/:id', chatController.getChatById);
router.post('/:id/messages', (0, validate_middleware_1.validateRequest)(chat_validator_1.sendMessageSchema), chatController.sendMessage);
router.delete('/:id', chatController.deleteChat);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map