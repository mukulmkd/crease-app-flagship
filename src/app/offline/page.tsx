"use client";

import Link from "next/link";
import { RefreshCw, WifiOff } from "lucide-react";

import { BrandMark } from "@/components/common/brand-mark";
import { Body, BodySm, Title } from "@/components/common/typography";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <BrandMark href={null} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
        <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-surface-container text-muted-foreground">
          <WifiOff className="size-8" aria-hidden />
        </span>
        <Title>You’re offline</Title>
        <Body className="mt-2 text-muted-foreground">
          Crease needs a connection for live match updates, votes, payments, and
          changes.
        </Body>
        <BodySm className="mt-3 text-muted-foreground">
          Some screens you opened before may still be available, but their
          information can be out of date.
        </BodySm>
        <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCw aria-hidden />
            Try again
          </Button>
          <Button asChild variant="tonal" className="w-full sm:w-auto">
            <Link href="/home">Go to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
