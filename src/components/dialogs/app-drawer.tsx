"use client";

import type * as React from "react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/utils";

type AppDrawerProps = React.ComponentProps<typeof Sheet>;

/**
 * Side drawer for desktop navigation / filters.
 * Use BottomSheet for mobile primary actions.
 */
function AppDrawer(props: AppDrawerProps) {
  return <Sheet data-slot="app-drawer" {...props} />;
}

function AppDrawerContent({
  className,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side={side}
      className={cn("w-full sm:max-w-sm", className)}
      {...props}
    />
  );
}

const AppDrawerTrigger = SheetTrigger;
const AppDrawerClose = SheetClose;
const AppDrawerHeader = SheetHeader;
const AppDrawerFooter = SheetFooter;
const AppDrawerTitle = SheetTitle;
const AppDrawerDescription = SheetDescription;

export {
  AppDrawer,
  AppDrawerTrigger,
  AppDrawerClose,
  AppDrawerContent,
  AppDrawerHeader,
  AppDrawerFooter,
  AppDrawerTitle,
  AppDrawerDescription,
};
