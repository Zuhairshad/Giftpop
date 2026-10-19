import type { Metadata } from "next";
import { cookies } from "next/headers";

import { PageHeader } from "@/components/page-header";
import { InviteDialog } from "@/features/staff/invite-dialog";
import { fetchStaff } from "@/features/staff/staff-client";
import { StaffTable } from "@/features/staff/staff-table";
import { requireOwner } from "@/lib/session";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const { user } = await requireOwner();
  const staff = await fetchStaff((await cookies()).toString());

  return (
    <>
      <PageHeader
        title="Staff"
        description="Accounts that can sign in to this admin."
        actions={<InviteDialog />}
      />
      <div className="p-4 md:p-6">
        <StaffTable staff={staff} currentUserId={user.id} />
      </div>
    </>
  );
}
