import { z } from "zod";

import { IsoDateTimeSchema, ObjectIdSchema } from "./common";

/** `owner` can do everything, including staff and countries. `staff` handles orders, catalog and partner requests. */
export const StaffRoleSchema = z.enum(["owner", "staff"]);
export type StaffRole = z.infer<typeof StaffRoleSchema>;

export const StaffUserSchema = z.object({
  id: ObjectIdSchema,
  email: z.email().max(200),
  name: z.string().trim().min(1).max(80),
  role: StaffRoleSchema,
  active: z.boolean(),
  createdAt: IsoDateTimeSchema,
});
export type StaffUser = z.infer<typeof StaffUserSchema>;

export const PASSWORD_MIN_LENGTH = 10;

export const LoginRequestSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** What `GET /admin/session` returns for a signed-in staff member. */
export const SessionSchema = z.object({
  user: StaffUserSchema,
  expiresAt: IsoDateTimeSchema,
});
export type Session = z.infer<typeof SessionSchema>;

export const CreateStaffRequestSchema = z.object({
  email: z.email().max(200),
  name: z.string().trim().min(1).max(80),
  role: StaffRoleSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
});
export type CreateStaffRequest = z.infer<typeof CreateStaffRequestSchema>;

export const UpdateStaffRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    role: StaffRoleSchema,
    active: z.boolean(),
    /** Set a new temporary password. */
    password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  })
  .partial();
export type UpdateStaffRequest = z.infer<typeof UpdateStaffRequestSchema>;

/** Name of the staff session cookie. */
export const STAFF_COOKIE_NAME = "gp_admin";
export const STAFF_SESSION_DAYS = 7;
