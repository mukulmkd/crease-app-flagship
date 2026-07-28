import type * as React from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils";

type DataTableProps = React.ComponentProps<"div">;

/**
 * Stitch data table — sticky header, zebra rows, 56px min row height.
 */
function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div
      data-slot="data-table"
      className={cn(
        "w-full overflow-x-auto rounded-xl bg-surface-container-low",
        className,
      )}
      {...props}
    >
      <Table className="[&_tbody_tr:nth-child(even)]:bg-background/60 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-surface-container [&_tr]:h-14">
        {children}
      </Table>
    </div>
  );
}

export {
  DataTable,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
