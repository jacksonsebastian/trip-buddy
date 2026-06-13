export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "text-emerald-500 bg-emerald-500/10";
    case "REJECTED":
      return "text-red-500 bg-red-500/10";
    case "PENDING":
    default:
      return "text-amber-500 bg-amber-500/10";
  }
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    HOTEL: "#8b5cf6",
    FOOD: "#f59e0b",
    PETROL: "#3b82f6",
    TOLL: "#6366f1",
    ACTIVITIES: "#10b981",
    SHOPPING: "#ec4899",
    MISC: "#6b7280",
  };
  return colors[category] || "#6b7280";
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    HOTEL: "Hotel",
    FOOD: "Food",
    PETROL: "Petrol",
    TOLL: "Toll",
    ACTIVITIES: "Activities",
    SHOPPING: "Shopping",
    MISC: "Miscellaneous",
  };
  return labels[category] || category;
}
