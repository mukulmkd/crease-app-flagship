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
  const generatedId = React.useId().replace(/:/g, "");
  const child = React.isValidElement(children)
    ? (children as React.ReactElement<{
        id?: string;
        "aria-invalid"?: boolean;
        "aria-describedby"?: string;
        "aria-required"?: boolean;
      }>)
    : null;
  const fieldId = htmlFor ?? child?.props.id ?? `form-field-${generatedId}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [child?.props["aria-describedby"], descriptionId, errorId]
    .filter(Boolean)
    .join(" ");
  const isCompositeElement =
    child &&
    typeof child.type === "string" &&
    !["button", "input", "select", "textarea"].includes(child.type);

  return (
    <div data-slot="form-field" className={cn("grid gap-2", className)}>
      <Label htmlFor={fieldId} className="gap-1">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </Label>
      {child && !isCompositeElement
        ? React.cloneElement(child, {
            id: fieldId,
            "aria-invalid": Boolean(error) || undefined,
            "aria-describedby": describedBy || undefined,
            "aria-required": required || child.props["aria-required"],
          })
        : children}
      {description ? (
        <p id={descriptionId} className="text-caption text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
