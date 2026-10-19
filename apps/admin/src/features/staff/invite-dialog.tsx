"use client";

import type { StaffUser } from "@giftpop/contracts";
import { CheckIcon, CopyIcon, UserPlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { generateTemporaryPassword, validateInvite, type InviteValues } from "./invite";
import { createStaff } from "./staff-client";
import { staffErrorMessage } from "./staff-errors";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EMPTY: InviteValues = { name: "", email: "", role: "staff", password: "" };

const resolver: Resolver<InviteValues> = (values) => {
  const result = validateInvite(values);
  if (result.ok) return { values, errors: {} };
  const errors: FieldErrors<InviteValues> = {};
  for (const [field, message] of Object.entries(result.errors)) {
    if (field === "name" || field === "email" || field === "role" || field === "password") {
      errors[field] = { type: "validation", message };
    }
  }
  return { values: {}, errors };
};

const SELECT_CLASS =
  "border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive h-8 w-full rounded-lg border bg-transparent px-2 text-sm outline-none focus-visible:ring-3";

interface Created {
  user: StaffUser;
  password: string;
}

export function InviteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({ resolver, defaultValues: EMPTY });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset(EMPTY);
      setCreated(null);
      setCopied(false);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = validateInvite(values);
    if (!result.ok) return;
    try {
      const user = await createStaff(result.data);
      setCreated({ user, password: result.data.password });
      toast.success(`${user.name} can now sign in`);
      router.refresh();
    } catch (error) {
      const message = staffErrorMessage(error, "add this staff member");
      setError("root", { message });
      toast.error(message);
    }
  });

  async function copyPassword(password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      toast.error("Could not copy. Select the password and copy it by hand.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <UserPlusIcon data-icon="inline-start" aria-hidden="true" />
        Invite staff member
      </DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                Give {created.user.name} this temporary password now. It is shown once and cannot be
                looked up later.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Sign in as {created.user.email}</span>
              <div className="flex items-center gap-2">
                <code className="bg-muted min-w-0 flex-1 rounded-lg px-2.5 py-1.5 font-mono text-sm break-all select-all">
                  {created.password}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyPassword(created.password)}
                >
                  {copied ? (
                    <CheckIcon data-icon="inline-start" aria-hidden="true" />
                  ) : (
                    <CopyIcon data-icon="inline-start" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy password"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite staff member</DialogTitle>
              <DialogDescription>
                They sign in with this email and a temporary password you give them.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              {errors.root?.message ? (
                <p
                  role="alert"
                  className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
                >
                  {errors.root.message}
                </p>
              ) : null}

              <Field id="invite-name" label="Name" error={errors.name?.message}>
                <Input
                  id="invite-name"
                  autoComplete="off"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? "invite-name-error" : undefined}
                  {...register("name")}
                />
              </Field>

              <Field id="invite-email" label="Email" error={errors.email?.message}>
                <Input
                  id="invite-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "invite-email-error" : undefined}
                  {...register("email")}
                />
              </Field>

              <Field id="invite-role" label="Role" error={errors.role?.message}>
                <select
                  id="invite-role"
                  className={SELECT_CLASS}
                  aria-invalid={errors.role ? true : undefined}
                  aria-describedby="invite-role-hint"
                  {...register("role")}
                >
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
                <p id="invite-role-hint" className="text-muted-foreground text-xs">
                  Staff handle orders, catalog and partner requests. Owners can also manage staff
                  and countries.
                </p>
              </Field>

              <Field
                id="invite-password"
                label="Temporary password"
                error={errors.password?.message}
              >
                <div className="flex gap-2">
                  <Input
                    id="invite-password"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? "invite-password-error" : undefined}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setValue("password", generateTemporaryPassword(), { shouldValidate: true })
                    }
                  >
                    Generate
                  </Button>
                </div>
              </Field>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add staff member"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
