import { Context } from "hono";
import { Bindings } from "hono/types";
export type Services<Env extends Bindings = Bindings> = {};

export type ServerOptions<Env extends Bindings = Bindings> = {
  services: Services<Env>;
  getEnv: (c: Context<{ Bindings: Env }>) => Env;
};
