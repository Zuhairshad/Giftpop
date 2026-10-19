import type { DashboardSummary } from "@giftpop/contracts";
import Link from "next/link";
import { Suspense } from "react";

import { loadDashboard } from "./load";
import { RetryButton } from "./retry-button";
import { buildTiles, ordersLabel, revenueLines, tileAccessibleName } from "./tiles";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { flagEmoji } from "@/lib/format";
import { cn } from "@/lib/utils";

function NeedsAction({ summary }: { summary: DashboardSummary }) {
  return (
    <section aria-labelledby="dash-needs">
      <h2 id="dash-needs" className="mb-3 text-base font-semibold">
        Needs action
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {buildTiles(summary.needsAction).map((tile) => (
          <li key={tile.key}>
            <Link
              href={tile.href}
              aria-label={tileAccessibleName(tile)}
              className="bg-card hover:bg-accent focus-visible:ring-ring block rounded-xl border p-4 transition-colors outline-none focus-visible:ring-2"
            >
              <span
                className={cn(
                  "block text-4xl font-bold tabular-nums",
                  tile.count === 0 && "text-muted-foreground",
                )}
              >
                {tile.count}
              </span>
              <span className="mt-1 block text-sm font-medium">{tile.label}</span>
              {tile.count === 0 ? (
                <span className="text-muted-foreground block text-xs">{tile.zeroText}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Today({ summary }: { summary: DashboardSummary }) {
  const lines = revenueLines(summary.today.revenue);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>
          <span className="text-3xl font-bold tabular-nums">{summary.today.orders}</span>{" "}
          <span className="text-muted-foreground text-sm">
            {summary.today.orders === 1 ? "order placed" : "orders placed"}
          </span>
        </p>
        <div>
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">Payments received</h3>
          {lines.length === 0 ? (
            <p className="text-sm">No payments received today</p>
          ) : (
            <ul className="space-y-1">
              {lines.map((line) => (
                <li key={line.currency} className="text-lg font-semibold tabular-nums">
                  {line.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ByCountry({ summary }: { summary: DashboardSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by country (last 30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {summary.ordersByCountry.length === 0 ? (
          <p className="text-sm">No orders in the last 30 days</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th scope="col">Country</th>
                <th scope="col">Orders</th>
              </tr>
            </thead>
            <tbody>
              {summary.ordersByCountry.map((row) => (
                <tr key={row.country} className="border-b last:border-0">
                  <td className="py-1.5">
                    <span aria-hidden="true">{flagEmoji(row.country)}</span> {row.country}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{ordersLabel(row.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorTile() {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">The dashboard could not load.</p>
        <p className="text-muted-foreground text-sm">Check your connection, then try again.</p>
      </div>
      <RetryButton />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const summary = await loadDashboard();
  if (!summary) return <ErrorTile />;
  return (
    <div className="space-y-6">
      <NeedsAction summary={summary} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Today summary={summary} />
        <ByCountry summary={summary} />
      </div>
    </div>
  );
}

export function DashboardScreen() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
