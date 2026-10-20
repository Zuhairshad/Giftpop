import type { Item } from "@giftpop/contracts";
import Link from "next/link";

import { pickerStyleBadge, shapeLabel } from "../lib/item-labels";
import { itemsQueryString, pageCount } from "../lib/items-query";
import type { ItemsUrlState } from "../lib/items-query";

import { Thumb } from "./thumb";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ItemsTableProps {
  items: readonly Item[];
  page: number;
  pageSize: number;
  total: number;
  /** The filters in the URL, kept when paging. */
  filters: ItemsUrlState;
}

export function ItemsTable({ items, page, pageSize, total, filters }: ItemsTableProps) {
  const pages = pageCount(total, pageSize);
  const filtered = Boolean(filters.search || filters.category || filters.active !== undefined);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="rounded-lg border">
        <Table label="Catalog items">
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Shape</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  {filtered ? "No items match these filters." : "No items yet. Add the first one."}
                </TableCell>
              </TableRow>
            ) : null}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3 font-medium">
                    <Thumb image={item.image} color={item.color} label={item.name} />
                    <span className="wrap-anywhere">{item.name}</span>
                    <OfferBadge item={item} />
                  </div>
                </TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{shapeLabel(item.shape)}</TableCell>
                <TableCell>{item.sizeUnits}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/catalog/items/${item.id}`}
                    aria-label={`Edit ${item.name}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {total} {total === 1 ? "item" : "items"}. Page {page} of {pages}.
        </p>
        <div className="flex flex-wrap gap-2">
          <PageLink
            disabled={page <= 1}
            href={`/catalog${itemsQueryString({ ...filters, page: page - 1 })}`}
          >
            Previous page
          </PageLink>
          <PageLink
            disabled={page >= pages}
            href={`/catalog${itemsQueryString({ ...filters, page: page + 1 })}`}
          >
            Next page
          </PageLink>
        </div>
      </nav>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: string;
}) {
  const className = buttonVariants({ variant: "outline", size: "sm" });
  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} pointer-events-none opacity-50`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Marks items offered in the written list; picture-grid items, the default, get no badge. */
function OfferBadge({ item }: { item: Item }) {
  const label = pickerStyleBadge(item.pickerStyle);
  if (!label) return null;
  return (
    <Badge variant="outline" className="font-normal">
      {label}
    </Badge>
  );
}
