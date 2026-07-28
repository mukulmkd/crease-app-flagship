import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/utils";

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Presentational field wrapper — pairs label, hint, and error with any control.
 */
function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  const describedBy = error
    ? `${htmlFor}-error`
    : description
      ? `${htmlFor}-description`
      : undefined;

  return (
    <div data-slot="form-field" className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor} className="gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              id?: string;
              "aria-invalid"?: boolean;
              "aria-describedby"?: string;
            }>,
            {
              id: htmlFor,
              "aria-invalid": Boolean(error) || undefined,
              "aria-describedby": describedBy,
            },
          )
        : children}
      {description && !error ? (
        <p
          id={htmlFor ? `${htmlFor}-description` : undefined}
          className="text-caption text-muted-foreground"
        >
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-caption text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
