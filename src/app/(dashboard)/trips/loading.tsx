export default function TripsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-24 rounded-lg bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden">
            <div className="h-36 bg-muted" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
              <div className="h-1.5 rounded-full bg-muted mt-3" />
              <div className="flex justify-between pt-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
