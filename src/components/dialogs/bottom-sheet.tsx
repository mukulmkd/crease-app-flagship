"use client";

import type * as React from "react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
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
      className={cn("safe-bottom mt-24 max-h-[85vh] rounded-t-2xl", className)}
      {...props}
    />
  );
}

const BottomSheetTrigger = DrawerTrigger;
const BottomSheetClose = DrawerClose;
const BottomSheetHeader = DrawerHeader;
const BottomSheetFooter = DrawerFooter;
const BottomSheetTitle = DrawerTitle;
const BottomSheetDescription = DrawerDescription;

export {
  BottomSheet,
  BottomSheetTrigger,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
};
