import type { StaffUser } from "@giftpop/contracts";

export interface CreateOwnerInput {
  email: string;
  name: string;
  password: string;
}

/**
 * Creates an owner account. Safe to call twice: if the email already exists the
 * existing account is returned unchanged (the seed script relies on this).
 */
export async function createOwner(_input: CreateOwnerInput): Promise<StaffUser> {
  throw new Error("not implemented");
}
