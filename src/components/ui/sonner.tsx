"use client";

import type * as React from "react";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !rounded-lg !border-outline-variant !bg-popover !text-popover-foreground !shadow-md",
          title: "!font-semibold",
          description: "!text-muted-foreground",
          success: "[&_[data-icon]]:text-success",
          info: "[&_[data-icon]]:text-info",
          warning: "[&_[data-icon]]:text-warning",
          error: "[&_[data-icon]]:text-destructive",
          closeButton:
            "!border-outline-variant !bg-surface-container !text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
