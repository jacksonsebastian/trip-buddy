import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div
          className="absolute -right-40 bottom-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <MapPin className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-2 text-6xl font-bold gradient-text">404</h1>
        <h2 className="mb-2 text-xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">
          Looks like this destination doesn&apos;t exist on our map.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
