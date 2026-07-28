"use client";

import type * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/utils";

/**
 * App dialog — centered modal for confirmations and short forms.
 * Prefer BottomSheet on mobile for longer content.
 */
function AppDialog(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog data-slot="app-dialog" {...props} />;
}

function AppDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn("gap-4 rounded-xl sm:max-w-md", className)}
      {...props}
    />
  );
}

const AppDialogTrigger = DialogTrigger;
const AppDialogClose = DialogClose;
const AppDialogHeader = DialogHeader;
const AppDialogFooter = DialogFooter;
const AppDialogTitle = DialogTitle;
const AppDialogDescription = DialogDescription;

export {
  AppDialog,
  AppDialogTrigger,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  AppDialogFooter,
  AppDialogTitle,
  AppDialogDescription,
};
