import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, MapPin, Users, Calendar, PiggyBank } from "lucide-react";

export default async function TripsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  let trips: any[] = [];
  let dbError = null;
  
  // Robust retry mechanism for Serverless connection drops
  for (let i = 0; i < 3; i++) {
    try {
      trips = await prisma.trip.findMany({
        where: {
          OR: [
            { createdById: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        include: {
          members: {
            include: {
              paymentsMade: true,
            },
          },
          payments: { where: { status: "APPROVED" } },
          expenses: true,
        },
        orderBy: { createdAt: "desc" },
      });
      dbError = null;
      break; // Success
    } catch (error: any) {
      console.log(`[Database Retry] Attempt ${i + 1} failed:`, error.message);
      dbError = error;
      await new Promise(resolve => setTimeout(resolve, 800)); // wait before retrying
    }
  }

  if (dbError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-red-500/10 p-4">
          <MapPin className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Database Connection Error</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            We are having trouble connecting to the database right now (Neon Pooler timeout). 
            Please refresh the page to try again.
          </p>
        </div>
        <a 
          href="/trips"
          className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Refresh Page
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Trips</h1>
          <p className="mt-1 text-muted-foreground">
            {trips.length} trip{trips.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          New Trip
        </Link>
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No trips yet</h3>
          <p className="mb-6 text-muted-foreground">
            Start planning your next adventure with friends!
          </p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25"
          >
            <Plus className="h-4 w-4" />
            Create Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const memberCount = trip.members.length;
            const budget = trip.perPersonBudget * memberCount;
            const collected = trip.payments.reduce((s: any, p: any) => s + p.amount, 0);
            const spent = trip.expenses.reduce((s: any, e: any) => s + e.amount, 0);
            const progress = budget > 0 ? Math.min(100, (collected / budget) * 100) : 0;

            const myMember = trip.members.find((m: any) => m.userId === session.user.id);
            let myPaymentStatus = { label: "UNPAID", color: "bg-red-500/10 text-red-500 border-red-500/20" };
            
            if (myMember) {
              const myApproved = myMember.paymentsMade
                .filter((p: any) => p.status === "APPROVED")
                .reduce((sum: number, p: any) => sum + p.amount, 0);
              const hasPending = myMember.paymentsMade.some((p: any) => p.status === "PENDING");
              
              if (myApproved >= trip.perPersonBudget) {
                myPaymentStatus = { label: "FULLY PAID", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
              } else if (hasPending) {
                myPaymentStatus = { label: "PENDING APPROVAL", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
              } else if (myApproved > 0) {
                myPaymentStatus = { label: "PARTIALLY PAID", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
              }
            }

            const isAdmin = trip.createdById === session.user.id;
            let settledCount = 0;
            let pendingCount = 0;
            let partialCount = 0;
            let unpaidCount = 0;

            if (isAdmin) {
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
            }

            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="glass group rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-36 bg-gradient-to-br from-primary/20 to-violet-500/20 overflow-hidden">
                  {trip.coverImage ? (
                    <img
                      src={trip.coverImage}
                      alt={trip.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <MapPin className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        trip.status === "ACTIVE"
                          ? "bg-emerald-500/20 text-emerald-400 backdrop-blur-sm"
                          : "bg-gray-500/20 text-gray-400 backdrop-blur-sm"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent h-16" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base font-semibold truncate">{trip.name}</h3>
                    {myMember && (
                      <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${myPaymentStatus.color}`}>
                        {myPaymentStatus.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {new Date(trip.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    {" — "}
                    {new Date(trip.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-medium">{formatCurrency(collected)} / {formatCurrency(budget)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full gradient-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isAdmin && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {settledCount > 0 && <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-500">{settledCount} Settled</span>}
                        {pendingCount > 0 && <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-500">{pendingCount} Pending</span>}
                        {partialCount > 0 && <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-500">{partialCount} Partial</span>}
                        {unpaidCount > 0 && <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-medium text-red-500">{unpaidCount} Unpaid</span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      <PiggyBank className="h-3 w-3" />
                      {formatCurrency(spent)} spent
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
