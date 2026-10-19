import { Suspense } from "react";

import { OrdersListView } from "./orders-list-view";
import { OrdersTableSkeleton } from "./orders-table";

/** The orders list. Its filters live in the URL, so the view reads the query inside a Suspense boundary. */
export function OrdersList() {
  return (
    <Suspense fallback={<OrdersTableSkeleton />}>
      <OrdersListView />
    </Suspense>
  );
}
