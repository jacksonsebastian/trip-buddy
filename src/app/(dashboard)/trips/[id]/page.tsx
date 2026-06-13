import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Wallet,
  Receipt,
  ImageIcon,
  Clock,
  Calculator,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PiggyBank,
} from "lucide-react";
import TripTabs from "@/components/trips/trip-tabs";
import TripCharts from "@/components/trips/trip-charts";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  // We no longer redirect if !session so that the link is shareable for read-only view

  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          paymentsMade: true,
          expensesPaid: true,
        },
      },
      payments: {
        include: { member: true },
        orderBy: { createdAt: "desc" },
      },
      expenses: {
        include: { paidBy: true },
        orderBy: { createdAt: "desc" },
      },
      gallery: {
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!trip) notFound();

  // Check if current user is admin
  const currentMember = session?.user ? trip.members.find((m) => m.userId === session.user.id) : null;
  const isAdmin = currentMember?.role === "ADMIN";

  // Calculate stats
  const memberCount = trip.members.length;
  const totalBudget = trip.perPersonBudget * memberCount;
  const totalCollected = trip.payments
    .filter((p) => p.status === "APPROVED")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = totalBudget - totalCollected;
  const totalExpenses = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBalance = totalCollected - totalExpenses;

  const stats = {
    totalBudget,
    totalCollected,
    totalPending: Math.max(0, totalPending),
    totalExpenses,
    remainingBalance,
  };

  let memberPaymentStatusData: any = undefined;

  if (isAdmin) {
    let settledCount = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    trip.members.forEach((m: any) => {
      const mApproved = m.paymentsMade
        .filter((p: any) => p.status === "APPROVED")
        .reduce((s: number, p: any) => s + p.amount, 0);
      const mHasPending = m.paymentsMade.some((p: any) => p.status === "PENDING");
      
      if (mApproved >= trip.perPersonBudget) settledCount++;
      else if (mHasPending) pendingCount++;
      else if (mApproved > 0) partialCount++;
      else unpaidCount++;
    });

    memberPaymentStatusData = [
      { name: "Settled", count: settledCount, color: "#10b981" },
      { name: "Partial", count: partialCount, color: "#3b82f6" },
      { name: "Pending", count: pendingCount, color: "#f59e0b" },
      { name: "Unpaid", count: unpaidCount, color: "#ef4444" },
    ].filter(d => d.count > 0);
  }

  const kpiCards = [
    {
      label: "Total Budget",
      value: formatCurrency(totalBudget),
      icon: Wallet,
      color: "from-violet-500 to-purple-600",
      textColor: "text-violet-500",
    },
    {
      label: "Collected",
      value: formatCurrency(totalCollected),
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-500",
    },
    {
      label: "Pending",
      value: formatCurrency(Math.max(0, totalPending)),
      icon: AlertCircle,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-500",
    },
    {
      label: "Spent",
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: "from-rose-500 to-red-600",
      textColor: "text-rose-500",
    },
    {
      label: "Remaining",
      value: formatCurrency(Math.max(0, remainingBalance)),
      icon: PiggyBank,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-500",
    },
    {
      label: "Members",
      value: memberCount.toString(),
      icon: Users,
      color: "from-pink-500 to-rose-600",
      textColor: "text-pink-500",
    },
  ];

  // Serialize for client components
  const tripData = JSON.parse(JSON.stringify(trip));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        {session?.user && (
          <Link
            href="/trips"
            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold sm:text-2xl truncate">{trip.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                trip.status === "ACTIVE"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {trip.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="glass rounded-xl p-3 sm:p-4 transition-all hover:-translate-y-0.5"
          >
            <div
              className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${card.color}`}
            >
              <card.icon className="h-4 w-4 text-white" />
            </div>
            <p className={`text-base font-bold sm:text-lg ${card.textColor}`}>
              {card.value}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <TripCharts
        expenses={tripData.expenses}
        payments={tripData.payments}
        totalBudget={totalBudget}
        totalCollected={totalCollected}
        totalExpenses={totalExpenses}
        memberPaymentStatusData={memberPaymentStatusData}
      />

      {/* Tabs Section */}
      <TripTabs
        trip={tripData}
        isAdmin={isAdmin}
        currentMemberId={currentMember?.id || ""}
        stats={stats}
      />
    </div>
  );
}
