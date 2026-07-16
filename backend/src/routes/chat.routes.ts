import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createChatSchema, sendMessageSchema } from '../validators/chat.validator';

const router = Router();
const chatController = new ChatController();

router.use(authenticate); 

router.post('/', validateRequest(createChatSchema), chatController.createChat);
router.get('/', chatController.getUserChats);
router.get('/:id', chatController.getChatById);
router.post('/:id/messages', validateRequest(sendMessageSchema), chatController.sendMessage);
router.delete('/:id', chatController.deleteChat);

export default router;