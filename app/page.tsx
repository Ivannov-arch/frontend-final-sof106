import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center px-5 text-sm">
          <Link href="/" className="font-bold text-lg tracking-tight">
            🚢 Marine Chatbot
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/track-ship" className="hover:underline text-sm">
              Track Ship
            </Link>
            {hasEnvVars && (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 gap-8 py-24">
        <div className="flex flex-col items-center gap-4 max-w-2xl">
          <span className="text-6xl">⚓</span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Marine Navigation Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered chatbot for sea route planning, port information, and
            vessel tracking across Southeast Asian waters.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/protected"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            💬 Open Chatbot
          </Link>
          <Link
            href="/track-ship"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            📡 Track a Ship
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="w-full flex justify-center px-5 pb-24">
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: "🗺️",
              title: "Route Planning",
              desc: "Find optimal sea routes between ports with congestion-aware pathfinding.",
            },
            {
              icon: "🏗️",
              title: "Port Information",
              desc: "Get details on major ports across Southeast Asia including coordinates and connections.",
            },
            {
              icon: "📊",
              title: "Traffic Analysis",
              desc: "Analyze AIS traffic density and vessel movement patterns across sea lanes.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-lg border border-foreground/10 p-6 flex flex-col gap-3 hover:border-foreground/30 transition-colors"
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-muted-foreground text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full flex items-center justify-center border-t py-6 text-xs text-muted-foreground">
        Marine Chatbot — SOF106
      </footer>
    </main>
  );
}
