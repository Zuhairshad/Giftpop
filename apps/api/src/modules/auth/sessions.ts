import { createHmac, randomBytes } from "node:crypto";

import type { Session } from "@giftpop/contracts";
import type { Types } from "mongoose";

import { StaffModel, toStaffUser, type StaffDoc } from "../staff/model";

import { getAuthConfig, SESSION_TTL_MS } from "./config";
import { SessionModel } from "./model";

/** 32 random bytes in base64url. Anything else cannot be one of our tokens. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashToken(token: string): string {
  return createHmac("sha256", getAuthConfig().sessionSecret).update(token).digest("hex");
}

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export async function createSession(staffId: Types.ObjectId): Promise<CreatedSession> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await SessionModel.create({ tokenHash: hashToken(token), staffId, expiresAt });
  return { token, expiresAt };
}

/** The response body for a signed-in staff member. */
export function toSession(staff: StaffDoc, expiresAt: Date): Session {
  return { user: toStaffUser(staff), expiresAt: expiresAt.toISOString() };
}

export interface ActiveSession {
  staff: StaffDoc;
  expiresAt: Date;
}

/** The staff member and expiry for a live token, or null when missing, expired or inactive. */
export async function findActiveSession(token: string | undefined): Promise<ActiveSession | null> {
  if (!token || !TOKEN_PATTERN.test(token)) return null;
  const session = await SessionModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const staff = await StaffModel.findById(session.staffId);
  if (!staff?.active) return null;
  return { staff, expiresAt: session.expiresAt };
}

export async function deleteSession(token: string): Promise<void> {
  await SessionModel.deleteOne({ tokenHash: hashToken(token) });
}

/** Sign a staff member out everywhere, optionally keeping one session (the caller's own). */
export async function deleteSessionsFor(
  staffId: Types.ObjectId | string,
  keepToken?: string,
): Promise<void> {
  await SessionModel.deleteMany({
    staffId,
    ...(keepToken ? { tokenHash: { $ne: hashToken(keepToken) } } : {}),
  });
}
