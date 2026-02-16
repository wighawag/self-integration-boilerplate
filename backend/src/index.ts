import { Hono } from "hono";
import { CloudflareWorkerEnv } from "./env.js";
import { ServerOptions } from "./types.js";

export function createServer<CustomEnv extends CloudflareWorkerEnv>(
  options: ServerOptions<CustomEnv>,
) {
  const app = new Hono<{ Bindings: CustomEnv }>();

  // Health check endpoint
  app.get("/", (c) => {
    return c.text(`hello world`);
  });

  return app;
}
