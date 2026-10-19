"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/features/auth/auth-client";
import { loginErrorMessage } from "@/features/auth/login-errors";
import { validateLogin, type LoginFieldErrors } from "@/lib/login";

interface LoginFormProps {
  /** Where to go after signing in. Already checked with `safeNextPath` on the server. */
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = new FormData(event.currentTarget);
    const result = validateLogin({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    setFormError(null);
    if (!result.ok) {
      setErrors(result.errors);
      (result.errors.email ? emailRef : passwordRef).current?.focus();
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await signIn(result.data);
    } catch (error) {
      setFormError(loginErrorMessage(error));
      setSubmitting(false);
      passwordRef.current?.focus();
      return;
    }
    // The cookie is set. Keep the button disabled while the dashboard loads.
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          aria-invalid={errors.email || formError ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email ? (
          <p id="email-error" role="alert" className="text-destructive text-sm">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password || formError ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password ? (
          <p id="password-error" role="alert" className="text-destructive text-sm">
            {errors.password}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
