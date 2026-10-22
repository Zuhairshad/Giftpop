import type { Packaging } from "@giftpop/contracts";
import Link from "next/link";

import { Thumb } from "./thumb";
import { PackagingVisibilityButton } from "./visibility-buttons";

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

export function PackagingTable({ packagings }: { packagings: readonly Packaging[] }) {
  return (
    <div className="rounded-lg border">
      <Table label="Packaging">
        <TableHeader>
          <TableRow>
            <TableHead>Packaging</TableHead>
            <TableHead>Layout</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packagings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                No packaging yet. Add the first one.
              </TableCell>
            </TableRow>
          ) : null}
          {packagings.map((packaging) => (
            <TableRow key={packaging.id}>
              <TableCell>
                <div className="flex items-center gap-3 font-medium">
                  <Thumb
                    image={packaging.layers.back ?? packaging.layers.front}
                    color={packaging.wrapperColors[0]?.hex}
                    label={packaging.name}
                  />
                  {packaging.name}
                </div>
              </TableCell>
              <TableCell>{packaging.layoutType}</TableCell>
              <TableCell>
                {packaging.minItems}&ndash;{packaging.maxItems}
              </TableCell>
              <TableCell>{packaging.capacityUnits}</TableCell>
              <TableCell>
                <Badge variant={packaging.active ? "default" : "secondary"}>
                  {packaging.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/catalog/packaging/${packaging.id}`}
                    aria-label={`Edit ${packaging.name}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Edit
                  </Link>
                  <PackagingVisibilityButton packaging={packaging} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
