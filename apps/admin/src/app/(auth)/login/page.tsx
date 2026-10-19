import { GiftIcon } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNextPath } from "@/features/auth/safe-next";

export const metadata: Metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <GiftIcon className="size-6" aria-hidden="true" />
          <span className="text-lg font-semibold">The Giftpop Admin</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Sign in</h1>
            </CardTitle>
            <CardDescription>Use your staff email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm next={safeNextPath(next)} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
