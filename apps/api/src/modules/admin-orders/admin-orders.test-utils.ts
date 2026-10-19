// Test helpers for the admin-orders tests. Not imported by app code.
import type { AdminOrderDetail } from "@giftpop/contracts";
import type { Express } from "express";
import request from "supertest";

import { createTestApp } from "../../../test/app";
import { loginAs, seedStaff } from "../auth/auth.test-utils";
import { createLoginLimiter } from "../auth/rate-limit";
import { createAuthRouter } from "../auth/router";

import { adminOrdersRouter } from "./router";

export const BASE = "/v1/admin/orders";

export function createAdminApp(): Express {
  return createTestApp([
    {
      path: "/auth",
      router: createAuthRouter({ loginLimiter: createLoginLimiter({ limit: 100_000 }) }),
    },
    { path: "/admin/orders", router: adminOrdersRouter },
  ]);
}

export interface StaffSession {
  id: string;
  name: string;
  cookie: string;
}

/** A real staff account with a real session cookie. */
export async function signIn(
  app: Express,
  name = "Amina Staff",
  email = "amina@giftpop.test",
): Promise<StaffSession> {
  const staff = await seedStaff({ name, email });
  return { id: staff.id, name, cookie: await loginAs(app, email) };
}

export function api(app: Express, session: StaffSession) {
  return {
    get: (path: string) => request(app).get(`${BASE}${path}`).set("Cookie", session.cookie),
    post: (path: string, body: object) =>
      request(app).post(`${BASE}${path}`).set("Cookie", session.cookie).send(body),
    patch: (path: string, body: object) =>
      request(app).patch(`${BASE}${path}`).set("Cookie", session.cookie).send(body),
  };
}

export type DetailBody = AdminOrderDetail;
