import type { Session, StaffUser } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { StaffModel, toStaffUser } from "../staff/model";

import { normaliseEmail } from "./email";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { createSession, toSession } from "./sessions";

export interface CreateOwnerInput {
  email: string;
  name: string;
  password: string;
}

/**
 * Creates an owner account. Safe to call twice: if the email already exists the
 * existing account is returned unchanged (the seed script relies on this).
 */
export async function createOwner(input: CreateOwnerInput): Promise<StaffUser> {
  const email = normaliseEmail(input.email);
  const existing = await StaffModel.findOne({ email });
  if (existing) return toStaffUser(existing);
  try {
    const created = await StaffModel.create({
      email,
      name: input.name,
      role: "owner",
      active: true,
      passwordHash: await hashPassword(input.password),
    });
    return toStaffUser(created);
  } catch (error) {
    // Lost a race with another caller creating the same email.
    const winner = await StaffModel.findOne({ email });
    if (winner) return toStaffUser(winner);
    throw error;
  }
}

function invalidLogin(): AppError {
  return new AppError("UNAUTHENTICATED", 401, "Email or password is wrong");
}

export interface LoginResult {
  token: string;
  session: Session;
}

/** Same error and similar work whether the email is unknown, inactive or the password is wrong. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const staff = await StaffModel.findOne({ email: normaliseEmail(email) });
  if (!staff) {
    await burnPasswordCheck(password);
    throw invalidLogin();
  }
  const passwordOk = await verifyPassword(staff.passwordHash, password);
  if (!passwordOk || !staff.active) throw invalidLogin();

  const { token, expiresAt } = await createSession(staff._id);
  return { token, session: toSession(staff, expiresAt) };
}
