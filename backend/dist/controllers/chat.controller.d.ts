import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class ChatController {
    createChat(req: AuthRequest, res: Response): Promise<void>;
    getUserChats(req: AuthRequest, res: Response): Promise<void>;
    getChatById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    sendMessage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteChat(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=chat.controller.d.ts.map