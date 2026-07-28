import { Body, BodySm, Title } from "@/components/common/typography";

type ShellPlaceholderProps = {
  title: string;
  description?: string;
};

/**
 * Empty content slot inside the app shell — not a product feature.
 */
function ShellPlaceholder({
  title,
  description = "Shell only. Feature content will land here.",
}: ShellPlaceholderProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-6">
      <Title>{title}</Title>
      <Body className="text-muted-foreground">{description}</Body>
      <BodySm>Resize to verify mobile · tablet · desktop chrome.</BodySm>
    </div>
  );
}

export { ShellPlaceholder };
export type { ShellPlaceholderProps };
