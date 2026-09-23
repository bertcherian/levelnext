import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerOAuthRoutes } from "./oauth";
import { registerMagicLinkVerifyRoute } from "../routers/emailAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { weeklySummaryHandler, momentumCheckinHandler, icFollowUpReminderHandler, earlyCareerNudgeDeliveryHandler, guidedMirrorReminderHandler, executiveDecisionReviewReminderHandler, personaBuilderReminderHandler } from "../scheduledHandlers";
import { isAllowedCorsOrigin } from "./originPolicy";

// ── Rate limiters ─────────────────────────────────────────────────────────────
// General API rate limiter — applies to all /api/trpc requests
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

// Strict rate limiter for LLM-heavy mutations — prevents API cost abuse
const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP for LLM endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please wait a moment." },
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Trust the reverse proxy (Cloud Run / Manus hosting) so req.protocol
  // correctly returns 'https' in production. Without this, isSecureRequest()
  // returns false and the session cookie is set without Secure=true, which
  // causes browsers to silently drop it when SameSite=None is set.
  app.set('trust proxy', 1);

  // Keep public traffic on one hostname. This makes OAuth callbacks and session
  // cookies deterministic even when a visitor starts from the www alias.
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === "production" && req.hostname.toLowerCase() === "www.levelnext.coach") {
      res.redirect(308, `https://levelnext.coach${req.originalUrl}`);
      return;
    }
    next();
  });

  // ── Security middleware ─────────────────────────────────────────────────────
  // Helmet sets secure HTTP headers: CSP, X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security, etc. In development we relax CSP to allow Vite HMR.
  const isDev = process.env.NODE_ENV === "development";
  app.use(helmet({
    contentSecurityPolicy: isDev ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://api.manus.im"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://api.manus.im",
          "https://levelnext.coach",
          "https://www.levelnext.coach",
        ],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for third-party resources
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow S3 resources
  }));

  // CORS — restrict production to known domains while permitting Manus-managed previews in development.
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, same-origin)
      if (isAllowedCorsOrigin(origin, process.env.NODE_ENV)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Required for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-N8N-API-KEY"],
  }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Rate limiting ───────────────────────────────────────────────────────────
  // General limiter on all API routes
  app.use("/api/", apiLimiter);

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  await registerMagicLinkVerifyRoute(app);
  // Scheduled Heartbeat endpoints
  app.post("/api/scheduled/weeklySummary", weeklySummaryHandler);
  app.post("/api/scheduled/momentumCheckin", momentumCheckinHandler);
  app.post("/api/scheduled/icFollowUpReminder", icFollowUpReminderHandler);
  app.post("/api/scheduled/earlyCareerNudges", earlyCareerNudgeDeliveryHandler);
  app.post("/api/scheduled/guidedMirrorReminder", guidedMirrorReminderHandler);
  app.post("/api/scheduled/executiveDecisionReviewReminder", executiveDecisionReviewReminderHandler);
  app.post("/api/scheduled/personaBuilderReminder", personaBuilderReminderHandler);

  // tRPC API — strict limiter applied before the tRPC handler
  app.use("/api/trpc", llmLimiter);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
