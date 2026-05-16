import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { CalendarCheck, Phone, Pill, X, Check, ChevronLeft } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Action — Heads Up" }] }),
  component: HelpPage,
});

type Sheet = null | "book" | "friend" | "pharmacy";

const SLOTS = [
  { id: "s1", time: "Tomorrow · 09:20", clinic: "Dr. Hassan · Riverside GP" },
  { id: "s2", time: "Tomorrow · 14:40", clinic: "Dr. Lindgren · NHS Walk-in" },
  { id: "s3", time: "Wed · 11:10", clinic: "Dr. Patel · Doctolib partner" },
];

const FRIENDS = [
  { name: "Diyora", phone: "+44 7787610006" },
  { name: "Alex", phone: "+44 7700 900222" },
  { name: "Sam", phone: "+44 7700 900333" },
];

const PHARMACIES = [
  { name: "Boots — High St", distance: "0.3 km", hours: "Open until 22:00" },
  { name: "Superdrug — Market Pl", distance: "0.6 km", hours: "Open until 20:00" },
  { name: "LloydsPharmacy — Station", distance: "1.1 km", hours: "Open 24h" },
];

const DRUGS = [
  { id: "ibu400", name: "Ibuprofen", strength: "400 mg", price: "£3.20" },
  { id: "para500", name: "Paracetamol", strength: "500 mg", price: "£2.40" },
  { id: "aspi300", name: "Aspirin", strength: "300 mg", price: "£2.80" },
];

type Fulfilment = "delivery" | "pickup";
type Order = {
  pharmacy: typeof PHARMACIES[number];
  fulfilment: Fulfilment;
  drug: typeof DRUGS[number];
  time: string;
};

function HelpPage() {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [booked, setBooked] = useState<string | null>(null);

  // pharmacy flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [pharmacy, setPharmacy] = useState<typeof PHARMACIES[number] | null>(null);
  const [fulfilment, setFulfilment] = useState<Fulfilment | null>(null);
  const [drug, setDrug] = useState<typeof DRUGS[number] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const openPharmacy = () => {
    setStep(1);
    setPharmacy(null);
    setFulfilment(null);
    setDrug(null);
    setTime(null);
    setOrder(null);
    setSheet("pharmacy");
  };

  const closeSheet = () => setSheet(null);

  return (
    <MobileShell title="Action">
      <div className="space-y-3 px-5 pt-5">
        <ActionCard
          title="Book a GP"
          subtitle={booked ? "Appointment confirmed" : "NHS · Doctolib partners"}
          icon={CalendarCheck}
          tone="primary"
          onClick={() => setSheet("book")}
        />
        <ActionCard
          title="Call a friend"
          subtitle="Sometimes talking helps"
          icon={Phone}
          tone="accent"
          onClick={() => setSheet("friend")}
        />
        <ActionCard
          title="Order Drugs from pharmacy"
          subtitle="Delivery or pick up"
          icon={Pill}
          tone="secondary"
          onClick={openPharmacy}
        />
      </div>

      {sheet && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40"
          onClick={closeSheet}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-card p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {sheet === "pharmacy" && step > 1 && !order && (
                  <button
                    onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                    className="rounded-full p-1.5 text-muted-foreground"
                    aria-label="Back"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <h3 className="text-base font-semibold">
                  {sheet === "book"
                    ? "Available appointments"
                    : sheet === "friend"
                    ? "Who do you want to call?"
                    : order
                    ? "Order confirmed"
                    : step === 1
                    ? "Choose a pharmacy"
                    : step === 2
                    ? "Delivery or pick up?"
                    : step === 3
                    ? "Choose a drug"
                    : "Confirm time"}
                </h3>
              </div>
              <button onClick={closeSheet} className="rounded-full p-1.5 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {sheet === "book" && (
              <div className="mt-4 space-y-2">
                {booked ? (
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Check className="h-4 w-4" /> Booked
                    </div>
                    <p className="mt-1 text-sm">{booked}</p>
                    <button
                      onClick={() => setBooked(null)}
                      className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs"
                    >
                      Cancel appointment
                    </button>
                  </div>
                ) : (
                  SLOTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setBooked(`${s.time} — ${s.clinic}`)}
                      className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{s.time}</div>
                        <div className="text-xs text-muted-foreground">{s.clinic}</div>
                      </div>
                      <span className="text-xs font-medium text-primary">Book</span>
                    </button>
                  ))
                )}
                <p className="pt-2 text-[11px] text-muted-foreground">
                  Mock NHS / Doctolib flow. Real integration ships in the iOS app.
                </p>
              </div>
            )}

            {sheet === "friend" && (
              <div className="mt-4 space-y-2">
                {FRIENDS.map((f) => (
                  <a
                    key={f.phone}
                    href={`tel:${f.phone.replace(/\s/g, "")}`}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4"
                  >
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.phone}</div>
                    </div>
                    <Phone className="h-4 w-4 text-primary" />
                  </a>
                ))}
              </div>
            )}

            {sheet === "pharmacy" && (
              <div className="mt-4 space-y-2">
                {order ? (
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Check className="h-4 w-4" /> Order placed
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pharmacy: </span>
                        {order.pharmacy.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Item: </span>
                        {order.drug.name} {order.drug.strength} · {order.drug.price}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {order.fulfilment === "delivery" ? "Delivery: " : "Pick up: "}
                        </span>
                        {order.time}
                      </div>
                    </div>
                    <button
                      onClick={closeSheet}
                      className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs"
                    >
                      Done
                    </button>
                  </div>
                ) : step === 1 ? (
                  PHARMACIES.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setPharmacy(p);
                        setStep(2);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.hours}</div>
                      </div>
                      <span className="text-xs font-medium text-primary">{p.distance}</span>
                    </button>
                  ))
                ) : step === 2 ? (
                  <>
                    <div className="px-1 pb-1 text-xs text-muted-foreground">{pharmacy?.name}</div>
                    {(["delivery", "pickup"] as Fulfilment[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFulfilment(f);
                          setStep(3);
                        }}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left"
                      >
                        <div className="text-sm font-medium">
                          {f === "delivery" ? "Delivery to home" : "Pick up in store"}
                        </div>
                        <span className="text-xs font-medium text-primary">
                          {f === "delivery" ? "~45 min" : "~15 min"}
                        </span>
                      </button>
                    ))}
                  </>
                ) : step === 3 ? (
                  <>
                    <div className="px-1 pb-1 text-xs text-muted-foreground">
                      {pharmacy?.name} · {fulfilment === "delivery" ? "Delivery" : "Pick up"}
                    </div>
                    {DRUGS.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setDrug(d);
                          setStep(4);
                        }}
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 text-left"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {d.name} {d.strength}
                          </div>
                          <div className="text-xs text-muted-foreground">Single pack</div>
                        </div>
                        <span className="text-xs font-medium text-primary">{d.price}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="px-1 pb-1 text-xs text-muted-foreground">
                      {drug?.name} {drug?.strength} · {pharmacy?.name}
                    </div>
                    {(fulfilment === "delivery"
                      ? ["ASAP (~45 min)", "In 2 hours", "Tomorrow morning"]
                      : ["In 15 min", "In 1 hour", "Tomorrow · 09:00"]
                    ).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${
                          time === t
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        }`}
                      >
                        <div className="text-sm font-medium">{t}</div>
                        {time === t && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                    <button
                      disabled={!time}
                      onClick={() => {
                        if (pharmacy && fulfilment && drug && time) {
                          setOrder({ pharmacy, fulfilment, drug, time });
                        }
                      }}
                      className="mt-2 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow disabled:opacity-50"
                    >
                      Confirm order
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </MobileShell>
  );
}

function ActionCard({
  title,
  subtitle,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: typeof CalendarCheck;
  tone: "primary" | "accent" | "secondary";
  onClick: () => void;
}) {
  const styles: Record<typeof tone, string> = {
    primary: "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
    accent: "bg-gradient-to-br from-accent to-accent/70 text-accent-foreground",
    secondary: "bg-card text-foreground border border-border",
  };
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-3xl p-5 text-left shadow-sm transition active:scale-[0.99] ${styles[tone]}`}
    >
      <div className="rounded-2xl bg-background/20 p-3">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-base font-semibold">{title}</div>
        <div className="mt-0.5 text-xs opacity-80">{subtitle}</div>
      </div>
    </button>
  );
}
