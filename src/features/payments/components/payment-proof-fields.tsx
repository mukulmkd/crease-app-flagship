"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";

type PaymentProofFieldsProps = {
  utrRegistration: UseFormRegisterReturn;
  utrError?: string;
  onFileChange: (file: File | null) => void;
  fileRequired?: boolean;
  children?: ReactNode;
};

/**
 * Shared proof fields for player payments and Admin-recorded payouts.
 * Mutations and validation remain owned by each payment sheet.
 */
function PaymentProofFields({
  utrRegistration,
  utrError,
  onFileChange,
  fileRequired = true,
  children,
}: PaymentProofFieldsProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFileChange(event.target.files?.[0] ?? null);
  }

  return (
    <>
      {children}
      <FormField
        label="UTR"
        error={utrError}
        required
        description="Use the transaction reference from your payment app."
      >
        <Input {...utrRegistration} autoComplete="off" />
      </FormField>
      <FormField
        label="Screenshot"
        required={fileRequired}
        description="Upload a clear payment confirmation image."
      >
        <Input
          type="file"
          accept="image/*"
          required={fileRequired}
          onChange={handleFileChange}
        />
      </FormField>
    </>
  );
}

export { PaymentProofFields };
