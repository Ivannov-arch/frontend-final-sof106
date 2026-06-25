import Link from "next/link";
import { Ship, Compass, Anchor, BarChart2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Ship className="h-5 w-5" />
            </div>
            <Link href="/" className="font-bold text-lg leading-tight tracking-tight hover:text-blue-400 transition-colors">
              Marine Route Optimizer
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/chat" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Interactive Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-8 py-20 lg:py-32 max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="p-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-full animate-pulse">
            <Compass className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Marine Navigation Assistant
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            An AI-powered interface for dynamic sea route planning, port connectivity analysis, and real-time vessel tracking across Southeast Asian waters.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all"
          >
            💬 Open Navigation Chatbot
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: <Compass className="h-6 w-6 text-blue-400" />,
              title: "Route Planning",
              desc: "Determine optimal pathing between international sea ports with smart congestion avoidance.",
            },
            {
              icon: <Anchor className="h-6 w-6 text-blue-400" />,
              title: "Port Information",
              desc: "Quick access to major Southeast Asian port coordinates, capacities, and active schedules.",
            },
            {
              icon: <BarChart2 className="h-6 w-6 text-blue-400" />,
              title: "Traffic Analysis",
              desc: "Review vessel density plots, historic voyage data, and live AIS tracking records.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-blue-500/50 hover:bg-slate-850 transition-all shadow-xl"
            >
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl w-fit">
                {icon}
              </div>
              <h3 className="font-bold text-lg text-white">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        Marine Route Optimizer — SOF106 &copy; 2026
      </footer>
    </main>
  );
}
