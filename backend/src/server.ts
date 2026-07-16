import app from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${config.env}`);
  console.log(`🔄 API Base URL: http://localhost:${PORT}/api`);
});