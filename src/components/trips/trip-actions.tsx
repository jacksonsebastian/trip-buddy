"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Lock, Unlock, Loader2, Edit3 } from "lucide-react";

interface TripActionsProps {
  trip: any;
  isAdmin: boolean;
}

export default function TripActions({ trip, isAdmin }: TripActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  if (!isAdmin) return null;

  const handleAction = async (action: string) => {
    setLoading(action);

    try {
      if (action === "close") {
        await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CLOSED" }),
        });
        router.refresh();
      } else if (action === "reopen") {
        await fetch(`/api/trips/${trip.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        router.refresh();
      } else if (action === "delete") {
        await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
        router.push("/trips");
        router.refresh();
      }
    } catch (error) {
      console.error("Trip action error:", error);
    } finally {
      setLoading(null);
      setShowConfirm(null);
    }
  };

  return (
    <div className="glass rounded-xl p-4">
      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Trip Settings
      </h4>

      <div className="space-y-2">
        {/* Edit Trip */}
        <button
          onClick={() => router.push(`/trips/${trip.id}/edit`)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
        >
          <Edit3 className="h-4 w-4 text-blue-500" />
          Edit Trip Details
        </button>

        {/* Close/Reopen Trip */}
        {trip.status === "ACTIVE" ? (
          <button
            onClick={() =>
              showConfirm === "close"
                ? handleAction("close")
                : setShowConfirm("close")
            }
            disabled={loading === "close"}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-amber-500 hover:bg-amber-500/10 transition-colors"
          >
            {loading === "close" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {showConfirm === "close" ? "Confirm Close Trip" : "Close Trip"}
          </button>
        ) : (
          <button
            onClick={() => handleAction("reopen")}
            disabled={loading === "reopen"}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-emerald-500 hover:bg-emerald-500/10 transition-colors"
          >
            {loading === "reopen" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            Reopen Trip
          </button>
        )}

        {/* Delete Trip */}
        <button
          onClick={() =>
            showConfirm === "delete"
              ? handleAction("delete")
              : setShowConfirm("delete")
          }
          disabled={loading === "delete"}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          {loading === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {showConfirm === "delete"
            ? "⚠️ Click again to permanently delete"
            : "Delete Trip"}
        </button>
      </div>
    </div>
  );
}
