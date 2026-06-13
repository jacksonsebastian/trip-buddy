"use client";

import { formatCurrency, formatDate, getCategoryLabel, getCategoryColor } from "@/lib/utils";
import {
  Wallet,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface TimelineTabProps {
  trip: any;
}

interface TimelineEvent {
  id: string;
  type: "payment" | "expense";
  title: string;
  description: string;
  amount: number;
  date: string;
  status?: string;
  category?: string;
  memberName: string;
}

export default function TimelineTab({ trip }: TimelineTabProps) {
  // Merge payments and expenses into a unified timeline
  const events: TimelineEvent[] = [
    ...trip.payments.map((p: any) => ({
      id: p.id,
      type: "payment" as const,
      title: `Payment by ${p.member.name}`,
      description: p.notes || `UPI: ${p.upiRef || "N/A"}`,
      amount: p.amount,
      date: p.paymentDate || p.createdAt,
      status: p.status,
      memberName: p.member.name,
    })),
    ...trip.expenses.map((e: any) => ({
      id: e.id,
      type: "expense" as const,
      title: e.title,
      description: `${getCategoryLabel(e.category)} • Paid by ${e.paidBy.name}`,
      amount: e.amount,
      date: e.date || e.createdAt,
      category: e.category,
      memberName: e.paidBy.name,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case "PENDING":
        return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">
        Timeline ({events.length} events)
      </h3>

      {events.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50 sm:left-6" />

          <div className="space-y-4">
            {events.map((event) => (
              <div key={`${event.type}-${event.id}`} className="relative flex gap-4 sm:gap-5">
                {/* Icon */}
                <div
                  className={`relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                    event.type === "payment"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-rose-500/10 text-rose-500"
                  }`}
                >
                  {event.type === "payment" ? (
                    <ArrowDownRight className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>

                {/* Content */}
                <div className="glass flex-1 rounded-xl p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{event.title}</p>
                        {event.status && (
                          <span className="inline-flex items-center gap-1">
                            {getStatusIcon(event.status)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.description}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {formatDate(event.date)}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold flex-shrink-0 ${
                        event.type === "payment"
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {event.type === "payment" ? "+" : "-"}
                      {formatCurrency(event.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
