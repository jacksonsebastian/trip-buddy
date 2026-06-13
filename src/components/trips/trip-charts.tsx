"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency, getCategoryLabel, getCategoryColor } from "@/lib/utils";

interface TripChartsProps {
  expenses: any[];
  payments: any[];
  totalBudget: number;
  totalCollected: number;
  totalExpenses: number;
  memberPaymentStatusData?: { name: string; count: number; color: string }[];
}

import { useState, useEffect } from "react";

export default function TripCharts({
  expenses,
  payments,
  totalBudget,
  totalCollected,
  totalExpenses,
  memberPaymentStatusData,
}: TripChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a skeleton or nothing during SSR to prevent hydration crashes
    return null;
  }
  // Expenses by category
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const categoryData = Object.entries(categoryMap).map(([category, amount]) => ({
    name: getCategoryLabel(category),
    value: amount,
    color: getCategoryColor(category),
  }));

  // Budget breakdown
  const budgetData = [
    { name: "Collected", value: totalCollected, color: "#10b981" },
    {
      name: "Pending",
      value: Math.max(0, totalBudget - totalCollected),
      color: "#f59e0b",
    },
  ];

  const spendingData = [
    { name: "Spent", value: totalExpenses, color: "#ef4444" },
    {
      name: "Remaining",
      value: Math.max(0, totalCollected - totalExpenses),
      color: "#10b981",
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Check if it's the member status chart (which uses 'count')
      const isMemberChart = payload[0].payload.count !== undefined;
      return (
        <div className="glass-strong rounded-lg px-3 py-2 text-sm shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary font-bold">
            {isMemberChart 
              ? `${payload[0].value} Member${payload[0].value !== 1 ? 's' : ''}` 
              : formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0 && payments.length === 0 && (!memberPaymentStatusData || memberPaymentStatusData.length === 0)) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Budget Collection */}
      <div className="glass rounded-2xl p-4">
        <h4 className="mb-3 text-sm font-semibold">Budget Collection</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`budget-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Member Payment Status Bar Chart (Admin Only) */}
      {memberPaymentStatusData && memberPaymentStatusData.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h4 className="mb-3 text-sm font-semibold">Payment Status</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberPaymentStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {memberPaymentStatusData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Spending */}
      <div className="glass rounded-2xl p-4">
        <h4 className="mb-3 text-sm font-semibold">Spending</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`spend-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expense Categories */}
      {categoryData.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h4 className="mb-3 text-sm font-semibold">By Category</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
