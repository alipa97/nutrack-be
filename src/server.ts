process.env.TZ = 'Asia/Jakarta';

// Trigger tsx watch reload for refreshed Prisma client
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Nutrack BE running on http://localhost:${env.port}`);
});