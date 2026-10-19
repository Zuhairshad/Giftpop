"use client";

import type { StaffUser } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateStaff } from "./staff-client";
import { staffErrorMessage } from "./staff-errors";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StaffTableProps {
  staff: StaffUser[];
  currentUserId: string;
}

export function StaffTable({ staff, currentUserId }: StaffTableProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setActive(user: StaffUser, active: boolean) {
    setBusyId(user.id);
    try {
      await updateStaff(user.id, { active });
      toast.success(
        active ? `${user.name} can sign in again` : `${user.name} can no longer sign in`,
      );
      router.refresh();
    } catch (error) {
      toast.error(
        staffErrorMessage(error, active ? "reactivate this account" : "deactivate this account"),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (staff.length === 0) {
    return <p className="text-muted-foreground text-sm">No staff accounts yet.</p>;
  }

  return (
    <Table label="Staff">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {staff.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name}
                {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                  {user.role === "owner" ? "Owner" : "Staff"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.active ? "outline" : "destructive"}>
                  {user.active ? "Active" : "Deactivated"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {isSelf ? (
                  <span className="text-muted-foreground text-xs">Your own account</span>
                ) : (
                  <Button
                    variant={user.active ? "destructive" : "outline"}
                    size="sm"
                    disabled={busyId === user.id}
                    aria-label={`${user.active ? "Deactivate" : "Reactivate"} ${user.name}`}
                    onClick={() => void setActive(user, !user.active)}
                  >
                    {user.active ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
