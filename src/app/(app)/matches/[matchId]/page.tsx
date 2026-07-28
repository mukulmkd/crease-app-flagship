"use client";

import { use } from "react";

import { MatchDetailView } from "@/features/team/components";

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = use(params);
  return <MatchDetailView matchId={matchId} />;
}
