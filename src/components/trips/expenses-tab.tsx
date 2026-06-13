"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, getCategoryLabel, getCategoryColor } from "@/lib/utils";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  FileImage,
  ExternalLink,
} from "lucide-react";

const CATEGORIES = [
  "HOTEL",
  "FOOD",
  "PETROL",
  "TOLL",
  "ACTIVITIES",
  "SHOPPING",
  "MISC",
];

interface ExpensesTabProps {
  trip: any;
  isAdmin: boolean;
}

export default function ExpensesTab({ trip, isAdmin }: ExpensesTabProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {
      title: formData.get("title"),
      category: formData.get("category"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      notes: formData.get("notes"),
    };

    // Optional: who handled/recorded the expense
    const paidById = formData.get("paidById") as string;
    if (paidById) {
      data.paidById = paidById;
    }

    try {
      const res = await fetch(`/api/trips/${trip.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowForm(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Add expense error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Delete this expense?")) return;
    setDeleting(expenseId);

    try {
      await fetch(`/api/trips/${trip.id}/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (error) {
      console.error("Delete expense error:", error);
    } finally {
      setDeleting(null);
    }
  };

  // Group expenses by category for summary
  const categoryTotals = CATEGORIES.map((cat) => {
    const total = trip.expenses
      .filter((e: any) => e.category === cat)
      .reduce((sum: number, e: any) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  const totalExpenses = trip.expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Expenses ({trip.expenses.length})
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            Total: {formatCurrency(totalExpenses)}
          </span>
        </h3>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Expense"}
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        💰 Expenses are deducted from the <span className="font-medium text-foreground">collected pool</span>. They are shared equally among all members.
      </div>

      {/* Category Summary */}
      {categoryTotals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryTotals.map((ct) => (
            <div
              key={ct.category}
              className="glass flex items-center gap-2 rounded-lg px-3 py-2 flex-shrink-0"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getCategoryColor(ct.category) }}
              />
              <span className="text-xs font-medium">{getCategoryLabel(ct.category)}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(ct.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Expense Form */}
      {showForm && isAdmin && (
        <div className="glass rounded-xl p-4">
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                name="title"
                required
                placeholder="Expense title *"
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <select
                name="category"
                required
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select Category *</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
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
                name="date"
                type="date"
                required
                className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {/* Optional: who handled the expense */}
            <select
              name="paidById"
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Recorded by (optional)</option>
              {trip.members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
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
                  Adding…
                </span>
              ) : (
                "Add Expense"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {trip.expenses.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trip.expenses.map((expense: any) => (
            <div
              key={expense.id}
              className="glass rounded-xl p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
                    style={{ backgroundColor: getCategoryColor(expense.category) }}
                  >
                    {getCategoryLabel(expense.category).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{expense.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-muted-foreground">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: getCategoryColor(expense.category) + "20",
                          color: getCategoryColor(expense.category),
                        }}
                      >
                        {getCategoryLabel(expense.category)}
                      </span>
                      <span>{formatDate(expense.date)}</span>
                      <span className="text-primary/70">From Pool</span>
                      {expense.paidBy && (
                        <span>Recorded by {expense.paidBy.name}</span>
                      )}
                    </div>
                    {expense.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{expense.notes}</p>
                    )}
                    {expense.billImage && (
                      <a
                        href={expense.billImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <FileImage className="h-3 w-3" />
                        View Bill
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-base font-bold text-rose-500">
                    {formatCurrency(expense.amount)}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deleting === expense.id}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      {deleting === expense.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
