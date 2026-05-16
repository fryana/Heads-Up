import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { ChevronLeft, Bell, Brain, Zap } from "lucide-react";

export const Route = createFileRoute("/devices")({
  head: () => ({ meta: [{ title: "Devices — Heads Up" }] }),
  component: DevicesPage,
});

function DevicesPage() {
  return (
    <MobileShell title="Apple devices">
      <div className="px-5 pt-4 pb-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <p className="mt-3 text-sm text-muted-foreground">
          How Heads Up appears on your iPhone and Apple Watch.
        </p>

        {/* iPhone lock-screen notification */}
        <section className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Bell className="h-3.5 w-3.5" /> iPhone notification
          </div>
          <IPhoneLockscreen />
        </section>

        {/* Apple Watch face with complication + notification */}
        <section className="mt-8">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Zap className="h-3.5 w-3.5" /> Apple Watch shortcut
          </div>
          <div className="grid grid-cols-2 gap-4">
            <WatchFace />
            <WatchNotification />
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Tap the Heads Up complication on your watch face to start a 1-tap headache
            log. Confirm intensity with the Digital Crown.
          </p>
        </section>
      </div>
    </MobileShell>
  );
}

/* -------------------------- iPhone lock screen --------------------------- */

function IPhoneLockscreen() {
  return (
    <div className="mx-auto w-full max-w-[300px]">
      <div
        className="relative aspect-[9/19] overflow-hidden rounded-[44px] border-[10px] border-neutral-900 shadow-2xl"
        style={{
          background:
            "linear-gradient(160deg, #1a1530 0%, #2a1f4a 40%, #4a2a5e 100%)",
        }}
      >
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

        {/* Time + date */}
        <div className="mt-9 px-5 text-center text-white">
          <div className="text-[11px] font-medium opacity-90">Saturday, May 16</div>
          <div className="mt-1 text-[58px] font-extralight leading-none tracking-tight">
            09:42
          </div>
        </div>

        {/* Notification card */}
        <div className="absolute inset-x-3 top-[140px]">
          <div
            className="rounded-2xl px-3 py-2.5 text-white shadow-lg backdrop-blur"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: "var(--primary)" }}
              >
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                Heads Up
              </div>
              <div className="ml-auto text-[10px] opacity-70">now</div>
            </div>
            <div className="mt-1.5 text-[12px] font-semibold leading-snug">
              Pain risk elevated this afternoon
            </div>
            <p className="mt-0.5 text-[11px] leading-snug opacity-90">
              Your resting HR is up and you slept 5.2 h. Hydrate &amp; take a screen
              break.
            </p>
          </div>

          <div
            className="mt-2 rounded-2xl px-3 py-2.5 text-white shadow-lg backdrop-blur"
            style={{ background: "rgba(255,255,255,0.14)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: "var(--accent)" }}
              >
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                Heads Up
              </div>
              <div className="ml-auto text-[10px] opacity-70">2h ago</div>
            </div>
            <div className="mt-1.5 text-[12px] font-semibold leading-snug">
              Time to log how you feel?
            </div>
            <p className="mt-0.5 text-[11px] leading-snug opacity-90">
              Quick log from the lock screen — swipe to open.
            </p>
          </div>
        </div>

        {/* Bottom flashlight + camera affordances */}
        <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-8">
          <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur" />
          <div className="h-1 w-24 rounded-full bg-white/70" />
          <div className="h-10 w-10 rounded-full bg-white/15 backdrop-blur" />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Apple Watch -------------------------------- */

function WatchFace() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Crown */}
        <div className="absolute -right-1.5 top-10 h-6 w-2 rounded-r-md bg-neutral-700" />
        <div className="absolute -right-1 top-20 h-4 w-1.5 rounded-r-md bg-neutral-700" />
        {/* Bezel */}
        <div className="rounded-[34px] bg-neutral-900 p-1.5 shadow-2xl">
          <div className="aspect-[41/49] w-[140px] overflow-hidden rounded-[28px] bg-black p-2.5">
            {/* Watch face grid */}
            <div className="flex items-center justify-between text-[9px] text-white/80">
              <span>16 May</span>
              <span className="font-semibold" style={{ color: "var(--primary)" }}>
                9:42
              </span>
            </div>

            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {/* Pain risk complication */}
              <div
                className="col-span-2 rounded-lg p-1.5"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 60%, black))",
                }}
              >
                <div className="text-[7px] uppercase tracking-wider text-white/80">
                  Pain risk
                </div>
                <div className="text-[14px] font-bold text-white leading-none">
                  Moderate
                </div>
                <div className="text-[8px] text-white/80">52/100</div>
              </div>
              {/* HR */}
              <div className="rounded-lg bg-neutral-800 p-1.5">
                <div className="text-[7px] uppercase tracking-wider text-white/70">
                  HR
                </div>
                <div className="text-[12px] font-bold text-white">68</div>
              </div>
            </div>

            {/* Heads Up shortcut complication */}
            <button
              className="mt-1.5 flex w-full items-center gap-1.5 rounded-lg p-1.5"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 50%, black))",
              }}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[7px] uppercase tracking-wider text-white/80">
                  Heads Up
                </div>
                <div className="text-[10px] font-semibold text-white leading-none">
                  Log headache
                </div>
              </div>
            </button>

            {/* Sleep / steps row */}
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <div className="rounded-lg bg-neutral-800 p-1.5">
                <div className="text-[7px] uppercase tracking-wider text-white/70">
                  Sleep
                </div>
                <div className="text-[10px] font-bold text-white">6.4h</div>
              </div>
              <div className="rounded-lg bg-neutral-800 p-1.5">
                <div className="text-[7px] uppercase tracking-wider text-white/70">
                  Steps
                </div>
                <div className="text-[10px] font-bold text-white">4.8k</div>
              </div>
            </div>
          </div>
        </div>
        {/* Band */}
        <div className="mx-auto -mt-1 h-3 w-[110px] rounded-b-lg bg-neutral-700" />
      </div>
      <div className="mt-3 text-center text-[10px] font-medium text-muted-foreground">
        Watch face
      </div>
    </div>
  );
}

function WatchNotification() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -right-1.5 top-10 h-6 w-2 rounded-r-md bg-neutral-700" />
        <div className="rounded-[34px] bg-neutral-900 p-1.5 shadow-2xl">
          <div
            className="aspect-[41/49] w-[140px] overflow-hidden rounded-[28px] p-2.5 text-white"
            style={{
              background:
                "linear-gradient(160deg, var(--primary), color-mix(in oklab, var(--primary) 40%, black))",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-white/25">
                <Brain className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[8px] font-semibold uppercase tracking-wider opacity-90">
                Heads Up
              </span>
            </div>
            <div className="mt-2 text-[12px] font-bold leading-tight">
              Headache starting?
            </div>
            <p className="mt-1 text-[9px] leading-snug opacity-90">
              Quick log it now to track the episode.
            </p>
            <div className="mt-2.5 space-y-1.5">
              <div className="rounded-lg bg-white/20 px-2 py-1.5 text-center text-[10px] font-semibold">
                Log now
              </div>
              <div className="rounded-lg bg-white/10 px-2 py-1.5 text-center text-[10px]">
                Snooze 1h
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto -mt-1 h-3 w-[110px] rounded-b-lg bg-neutral-700" />
      </div>
      <div className="mt-3 text-center text-[10px] font-medium text-muted-foreground">
        Notification
      </div>
    </div>
  );
}
