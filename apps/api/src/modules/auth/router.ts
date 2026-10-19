import { LoginRequestSchema, type LoginRequest, type Session } from "@giftpop/contracts";
import { Router, type RequestHandler } from "express";

import { AppError } from "../../lib/errors";
import { validateBody } from "../../lib/validate";
import { toStaffUser } from "../staff/model";

import { getAuthConfig } from "./config";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "./cookie";
import { createLoginLimiter, defaultLoginStore } from "./rate-limit";
import { login } from "./service";
import { deleteSession, findActiveSession } from "./sessions";

export interface AuthRouterOptions {
  /** Replace the login limiter, for example with a tighter or fresh one in tests. */
  loginLimiter?: RequestHandler;
}

export function createAuthRouter({
  loginLimiter = createLoginLimiter({ store: defaultLoginStore }),
}: AuthRouterOptions = {}): Router {
  const router = Router();

  router.post("/login", validateBody(LoginRequestSchema), loginLimiter, async (req, res) => {
    const { email, password } = req.body as LoginRequest;
    const { token, session } = await login(email, password);
    setSessionCookie(res, token, getAuthConfig().secureCookies);
    res.json(session);
  });

  router.post("/logout", async (req, res) => {
    const token = readSessionToken(req);
    if (token) await deleteSession(token);
    clearSessionCookie(res, getAuthConfig().secureCookies);
    res.status(204).end();
  });

  router.get("/me", async (req, res) => {
    const active = await findActiveSession(readSessionToken(req));
    if (!active) throw new AppError("UNAUTHENTICATED", 401, "Sign in to continue");
    const session: Session = {
      user: toStaffUser(active.staff),
      expiresAt: active.expiresAt.toISOString(),
    };
    res.json(session);
  });

  return router;
}

export const authRouter: Router = createAuthRouter();
