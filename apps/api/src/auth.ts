import { betterAuth } from "better-auth";
import { pool } from "./db.js";
import { sendEmail } from "./email.js";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your One Link password",
        `<p>Click the link below to reset your password. It expires soon.</p><p><a href="${url}">Reset password</a></p>`
      );
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Verify your One Link email",
        `<p>Welcome to One Link! Confirm your email to secure your account.</p><p><a href="${url}">Verify email</a></p>`
      );
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
