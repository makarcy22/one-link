import { betterAuth } from "better-auth";
import { pool } from "./db.js";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Development only: print reset links to the server console.
    // Production will use a real email provider (see Phase 3 notes).
    sendResetPassword: async ({ user, url }) => {
      console.log(`[dev] password reset for ${user.email}: ${url}`);
    },
  },
  ...(googleConfigured
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          },
        },
      }
    : {}),
});
