export type Env = {
  LOGFLARE_API_KEY?: string;
  LOGFLARE_SOURCE?: string;
  NAMED_LOGS?: string;
  NAMED_LOGS_LEVEL?: string;
  // Self Protocol configuration
  SELF_SCOPE_SEED?: string;
  SELF_ENDPOINT?: string;
};

export type CloudflareWorkerEnv = Env;
