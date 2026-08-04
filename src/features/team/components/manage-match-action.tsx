"use client";

import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type ManageMatchActionProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  destructive?: boolean;
  primary?: boolean;
  loading?: boolean;
  onClick: () => void;
};

function ManageMatchAction({
  icon: Icon,
  label,
  description,
  destructive,
  primary,
  loading,
  onClick,
}: ManageMatchActionProps) {
  return (
    <Button
      type="button"
      variant={destructive ? "outline" : primary ? "default" : "tonal"}
      className={
        destructive
          ? "min-h-12 w-full justify-start gap-3 text-destructive"
          : "min-h-12 w-full justify-start gap-3"
      }
      loading={loading}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden />
      <span className="text-left">
        <span className="block">{label}</span>
        {description ? (
          <span className="block text-xs font-normal opacity-70">
            {description}
          </span>
        ) : null}
      </span>
    </Button>
  );
}

export { ManageMatchAction };
