"use client";

import { use } from "react";

import { WeekendPaymentSummaryView } from "@/features/payments/components/weekend-payment-summary";

export default function WeekendPaymentSummaryPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = use(params);
  return <WeekendPaymentSummaryView settlementId={settlementId} />;
}
