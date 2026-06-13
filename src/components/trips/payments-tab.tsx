"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Check,
  X,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  FileImage,
} from "lucide-react";

interface PaymentsTabProps {
  trip: any;
  isAdmin: boolean;
  currentMemberId: string;
}

export default function PaymentsTab({ trip, isAdmin, currentMemberId }: PaymentsTabProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const proofFile = formData.get("proof") as File;
    let proofImageUrl = null;

    if (proofFile && proofFile.size > 0) {
      try {
        const sigRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "payments" }),
        });
        const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

        const uploadData = new FormData();
        uploadData.append("file", proofFile);
        uploadData.append("signature", signature);
        uploadData.append("timestamp", timestamp);
        uploadData.append("api_key", apiKey);
        uploadData.append("folder", "payments");

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: uploadData }
        );
        const cloudData = await cloudRes.json();
        proofImageUrl = cloudData.secure_url;
      } catch (error) {
        console.error("Proof image upload error:", error);
      }
    }

    const data = {
      amount: formData.get("amount"),
      paymentDate: formData.get("paymentDate"),
      upiRef: formData.get("upiRef"),
      notes: formData.get("notes"),
      memberId: formData.get("memberId") || currentMemberId,
      proofImage: proofImageUrl,
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowForm(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Submit payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId: string, status: string) => {
    setActionLoading(paymentId);
    try {
      await fetch(`/api/trips/${trip.id}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status }),
      });
      router.refresh();
    } catch (error) {
      console.error("Payment action error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-500";
      case "REJECTED":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-amber-500/10 text-amber-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Payments ({trip.payments.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Payment"}
        </button>
      </div>

      {/* Payment Form */}
      {showForm && (
        <div className="glass rounded-xl p-4">
          <form onSubmit={handleSubmitPayment} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(isAdmin || !currentMemberId) && (
                <select
                  name="memberId"
                  required
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select your name...</option>
                  {trip.members.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <input
                  name="amount"
                  type="number"
                  min="1"
                  required
                  placeholder="Amount"
                  className="w-full rounded-lg border border-input bg-background/50 pl-8 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <input
                name="paymentDate"
                type="date"
                required
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="upiRef"
                placeholder="UPI Reference (optional)"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="proof"
                type="file"
                accept="image/*"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </span>
              ) : (
                "Submit Payment"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Payments List */}
      {trip.payments.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trip.payments.map((payment: any) => (
            <div
              key={payment.id}
              className="glass rounded-xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm">{payment.member.name}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClass(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-500">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatDate(payment.paymentDate)}</span>
                    {payment.upiRef && (
                      <span className="flex items-center gap-1">
                        UPI: {payment.upiRef}
                      </span>
                    )}
                  </div>
                  {payment.notes && (
                    <p className="mt-1 text-xs text-muted-foreground">{payment.notes}</p>
                  )}
                  {payment.proofImage && (
                    <a
                      href={payment.proofImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <FileImage className="h-3 w-3" />
                      View Proof
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Admin Actions */}
                {isAdmin && payment.status === "PENDING" && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handlePaymentAction(payment.id, "APPROVED")}
                      disabled={actionLoading === payment.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-60"
                      title="Approve"
                    >
                      {actionLoading === payment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handlePaymentAction(payment.id, "REJECTED")}
                      disabled={actionLoading === payment.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                      title="Reject"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
