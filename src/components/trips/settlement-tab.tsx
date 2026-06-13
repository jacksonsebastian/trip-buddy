"use client";

import { formatCurrency } from "@/lib/utils";
import { calculateSettlements } from "@/lib/settlement";
import {
  ArrowRight,
  Calculator,
  TrendingUp,
  TrendingDown,
  Equal,
  Wallet,
} from "lucide-react";

interface SettlementTabProps {
  trip: any;
  stats: {
    totalBudget: number;
    totalCollected: number;
    totalPending: number;
    totalExpenses: number;
    remainingBalance: number;
  };
}

export default function SettlementTab({ trip, stats }: SettlementTabProps) {
  // Total expenses from the pool
  const totalExpenses = trip.expenses.reduce(
    (sum: number, e: any) => sum + e.amount,
    0
  );

  // Each member's approved payments to the pool
  const memberInputs = trip.members.map((member: any) => {
    const paymentsMade = member.paymentsMade
      ?.filter((p: any) => p.status === "APPROVED")
      .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

    return {
      id: member.id,
      name: member.name,
      paymentsMade,
    };
  });

  const settlement = calculateSettlements(memberInputs, totalExpenses, stats.totalCollected);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        Settlement Summary
      </h3>

      {/* Pool Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-emerald-500">
            {formatCurrency(stats.totalCollected)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Pool Collected</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-rose-500">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Total Expenses</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-violet-500">
            {formatCurrency(settlement.fairSharePerPerson)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per Person Share</p>
        </div>
        <div className="glass rounded-xl p-3 sm:p-4 text-center">
          <p className={`text-lg sm:text-2xl font-bold ${settlement.poolBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {formatCurrency(Math.abs(settlement.poolBalance))}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            Pool {settlement.poolBalance >= 0 ? "Surplus" : "Deficit"}
          </p>
        </div>
      </div>

      {/* Member Balances */}
      <div>
        <h4 className="font-medium text-sm mb-3">Member Balances</h4>
        <div className="space-y-2">
          {settlement.memberBalances.map((mb) => {
            const isOverpaid = mb.netBalance > 0.01;
            const isUnderpaid = mb.netBalance < -0.01;

            return (
              <div key={mb.memberId} className="glass rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isOverpaid
                          ? "bg-emerald-500/10 text-emerald-500"
                          : isUnderpaid
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {isOverpaid ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : isUnderpaid ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <Equal className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{mb.memberName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Paid {formatCurrency(mb.totalPaymentsMade)} to pool • Share{" "}
                        {formatCurrency(mb.fairShare)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        isOverpaid
                          ? "text-emerald-500"
                          : isUnderpaid
                          ? "text-rose-500"
                          : "text-gray-500"
                      }`}
                    >
                      {isOverpaid ? "+" : ""}
                      {formatCurrency(Math.round(mb.netBalance * 100) / 100)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {isOverpaid ? "overpaid" : isUnderpaid ? "owes" : "settled"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement Transactions */}
      <div>
        <h4 className="font-medium text-sm mb-3">Settlement Transfers</h4>
        {settlement.settlements.length === 0 ? (
          <div className="glass rounded-xl p-6 text-center">
            {totalExpenses === 0 ? (
              <>
                <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No expenses yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add expenses to see settlement calculations.
                </p>
              </>
            ) : (
              <>
                <p className="text-emerald-500 font-semibold">🎉 All settled up!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No transfers needed.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {settlement.settlements.map((s, i) => (
              <div
                key={i}
                className="glass rounded-xl p-4 flex items-center gap-3 sm:gap-4"
              >
                {/* From */}
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-medium text-sm truncate">{s.fromName}</p>
                  <p className="text-[10px] text-muted-foreground">pays</p>
                </div>

                {/* Arrow & Amount */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-bold text-primary mt-1">
                    {formatCurrency(s.amount)}
                  </p>
                </div>

                {/* To */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.toName}</p>
                  <p className="text-[10px] text-muted-foreground">receives</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
