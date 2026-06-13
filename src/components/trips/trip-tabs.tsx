"use client";

import { useState } from "react";
import {
  Users,
  Wallet,
  Receipt,
  ImageIcon,
  Clock,
  Calculator,
  Settings,
  type LucideIcon,
} from "lucide-react";
import MembersTab from "./members-tab";
import PaymentsTab from "./payments-tab";
import ExpensesTab from "./expenses-tab";
import GalleryTab from "./gallery-tab";
import TimelineTab from "./timeline-tab";
import SettlementTab from "./settlement-tab";
import TripActions from "./trip-actions";

interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

const baseTabs: TabDef[] = [
  { id: "members", label: "Members", icon: Users },
  { id: "payments", label: "Payments", icon: Wallet },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "settlement", label: "Settlement", icon: Calculator },
];

interface TripTabsProps {
  trip: any;
  isAdmin: boolean;
  currentMemberId: string;
  stats: {
    totalBudget: number;
    totalCollected: number;
    totalPending: number;
    totalExpenses: number;
    remainingBalance: number;
  };
}

export default function TripTabs({ trip, isAdmin, currentMemberId, stats }: TripTabsProps) {
  const [activeTab, setActiveTab] = useState("members");

  const tabs: TabDef[] = isAdmin
    ? [...baseTabs, { id: "settings", label: "Settings", icon: Settings }]
    : baseTabs;

  return (
    <div>
      {/* Tab Navigation — Wrapped on mobile */}
      <div className="mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-wrap gap-2 pb-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${activeTab === tab.id
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "members" && (
          <MembersTab trip={trip} isAdmin={isAdmin} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab trip={trip} isAdmin={isAdmin} currentMemberId={currentMemberId} />
        )}
        {activeTab === "expenses" && (
          <ExpensesTab trip={trip} isAdmin={isAdmin} />
        )}
        {activeTab === "gallery" && (
          <GalleryTab trip={trip} currentMemberId={currentMemberId} />
        )}
        {activeTab === "timeline" && (
          <TimelineTab trip={trip} />
        )}
        {activeTab === "settlement" && (
          <SettlementTab trip={trip} stats={stats} />
        )}
        {activeTab === "settings" && isAdmin && (
          <TripActions trip={trip} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
