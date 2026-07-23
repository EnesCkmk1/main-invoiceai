import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, () => {
  console.log(`\n  InvoiceFlow AI API running on ${env.apiUrl} (port ${env.port})`);
  console.log(`  Environment: ${env.nodeEnv}`);
  console.log(`  App URL:     ${env.appUrl}\n`);
});
