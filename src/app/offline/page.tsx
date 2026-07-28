import { APP_NAME } from "@/constants/app";

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground">
          You&apos;re offline. Check your connection and try again.
        </p>
      </div>
    </main>
  );
}
