import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

// On Vercel the platform invokes the exported app; locally we listen ourselves.
if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(`\n  InvoiceFlow AI API running on ${env.apiUrl} (port ${env.port})`);
    console.log(`  Environment: ${env.nodeEnv}`);
    console.log(`  App URL:     ${env.appUrl}\n`);
  });
}

export default app;
