import "./env.js";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";
import { checkDatabase, describeDatabase } from "./db.js";
import { brandRoutes } from "./routes/brands.js";
import { mediaRoutes } from "./routes/media.js";
import { projectRoutes } from "./routes/projects.js";
import { hashtagRoutes } from "./routes/hashtags.js";
import { trendRoutes } from "./routes/trends.js";
import { scheduleRoutes } from "./routes/schedules.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { aiRoutes } from "./routes/ai.js";
import { billingRoutes } from "./routes/billing.js";
import { socialRoutes } from "./social/routes.js";

const PORT = 3000;
const fastify = Fastify({ logger: true });

await fastify.register(fastifyCors, {
  origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
});

await fastify.register(multipart, {
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Keep the raw JSON body for HMAC webhook verification (billing),
// while still parsing it normally for every other route.
fastify.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
  (req as unknown as Record<string, unknown>).rawBody = body;
  try {
    done(null, JSON.parse(body as string));
  } catch (err) {
    done(err as Error);
  }
});

fastify.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ error: String(error) }, "Authentication Error");
      return reply.status(500).send({ error: "Internal authentication error" });
    }
  },
});

fastify.get("/api/health", async () => {
  const database = await checkDatabase().catch(() => false);
  return { ok: true, database };
});

fastify.get("/api/me", async (request, reply) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  if (!session) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  return reply.send(session);
});

await fastify.register(brandRoutes);
await fastify.register(mediaRoutes);
await fastify.register(projectRoutes);
await fastify.register(hashtagRoutes);
await fastify.register(trendRoutes);
await fastify.register(scheduleRoutes);
await fastify.register(analyticsRoutes);
await fastify.register(aiRoutes);
await fastify.register(billingRoutes);
await fastify.register(socialRoutes);

try {
  await fastify.listen({ port: PORT });
  console.log(`One Link API running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
