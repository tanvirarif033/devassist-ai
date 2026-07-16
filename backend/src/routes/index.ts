import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import agentRoutes from './agent.routes';

const router = Router();


const routeGroups = [
  { path: '/auth', routes: authRoutes },
  { path: '/chats', routes: chatRoutes },
  { path: '/agents', routes: agentRoutes },
];

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DevAssist AI API is running 🚀",
  });
});
routeGroups.forEach(({ path, routes }) => {
  router.use(path, routes);
});

export default router;