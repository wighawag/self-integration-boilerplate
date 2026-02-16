// ------------------------------------------------------------------------------------------------
// Polyfills
// ------------------------------------------------------------------------------------------------
import { Buffer } from "buffer";
(globalThis as any).Buffer = Buffer;

// ------------------------------------------------------------------------------------------------
// Logging
// ------------------------------------------------------------------------------------------------
import "named-logs-context";
import { enable as enableWorkersLogger } from "workers-logger";
import { logs } from "named-logs";
// ------------------------------------------------------------------------------------------------
import { wrapWithLogger } from "./logging/index.js";
import { Context } from "hono";
import { CloudflareWorkerEnv } from "./env";
import { createServer } from "./index.js";

// ------------------------------------------------------------------------------------------------
enableWorkersLogger("*");
const logger = logs("tempalte-self-server-cf-worker");
// ------------------------------------------------------------------------------------------------

const services = {};

export const app = createServer<CloudflareWorkerEnv>({
  services,
  getEnv: (c: Context<{ Bindings: CloudflareWorkerEnv }>) => c.env,
});

const fetch = async (
  request: Request,
  env: CloudflareWorkerEnv,
  ctx: ExecutionContext,
) => {
  return wrapWithLogger(request, env, ctx, async () => {
    return app.fetch(request, env, ctx);
  });
};

export default {
  fetch,
  // // @ts-expect-error TS6133
  // async scheduled(event, env, ctx) {
  // 	ctx.waitUntil(() => {
  // 		console.log(`scheduled`);
  // 	});
  // },
};
