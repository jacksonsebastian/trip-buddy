import Link from "next/link";
import {
  MapPin,
  Wallet,
  Camera,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Budget Tracking",
    description: "Track every rupee — from member payments to trip expenses. No penny goes unaccounted.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Users,
    title: "Group Management",
    description: "Add members, assign roles, and keep everyone on the same page throughout the trip.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Camera,
    title: "Photo Gallery",
    description: "Share memories as they happen. Upload photos and videos from your trip in a shared gallery.",
    color: "from-pink-500 to-rose-600",
  },
  {
    icon: Shield,
    title: "Smart Settlement",
    description: "Automatically calculate who owes whom. Settle up with minimal transactions, like Splitwise.",
    color: "from-violet-500 to-purple-600",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div
          className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Tripmate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Your trips, simplified</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Plan trips with friends,{" "}
              <span className="gradient-text">not spreadsheets.</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground sm:text-xl">
              Your all-in-one group travel organizer. Split expenses, plan itineraries, and share memories in one
              place. Tripmate makes group travel effortless.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 sm:w-auto"
              >
                Start Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Works perfectly on mobile</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-3 gap-4 sm:gap-8">
            {[
              { label: "Free Forever", value: "100%" },
              { label: "Mobile First", value: "📱" },
              { label: "Min. Transfers", value: "Smart" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-2xl px-4 py-6 text-center"
              >
                <div className="text-2xl font-bold gradient-text sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">
              Everything you need for group trips
            </h2>
            <p className="text-muted-foreground">
              From planning to settling up — we&apos;ve got you covered.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="glass-strong overflow-hidden rounded-3xl">
            <div className="relative px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5" />
              <h2 className="relative mb-4 text-2xl font-bold sm:text-3xl">
                Ready to plan your next trip?
              </h2>
              <p className="relative mb-8 text-muted-foreground">
                Create an account and start managing your group trips in minutes.
              </p>
              <Link
                href="/register"
                className="relative inline-flex items-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Tripmate</p>
        <p className="mt-1 font-medium">Developed with ❤️ by Jackson</p>
      </footer>
    </div>
  );
}
