import type { StaffRole, StaffUser } from "@giftpop/contracts";
import type { Express } from "express";
import request from "supertest";

import { StaffModel, toStaffUser } from "../staff/model";

import { hashPassword } from "./password";

export const PASSWORD = "correct horse battery";

export interface SeedStaffInput {
  email?: string;
  name?: string;
  role?: StaffRole;
  active?: boolean;
  password?: string;
}

/** Insert a staff account directly, bypassing the API. */
export async function seedStaff(input: SeedStaffInput = {}): Promise<StaffUser> {
  const doc = await StaffModel.create({
    email: input.email ?? "owner@giftpop.test",
    name: input.name ?? "Test Person",
    role: input.role ?? "staff",
    active: input.active ?? true,
    passwordHash: await hashPassword(input.password ?? PASSWORD),
  });
  return toStaffUser(doc);
}

/** Sign in through the API and return the `Cookie` header value for later requests. */
export async function loginAs(
  app: Express,
  email: string,
  password: string = PASSWORD,
): Promise<string> {
  const res = await request(app).post("/v1/auth/login").send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${res.text}`);
  const setCookie = res.headers["set-cookie"] as unknown as string[] | undefined;
  const pair = setCookie?.[0]?.split(";")[0];
  if (!pair) throw new Error("login did not set a cookie");
  return pair;
}
