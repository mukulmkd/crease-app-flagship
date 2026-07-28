export default function Loading() {
  return (
    <div
      className="flex flex-1 items-center justify-center p-8"
      role="status"
      aria-label="Loading"
    >
      <div className="size-8 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
