import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare class AgentController {
    static codeReview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bugFix(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static sqlGenerator(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=agent.controller.d.ts.map