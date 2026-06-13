"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";

interface EditTripFormProps {
  trip: any;
}

export default function EditTripForm({ trip }: EditTripFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      destination: formData.get("destination") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      perPersonBudget: formData.get("perPersonBudget") as string,
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update trip");
        return;
      }

      router.push(`/trips/${trip.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateStr: string) => {
    return new Date(dateStr).toISOString().split("T")[0];
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/trips/${trip.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Trip</h1>
          <p className="text-sm text-muted-foreground">{trip.name}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium">
              Trip Name *
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              required
              defaultValue={trip.name}
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="edit-destination" className="mb-1.5 block text-sm font-medium">
              Destination *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="edit-destination"
                name="destination"
                type="text"
                required
                defaultValue={trip.destination}
                className="w-full rounded-lg border border-input bg-background/50 pl-10 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              defaultValue={trip.description || ""}
              className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-startDate" className="mb-1.5 block text-sm font-medium">
                Start Date *
              </label>
              <input
                id="edit-startDate"
                name="startDate"
                type="date"
                required
                defaultValue={formatDateForInput(trip.startDate)}
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="edit-endDate" className="mb-1.5 block text-sm font-medium">
                End Date *
              </label>
              <input
                id="edit-endDate"
                name="endDate"
                type="date"
                required
                defaultValue={formatDateForInput(trip.endDate)}
                className="w-full rounded-lg border border-input bg-background/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-budget" className="mb-1.5 block text-sm font-medium">
              Per Person Budget (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <input
                id="edit-budget"
                name="perPersonBudget"
                type="number"
                min="0"
                step="100"
                required
                defaultValue={trip.perPersonBudget}
                className="w-full rounded-lg border border-input bg-background/50 pl-8 pr-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href={`/trips/${trip.id}`}
              className="flex-1 rounded-lg border border-border py-2.5 text-center text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
