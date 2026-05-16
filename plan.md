## Goal

Build a mobile-first **web prototype** in Lovable that demonstrates the full headache-management flow on an iPhone-sized viewport. The prototype is a clickable design reference your iOS developer will rebuild natively in Swift/SwiftUI. Real Apple Health and real GP booking are explicitly **out of scope for the prototype** — they will be implemented in the native iOS app.

---

## Part 1 — What we build in Lovable (UI prototype)

Mobile-first PWA-style web app, locked to iPhone viewport, no real backend. All data is local/mocked so the prototype runs standalone.

### Screens & flow

1. **Onboarding** (3 short slides) — sleep tracking, 3D pain log, GP report.
2. **Home / Today** — today's sleep score (mocked Apple Health), "Log a headache" button, recent episodes list.
3. **Sleep dashboard** — last 7/30 days chart (mocked data), correlation hint ("poor sleep on 3 of your last 5 headache days").
4. **3D pain log** — rotatable 3D head model. Tap to drop pain markers. For each marker capture:
   - Intensity (1–10 slider)
   - Type (throbbing / sharp / pressure / dull)
   - Triggers (multi-select: sleep, stress, food, screen, hormonal, weather)
   - Duration, medication taken, notes
5. **Episode detail** — replay the 3D head with markers, all metadata.
6. **Report to GP** — generate a PDF summary (date range, episode count, average intensity, sleep correlation, marker heatmap thumbnail). Share / download.
7. **Get help** — three cards:
   - **Book a GP** (mock NHS / Doctolib flow with confirm + cancel)
   - **Call a friend** (opens phone dialer link, pick from contacts list — mocked)
   - **Find a pharmacy** (mock map + nearest 3 list)

### Tech approach (prototype)

- **3D head**: React Three Fiber + drei, free anatomical head GLB. Raycast clicks to place markers; markers stored as 3D coordinates so they replay correctly.
- **Storage**: localStorage (no backend needed for a prototype).
- **Sleep data**: hardcoded JSON fixture mimicking Apple Health export shape (so the iOS dev sees the expected data contract).
- **PDF report**: jsPDF, generated client-side.
- **Booking integrations**: mocked screens only — but the UI matches the real NHS / Doctolib flows so the iOS dev has a faithful target.
- **Viewport**: locked to mobile preview throughout.

### Out of scope for the prototype

- Real Apple HealthKit (iOS-only API, impossible in a web app).
- Real NHS / Doctolib booking (requires per-user OAuth + production API approval).
- Real authentication and cloud sync.
- Push notifications.

---

## Part 2 — iOS native build plan (handoff to your iOS developer)

### Stack
- **Swift + SwiftUI**, iOS 17+ target.
- **HealthKit** for sleep data (`HKCategoryTypeIdentifier.sleepAnalysis`).
- **RealityKit** or **SceneKit** for the 3D head (reuse the same GLB, converted to USDZ).
- **CoreData** or **SwiftData** for local episode storage; **CloudKit** for cross-device sync.
- **PDFKit** for the GP report.
- **MessageUI / ShareLink** for sending the report.

### Milestones

1. **Project setup & design port** — translate the Lovable prototype's screens 1:1 in SwiftUI. Use the same color tokens, typography, and component layout.
2. **HealthKit integration**
   - Add HealthKit capability in Xcode, request `sleepAnalysis` read permission.
   - Replace the prototype's mock JSON with real `HKSampleQuery` results.
   - Build the 7/30-day chart with Swift Charts.
3. **3D pain log (native)**
   - Convert the GLB head model to USDZ.
   - Render with RealityKit; implement hit-testing for marker placement.
   - Persist marker coordinates + metadata in SwiftData.
4. **GP report (native)** — port the PDF layout to PDFKit; share via `ShareLink`.
5. **Booking integrations** (each requires its own approval process):
   - **NHS**: apply for access to the [NHS App Integration / GP Connect APIs](https://digital.nhs.uk/developer). Long approval cycle (weeks to months). For MVP, fall back to deep-linking the NHS App.
   - **Doctolib**: contact Doctolib partnerships for API access; otherwise deep-link to their app.
   - Cancel flow uses the same provider API.
6. **Help actions** — `tel:` links for call-a-friend, `MKMapView` + Apple Maps search for nearest pharmacy.
7. **Auth & sync** — Sign in with Apple, CloudKit for sync.
8. **Compliance**
   - **HIPAA / GDPR / NHS DSP Toolkit**: medical data triggers strict requirements. Get legal review before storing anything server-side.
   - **App Store medical app guidelines (§1.4.1)**: you'll need to declare medical intent and may need a clinical reviewer.
   - Privacy manifest + HealthKit usage strings in Info.plist.
9. **Beta via TestFinish** → App Store submission.

### Estimated effort
~3–5 months for a solo iOS dev to ship a polished v1, dominated by HealthKit + 3D + booking-API approvals.

---

## What you'll get from this plan

- A working mobile web prototype your iOS developer can open on their phone and use as the source of truth for screens, flows, and data shapes.
- All prototype code (React + TypeScript) in this Lovable project — useful as a visual reference even though the native app will be rewritten in Swift.
- This document as the iOS roadmap.

Approve and I'll start building the prototype.
