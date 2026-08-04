"use client";

import type * as React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/utils";

type BottomSheetProps = React.ComponentProps<typeof Drawer>;

/**
 * Bottom sheet = Drawer locked to the bottom edge (mobile primary overlay pattern).
 */
function BottomSheet({
  shouldScaleBackground = true,
  ...props
}: BottomSheetProps) {
  return (
    <Drawer
      data-slot="bottom-sheet"
      direction="bottom"
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}

function BottomSheetContent({
  className,
  ...props
}: React.ComponentProps<typeof DrawerContent>) {
  return (
    <DrawerContent
      data-slot="bottom-sheet-content"
      className={cn(
        "safe-bottom mt-24 max-h-[var(--sheet-max-height)] rounded-t-2xl border-outline-variant bg-surface-container-lowest",
        className,
      )}
      {...props}
    />
  );
}

const BottomSheetClose = DrawerClose;

function BottomSheetHeader({
  className,
  ...props
}: React.ComponentProps<typeof DrawerHeader>) {
  return (
    <DrawerHeader
      className={cn("gap-1 px-4 pt-5 pb-4 text-left", className)}
      {...props}
    />
  );
}

function BottomSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerTitle>) {
  return (
    <DrawerTitle
      className={cn(
        "font-heading text-2xl font-semibold tracking-[-0.01em]",
        className,
      )}
      {...props}
    />
  );
}

const BottomSheetDescription = DrawerDescription;

export {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
};
