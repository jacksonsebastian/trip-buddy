"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getInitials } from "@/lib/utils";
import {
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Loader2,
  X,
  Shield,
  Wallet,
} from "lucide-react";

interface MembersTabProps {
  trip: any;
  isAdmin: boolean;
}

export default function MembersTab({ trip, isAdmin }: MembersTabProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // State for the quick inline payment form
  const [activePaymentMemberId, setActivePaymentMemberId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      mobileNumber: formData.get("mobileNumber") as string,
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowForm(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Add member error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setDeleting(memberId);

    try {
      await fetch(`/api/trips/${trip.id}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Remove member error:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleLogPayment = async (e: React.FormEvent<HTMLFormElement>, memberId: string) => {
    e.preventDefault();
    setPaymentLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      amount: formData.get("amount") as string,
      paymentDate: formData.get("paymentDate") as string,
      memberId,
      status: "APPROVED", // Auto-approve since admin is logging it
      notes: "Logged directly from members tab",
    };

    try {
      const res = await fetch(`/api/trips/${trip.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setActivePaymentMemberId(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Log payment error:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentStatus = (member: any) => {
    const approvedPayments = member.paymentsMade?.filter(
      (p: any) => p.status === "APPROVED"
    ) || [];
    const totalPaid = approvedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const expected = trip.perPersonBudget;

    if (totalPaid >= expected) return "FULL_PAID";
    if (totalPaid > 0) return "PARTIAL_PAID";
    return "PENDING";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FULL_PAID":
        return { label: "Full Paid", class: "bg-emerald-500/10 text-emerald-500" };
      case "PARTIAL_PAID":
        return { label: "Partial", class: "bg-amber-500/10 text-amber-500" };
      default:
        return { label: "Pending", class: "bg-rose-500/10 text-rose-500" };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Members ({trip.members.length})
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Member"}
          </button>
        )}
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="glass rounded-xl p-4">
          <form onSubmit={handleAddMember} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                name="name"
                required
                placeholder="Name *"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                name="mobileNumber"
                placeholder="Mobile"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Adding…
                </span>
              ) : (
                "Add Member"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {trip.members.map((member: any) => {
          const paymentStatus = getPaymentStatus(member);
          const statusBadge = getStatusBadge(paymentStatus);
          const approvedPayments = member.paymentsMade?.filter(
            (p: any) => p.status === "APPROVED"
          ) || [];
          const totalPaid = approvedPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
          
          const isPaymentFormOpen = activePaymentMemberId === member.id;

          return (
            <div
              key={member.id}
              className="glass rounded-xl p-4 transition-all hover:shadow-md flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                      {member.profilePhoto ? (
                        <img
                          src={member.profilePhoto}
                          alt={member.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        {member.role === "ADMIN" && (
                          <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                  {isAdmin && member.role !== "ADMIN" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={deleting === member.id}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                    >
                      {deleting === member.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                  {member.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </p>
                  )}
                  {member.mobileNumber && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {member.mobileNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Progress */}
              <div className="border-t border-border/50 pt-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-medium">
                    {formatCurrency(totalPaid)} / {formatCurrency(trip.perPersonBudget)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted mb-3">
                  <div
                    className="h-full rounded-full gradient-primary transition-all"
                    style={{
                      width: `${Math.min(100, (totalPaid / trip.perPersonBudget) * 100)}%`,
                    }}
                  />
                </div>

                {/* Quick Payment Action */}
                {isAdmin && (
                  <div>
                    {!isPaymentFormOpen ? (
                      <button
                        onClick={() => setActivePaymentMemberId(member.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background/50 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        Log Payment
                      </button>
                    ) : (
                      <form onSubmit={(e) => handleLogPayment(e, member.id)} className="space-y-2 rounded-lg bg-background/50 p-2 border border-border">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Quick Log Payment</p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <input
                              name="amount"
                              type="number"
                              min="1"
                              required
                              placeholder="Amount"
                              className="w-full rounded border border-input bg-background pl-6 pr-2 py-1.5 text-xs outline-none focus:border-primary"
                            />
                          </div>
                          <input
                            name="paymentDate"
                            type="date"
                            defaultValue={new Date().toISOString().split("T")[0]}
                            required
                            className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActivePaymentMemberId(null)}
                            className="flex-1 rounded border border-border py-1 text-xs hover:bg-accent"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={paymentLoading}
                            className="flex-1 rounded gradient-primary py-1 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {paymentLoading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
