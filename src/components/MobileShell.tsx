import { Link, useLocation } from "@tanstack/react-router";
import { Home, HeartPulse, PlusCircle, FileText, LifeBuoy } from "lucide-react";
import { ReactNode } from "react";

type Tab = { to: string; label: string; icon: typeof Home; primary?: boolean };
const tabs: Tab[] = [
  { to: "/", label: "Today", icon: Home },
  { to: "/health", label: "Health", icon: HeartPulse },
  { to: "/log", label: "Log", icon: PlusCircle, primary: true },
  { to: "/report", label: "Report", icon: FileText },
  { to: "/help", label: "Action", icon: LifeBuoy },
];

export function MobileShell({ children, title }: { children: ReactNode; title?: string }) {
  const loc = useLocation();
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background">
      {title && (
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </header>
      )}
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 px-2 pb-4 pt-2 backdrop-blur">
        <ul className="flex items-end justify-between">
          {tabs.map((t) => {
            const active = loc.pathname === t.to || (t.to !== "/" && loc.pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <li key={t.to} className="flex-1">
                <Link
                  to={t.to as "/"}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition ${
                    t.primary
                      ? "mx-1 -mt-6 bg-primary py-3 text-primary-foreground shadow-lg shadow-primary/30"
                      : active
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className={t.primary ? "h-6 w-6" : "h-5 w-5"} />
                  <span className="font-medium">{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
