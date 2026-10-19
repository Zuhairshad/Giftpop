import type { StaffUser } from "@giftpop/contracts";

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireStaff` once the session cookie checks out. */
      staff?: StaffUser;
    }
  }
}

export {};
