import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";
import { checkAvatar, checkName } from "./avatar.js";
import { pool } from "./db.js";
import { sendEmail } from "./email.js";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

async function audit(userId: string, event: string) {
  await pool
    .query("INSERT INTO auth_events (user_id, event) VALUES ($1,$2)", [userId, event])
    .catch((e) => console.error("[audit]", e instanceof Error ? e.message : e));
}

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean),
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
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
  plugins: [twoFactor()],
  databaseHooks: {
    user: {
      update: {
        // Keep profile pictures small and safe, and names tidy.
        before: async (data) => {
          const d = data as Record<string, unknown>;
          if ("image" in d) {
            const r = checkAvatar(d.image);
            if (!r.ok) throw new APIError("BAD_REQUEST", { message: r.error });
          }
          if ("name" in d) {
            const r = checkName(d.name);
            if (!r.ok) throw new APIError("BAD_REQUEST", { message: r.error });
            d.name = r.name;
          }
          return { data: d };
        },
      },
      create: {
        after: async (user) => {
          await audit(user.id, "signup");
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          await audit(session.userId, "signin");
        },
      },
      delete: {
        after: async (session) => {
          await audit(session.userId, "signout");
        },
      },
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
