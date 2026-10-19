import type { CreateStaffRequest, StaffUser, UpdateStaffRequest } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { normaliseEmail } from "../auth/email";
import { hashPassword } from "../auth/password";
import { deleteSessionsFor } from "../auth/sessions";

import { StaffModel, toStaffUser } from "./model";

export async function listStaff(): Promise<StaffUser[]> {
  const docs = await StaffModel.find().sort({ createdAt: 1, _id: 1 });
  return docs.map(toStaffUser);
}

export async function createStaff(input: CreateStaffRequest): Promise<StaffUser> {
  const email = normaliseEmail(input.email);
  if (await StaffModel.exists({ email })) {
    throw new AppError("CONFLICT", 409, "A staff account with that email already exists");
  }
  // A concurrent duplicate hits the unique index; the error middleware maps it to the same 409.
  const created = await StaffModel.create({
    email,
    name: input.name,
    role: input.role,
    active: true,
    passwordHash: await hashPassword(input.password),
  });
  return toStaffUser(created);
}

export interface UpdateContext {
  /** The signed-in owner making the change. */
  actor: StaffUser;
  /** The actor's own session token, kept alive when they change their own password. */
  actorToken?: string;
}

export async function updateStaff(
  id: string,
  patch: UpdateStaffRequest,
  { actor, actorToken }: UpdateContext,
): Promise<StaffUser> {
  const staff = await StaffModel.findById(id);
  if (!staff) throw new AppError("NOT_FOUND", 404, "Staff account not found");

  const isSelf = staff.id === actor.id;
  if (isSelf && patch.active === false) {
    throw new AppError("CONFLICT", 409, "You cannot deactivate your own account");
  }
  if (isSelf && patch.role !== undefined && patch.role !== "owner") {
    throw new AppError("CONFLICT", 409, "You cannot remove your own owner role");
  }

  if (patch.name !== undefined) staff.name = patch.name;
  if (patch.role !== undefined) staff.role = patch.role;
  if (patch.active !== undefined) staff.active = patch.active;
  if (patch.password !== undefined) staff.passwordHash = await hashPassword(patch.password);
  await staff.save();

  if (patch.active === false || patch.password !== undefined) {
    await deleteSessionsFor(staff._id, isSelf ? actorToken : undefined);
  }
  return toStaffUser(staff);
}
