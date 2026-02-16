import { Hono } from "hono";
import { CloudflareWorkerEnv } from "./env.js";
import { ServerOptions } from "./types.js";
import {
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
} from "@selfxyz/core";

export function createServer<CustomEnv extends CloudflareWorkerEnv>(
  options: ServerOptions<CustomEnv>,
) {
  const app = new Hono<{ Bindings: CustomEnv }>();

  // Health check endpoint
  app.get("/", (c) => {
    return c.text(`hello world`);
  });

  // Verification endpoint
  app.post("/api/verify", async (c) => {
    try {
      // Get environment variables
      // The endpoint should be provided via environment variable
      // This is the public URL where the verification endpoint is hosted
      const scopeSeed = c.env.SELF_SCOPE_SEED || "self-workshop";
      const endpoint = c.env.SELF_ENDPOINT;

      if (!endpoint) {
        return c.json(
          {
            message: "SELF_ENDPOINT environment variable is not set",
          },
          500
        );
      }

      // Create verifier instance
      const selfBackendVerifier = new SelfBackendVerifier(
        scopeSeed,
        endpoint,
        true, // mockPassport: true = staging/testnet, false = mainnet
        AllIds,
        new DefaultConfigStore({
          minimumAge: 18,
          excludedCountries: ["USA"],
          ofac: false,
        }),
        "hex" // userIdentifierType
      );

      // Extract data from the request
      const { attestationId, proof, publicSignals, userContextData } =
        await c.req.json();

      // Verify all required fields are present
      if (!proof || !publicSignals || !attestationId || !userContextData) {
        return c.json(
          {
            message:
              "Proof, publicSignals, attestationId and userContextData are required",
          },
          200
        );
      }

      // Verify the proof
      const result = await selfBackendVerifier.verify(
        attestationId, // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
        proof, // The zero-knowledge proof
        publicSignals, // Public signals array
        userContextData // User context data (hex string)
      );

      // Check if verification was successful
      if (result.isValidDetails.isValid) {
        // Verification successful - process the result
        return c.json({
          status: "success",
          result: true,
          credentialSubject: result.discloseOutput,
        });
      } else {
        // Verification failed
        return c.json(
          {
            status: "error",
            result: false,
            reason: "Verification failed",
            error_code: "VERIFICATION_FAILED",
            details: result.isValidDetails,
          },
          200
        );
      }
    } catch (error) {
      return c.json(
        {
          status: "error",
          result: false,
          reason: error instanceof Error ? error.message : "Unknown error",
          error_code: "UNKNOWN_ERROR",
        },
        200
      );
    }
  });

  return app;
}
