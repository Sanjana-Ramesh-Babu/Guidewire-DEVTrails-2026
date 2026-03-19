# InsurGig — AI-Powered Parametric Income Insurance for Food Delivery Partners

> Guidewire DEVTrails 2026 |
> Persona: Food Delivery Partners — Swiggy & Zomato
> Platform: Mobile-first Progressive Web App + WhatsApp Bot + Web Ops Dashboard

---

## The Problem in One Paragraph

Rajan works 50 hours a week on Zomato in Koramangala, Bengaluru. Last Tuesday it rained. His orders dropped from 11 to 3. He waited 20 minutes outside a restaurant, unpaid. He got a ₹90 penalty for rejecting a dangerous batch order he couldn't safely take in the downpour. His rating slipped. He spent ₹180 on fuel. He went home with ₹140 for a 10-hour shift. No insurance covered any of this.

India's 5 million+ food delivery riders face a compounding income crisis: rain triggers fewer orders, the algorithm deprioritises them, wait times kill efficiency, and supply chain shocks like LPG shortages or CNG scarcity eliminate orders entirely. They bear 100% of this financial risk with zero safety net. **InsurGig is built for Rajan.**

---

## Table of Contents

1. [Persona & Scenario Analysis](#1-persona--scenario-analysis)
2. [How InsurGig Works — Core Workflow](#2-how-gigshield-works--core-workflow)
3. [User Groups & Weekly Premium Model](#3-user-groups--weekly-premium-model)
4. [Parametric Triggers — 16 Disruption Events](#4-parametric-triggers--16-disruption-events)
5. [The Payout Engine — IncomeShield Score (IncomeShield Score)](#5-the-payout-engine--incomeshield-score-iss)
6. [AI/ML Integration Plan](#6-aiml-integration-plan)
7. [Adversarial Defense & Anti-Spoofing Strategy](#7-adversarial-defense--anti-spoofing-strategy)
8. [Platform Choice — Web vs Mobile](#8-platform-choice--web-vs-mobile)
9. [Tech Stack & Development Plan](#9-tech-stack--development-plan)
10. [Unique Differentiators](#10-unique-differentiators)

---

## 1. Persona & Scenario Analysis

**Chosen Persona:** Food Delivery Partners on Swiggy and Zomato operating in Tier-1 and Tier-2 Indian cities.

**Why this persona?** Food delivery riders face the most complex income disruption profile of any gig segment — they work outdoors in all weather conditions, depend entirely on platform algorithms for order allocation, operate in high-traffic urban zones vulnerable to civic events, and earn a significant portion of income through time-sensitive peak-hour windows.

### Real Income Data (2025)

| Metric | Value |
|--------|-------|
| Gross monthly earnings (full-time, metro) | ₹18,000 – ₹35,000+ |
| Fuel & maintenance cost (self-borne) | 20–25% of gross earnings |
| Daily orders on a good day | 10–12 orders |
| Daily orders during a disruption | 2–5 orders |
| Daily income drop during disruption | ₹2,000 → ₹500 |

### Persona-Based Scenarios

**Scenario A — The Rain Spiral (Rajan, Full-time, Bengaluru)**
Heavy rain hits. Customer orders drop. Platform deprioritises Rajan for rejecting a dangerous batch. Rating slips. Income collapses for the next 3 days, not just the rainy evening. This is the compounding income loss spiral — one event, multi-day impact.

**Scenario B — The LPG Cascade (Priya, Casual, Chennai)**
An LPG supply shortage caused by global oil disruption causes restaurants in Priya's zone to shut down. No restaurants open = no orders available. She loses an entire shift through a second-order supply chain failure completely outside her control.

**Scenario C — The New Joiner (Amir, Starter, Delhi)**
Amir joined Zomato 3 weeks ago. A dense fog alert shuts down visibility across North Delhi for 2 days. He has no earnings history to baseline against, but InsurGig uses zone community data to establish his baseline and protects his income from day one.

**Scenario D — The Election Dry Day (Kavya, Power Rider, Mumbai)**
Mumbai has a state election. Dry day declared. Festival road closures activate simultaneously. Kavya's usual ₹2,800 weekly earnings window collapses. InsurGig pre-armed her coverage 24 hours in advance because the ECI (Election Commission of India) notification was public — she receives automatic payout without submitting a claim.

---

## 2. How InsurGig Works — Core Workflow

```
RIDER DISCOVERS GIGSHIELD
        │
        ▼
WhatsApp Onboarding (3 min, 5 questions, 5 languages)
        │
        ▼
Earnings Baseline Captured → AI Tier Assigned
        │
        ▼
Progressive Web App Installed → Auto-debit UPI (Unified Payments Interface) Mandate Signed
        │
        ▼
Weekly Coverage Active (Monday–Sunday)
        │
   ┌────┴────┐
   │         │
Normal     Disruption
Working    Detected
   │         │
   │    IncomeShield Score Payout Engine Calculates:
   │    (Baseline Income − Actual Income)
   │         × Coverage % × Severity Multiplier
   │         │
   │    Trust Composite Score Fraud Check (6 layers, silent, <3 seconds)
   │         │
   │    ┌────┼────┐
   │  Auto  Soft  Analyst
   │ Approve Hold  Review
   │    └────┼────┘
   │         │
   └────►  UPI (Unified Payments Interface) Payout < 10 minutes
```

### The Weekly Cycle

Every **Monday 9 AM** — WhatsApp notification: coverage active, tier confirmed, week's risk forecast (predicted disruptions in rider's zone).

**Mon–Thu** — 16 disruption triggers monitored in real time across rider's active zone.

**Friday auto-debit** — Weekly premium deducted from Swiggy/Zomato earnings wallet. No bank visit, no manual action needed.

**Sunday night** — AI re-evaluates rider's 4-week activity. Tier updated if needed. New premium set for next week.

---

## 3. User Groups & Weekly Premium Model

InsurGig segments riders into four dynamic tiers. **Tier is reassigned every Monday by AI** based on the prior 4-week rolling activity window — a rider who goes part-time automatically moves down, a casual rider who starts working full-time moves up.

| Tier | Profile | Weekly Premium | Coverage Cap | Coverage % |
|------|---------|---------------|-------------|-----------|
| **Starter** | Under 3 months on platform | ₹59 | ₹700/week | 50% |
| **Casual** | Under 20 hrs/week | ₹79 | ₹900/week | 70% |
| **Full-time** | 40–55 hrs/week, primary income | ₹129 | ₹1,800/week | 70% |
| **Power Rider** | 60+ hrs/week, peak-zone expert | ₹199 | ₹3,000/week | 70% |

**Why weekly pricing?** Delivery riders earn and spend in weekly cycles aligned with platform payout schedules. Monthly premiums create a cash flow mismatch — riders do not have ₹500 in a lump sum at month start, but they consistently have ₹100–200 at week end after platform settlement.

**How the deduction works:** Premium is auto-debited from the rider's Swiggy/Zomato earnings wallet every Friday — not from a bank account. This is the critical UX insight: the money is already there, the deduction is invisible, and the rider never has to remember to pay.

### Cold Start — New Joiner Solution

A brand new rider has zero personal earnings history. InsurGig solves this with a blended baseline model:

- **Weeks 1–2:** Baseline = Zone Community 40th percentile of zone earnings (anonymised median of all riders in same city + zone + platform + hour band). Coverage: 50%.
- **Weeks 3–6:** Baseline = 40% personal data + 60% community data. Coverage grows progressively.
- **Week 7+:** Baseline = 100% personal data. Full tier and coverage cap unlocked.
- **First 3 claims** always go to soft-hold (2-hour review) regardless of Trust Composite Score score — silent calibration to build the fraud baseline. Rider sees normal processing messages.

### Mutual Aid Reserve Pool

10% of every weekly premium feeds a zone-level solidarity fund. For Category A disruptions (pandemic lockdowns, declared cyclones), this pool supplements individual payouts so riders receive closer to 90% of their baseline even when the platform's individual insurance pool is strained.

---

## 4. Parametric Triggers — 16 Disruption Events

InsurGig insures **income lost during these events only** — not vehicle repairs, fuel costs, health expenses, or accident bills.

### Category 1 — Environmental (T1–T4)

| # | Trigger | Threshold | Detection Source |
|---|---------|-----------|-----------------|
| T1 | Extreme weather | Rain >40mm/hr, AQI >300, Heat index >42°C, Fog visibility <50m | OpenWeatherMap + AQICN (Air Quality Index China Network) + IMD API |
| T2 | Urban road flooding | Rain accumulation + zero vehicle movement on arterial roads | Rain accumulation + Google Maps Traffic API |
| T3 | Natural disaster alert | Cyclone warning issued, earthquake alert declared | IMD Alert API — pre-arms coverage 24hrs before impact |
| T4 | Zone friction / dead-time | Restaurant pickup wait >18 min AND road congestion elevated | Mock restaurant delay API + traffic congestion index |

### Category 2 — Social / Civic (T5–T9)

| # | Trigger | Threshold | Detection Source |
|---|---------|-----------|-----------------|
| T5 | Civic curfew / strike | Zone closure >2 hours | News API + Govt notification feed |
| T6 | Pandemic / containment zone | Govt-declared movement restriction | Official gazette API — 2.5x multiplier, same-day payout |
| T7 | Election / dry day restriction | ECI (Election Commission of India)-declared polling day or dry day | ECI (Election Commission of India) notification API — predictable weeks in advance |
| T8 | Festival road closures | Major procession/festival blocking restaurant hub routes | Municipal police API (Ganesh, Durga Puja, Diwali etc.) |
| T9 | Regulatory vehicle ban | Odd-even scheme, VIP corridor seal, construction road closure | Delhi MCorp / traffic advisory API |

### Category 3 — Economic & Supply Chain (T10–T13)

*InsurGig's proprietary category — the most India-specific and currently uninsured.*

| # | Trigger | Threshold | Detection Source | Why it's valid |
|---|---------|-----------|-----------------|----------------|
| T10 | Fuel / CNG shortage | Govt-declared supply disruption reducing zone rider availability >30% | MoPNG (Ministry of Petroleum and Natural Gas) + PPAC (Petroleum Planning and Analysis Cell) API + news feed | Insures income lost from inability to operate — not fuel cost itself |
| T11 | LPG shortage cascade | >40% restaurant closure density in zone during working hours | Restaurant operational density index (simulated platform API) | Upstream supply failure → no orders → income loss |
| T12 | Peak hour demand collapse | Zone order velocity <35% of historical average during lunch or dinner band | Simulated platform order velocity API | Rider planned shift around peak window — loss is disproportionate |
| T13 | Labour oversupply surge | Zone rider-to-order ratio >1.8x historical baseline for 3+ hours | Zone rider density index (simulated) | Addresses ONDC shift / platform promo flood — rider loses orders through no fault of their own |

### Category 4 — Infrastructure (T14–T16)

| # | Trigger | Threshold | Detection Source |
|---|---------|-----------|-----------------|
| T14 | Power grid outage | Declared load shedding >2 hours during working hours | State state electricity distribution company (DISCOM) outage API (mock) |
| T15 | Internet / telecom blackout | Govt-ordered internet shutdown — zero platform activity detected across zone | Platform activity zero-detection (simulated) |
| T16 | Platform app outage | Swiggy/Zomato app downtime >30 minutes | Simulated platform session health API |

### Severity Multiplier — Trigger Stacking

When multiple disruptions occur simultaneously, payouts scale accordingly:

| Active Triggers | Severity Multiplier |
|----------------|-------------------|
| 1 trigger | 1.0x |
| 2 triggers | 1.4x |
| 3+ triggers | 1.8x – 2.5x (capped) |
| Category A event (T6) | 2.5x always |

---

## 5. The Payout Engine — IncomeShield Score (IncomeShield Score)

The IncomeShield Score is InsurGig's core differentiator. Every other parametric product pays a flat amount per event. InsurGig pays the **actual income loss** specific to that rider at that moment.

### Formula

```
Payout = (Baseline Income − Actual Income) × Coverage % × Severity Multiplier
```

**Baseline Income (BI):** What this specific rider typically earns during this exact time window (zone + day of week + hour band) — derived from their 8-week personal history, updated weekly. New joiners use zone community baselines.

**Actual Income (AI):** What the simulated platform API reports the rider actually earned during the disruption window.

**Coverage Percentage:** 70% for established riders (Casual, Full-time, Power), 50% for Starters. The 30% co-payment keeps premiums actuarially viable and prevents over-insurance behaviour.

**Severity Multiplier:** Applied by the trigger stacking engine based on how many disruption layers are simultaneously active.

### Example Calculation — Rajan's Tuesday

```
Baseline Income  = ₹800  (4-hour Tuesday evening window, Koramangala)
Actual Income    = ₹0    (no deliveries due to rain + zone friction)
Coverage %       = 70%
Severity         = 2.0x  (T1 rain + T4 zone friction stacked)

Payout = (₹800 − ₹0) × 0.70 × 2.0 = ₹1,120 via UPI (Unified Payments Interface) in under 10 minutes
```

---

## 6. AI/ML Integration Plan

### Model 1 — Personal Earnings Baseline (XGBoost Regression)

**Purpose:** Calculate what a specific rider would have earned in any given time window under normal conditions.

**Features:** Day of week, hour band, zone tier, historical weather on that slot, platform (Swiggy vs Zomato), rider tenure, prior week average earnings, peak/off-peak classification.

**Output:** Predicted earnings for any 4-hour window. Updated weekly via retraining.

**Cold start handling:** Zone community 40th percentile of zone earnings fills in for new joiners until week 7.

**Algorithm:** Gradient Boosted Regression (XGBoost) — interpretable enough to explain to a regulator, accurate enough for personalised payouts.

---

### Model 2 — Dynamic Tier Classifier (LightGBM)

**Purpose:** Assign and weekly-reassign each rider to the correct premium tier.

**Features:** 4-week rolling: login hours, order frequency proxy, zone coverage breadth, platform session duration.

**Output:** One of four tier labels (Starter, Casual, Full-time, Power).

**Runs:** Every Monday at 5 AM. explainability scores (using SHAP analysis) stored for every decision — auditable by ops team and regulators.

**Algorithm:** LightGBM multi-class classifier. Chosen for speed (runs for thousands of riders simultaneously) and explainability analysis compatibility.

---

### Model 3 — Trigger Evaluator (Rule + ML Hybrid)

**Purpose:** Determine whether a qualifying disruption event has occurred in a rider's zone.

**Design:** Two-layer architecture:
- **Hard rules layer:** Deterministic thresholds for clear environmental triggers (rain >40mm, AQI >300). Binary — either the trigger fired or it didn't. Required for regulatory explainability.
- **Soft ML layer:** Probabilistic scoring for nuanced economic triggers (demand drought, LPG cascade, labour oversupply). These signals are gradual and multi-factor — a pure rule engine would miss them.

**Hybrid justification:** Regulators require deterministic explainability for weather thresholds. Real-world demand droughts and supply chain cascades require adaptive scoring. Both layers are needed.

---

### Model 4 — Trust Composite Score / Trust Composite Score (Isolation Forest — Anomaly Detection)

**Purpose:** Silently evaluate whether a claim is genuine or fraudulent at submission time.

**Training:** Trained on normal rider behaviour patterns: GPS movement entropy, device motion sensors (accelerometer and gyroscope) accelerometer variance signatures, cell tower consistency patterns, platform session regularity, claim timing distribution.

**Inference:** At claim time, the incoming 6-signal bundle is scored against the rider's own historical normal distribution. Outlier distance above threshold triggers a hold.

**Algorithm:** Isolation Forest — well-suited for anomaly detection with minimal false positive rates on normal behaviour.

**New rider handling:** First 3 claims always soft-hold while personal baseline establishes. Trust Composite Score trust bonus awarded to riders who clear manual review — system gets easier for legitimate riders over time.

---

### Model 5 — Ring Detection (Louvain Graph Clustering)

**Purpose:** Detect coordinated fraud syndicates (the Telegram group attack scenario).

**Design:** Real-time sliding window (15 minutes) running on Redis. If 12+ claims arrive from the same geographic zone within the window, a graph is constructed:
- **Nodes:** Rider accounts submitting claims
- **Edges:** Shared attributes (device family, registration cohort timestamp proximity, claim pattern similarity, zone overlap)

**Detection:** Louvain community detection algorithm identifies dense suspicious clusters. Clusters above a density threshold are auto-held. Zone is locked for auto-payouts. Operations team alerted in real time.

**Algorithm:** Louvain method — O(n log n) complexity, runs in under 2 seconds on Redis, scales to thousands of concurrent claims.

---

## 7. Adversarial Defense & Anti-Spoofing Strategy

### The Threat

A coordinated syndicate of 500 delivery workers organising via Telegram uses GPS mock applications to fake their location inside declared red-alert weather zones. While resting at home, they trigger mass parametric payouts and drain the liquidity pool.

### Our Defense Principle

A single data signal can be faked. A full behavioural fingerprint across six orthogonal layers cannot. Defeating any one layer still leaves five others intact. The cost of running a coordinated ring attack against InsurGig structurally exceeds the payout value.

The core question at claim evaluation is not *"Is the rider in the zone?"* — it is *"Does every signal from this device, this account, and this moment tell a coherent story of a working rider caught in a disruption?"*

### Layer-by-Layer Breakdown

**Layer 1 — GPS signal quality metadata**
Raw satellite positioning data exposes the GPS accuracy metric known as Horizontal Dilution of Precision, along with satellite count and fix acquisition time. A genuine outdoor rider in rain shows high GPS location uncertainty, intermittent satellite lock, and noisy position traces. A GPS mock app produces a suspiciously perfect precision score of 1.0, instant fix, and unnaturally smooth or static position. We also check the Android `isMockLocationEnabled` flag directly.

**Layer 2 — device motion sensors (accelerometer and gyroscope) cross-check**
Accelerometer and gyroscope data cannot be faked by any consumer GPS spoofing tool. A rider on a bike in rain shows road vibration, two-wheeled motion signatures, and braking micro-events. A person sitting at home shows near-zero accelerometer variance (standard deviation squared (variance) < threshold over 60-second window). If GPS claims 22 km/h motion through Andheri but the accelerometer shows couch-level stillness, the claim is flagged immediately.

**Layer 3 — Network triangulation**
Cell tower IDs and WiFi SSID hashes (not content — only identifiers) are cross-referenced against the claimed GPS zone. A rider at home in Thane claiming to be stranded in Kurla will have cell tower data pointing to Thane. This check runs first, within 2 seconds, before any payout pipeline is triggered.

**Layer 4 — Historical behavioural baseline**
Each rider builds a fingerprint during normal operation: active hours, usual zones, average speed distribution, shift break patterns. A claim submitted in an unfamiliar zone at an unusual hour by a rider who has never operated in that zone scores low. A genuine rider caught by sudden rain on their usual Tuesday-evening home route scores high.

**Layer 5 — Platform session signal**
The simulated platform API is queried for an active or recently active delivery session. No session in the last 2 hours = not working = no income to lose. Claim is rejected at intake before any payout calculation runs. This single check eliminates the majority of unsophisticated fraud attempts.

**Layer 6 — Coordinated ring detection**
If 15+ claims arrive from the same zone in a 12-minute window, and accounts share registration cohort proximity (created within 48 hours of each other), device family similarity, or identical claim patterns — the ring signature is raised. All claims within the ring move to manual review. The zone is temporarily locked for auto-payouts. The platform operations team is alerted in real time.

### Signal Reference Table

| Signal | Source | Fraud pattern it catches |
|--------|--------|--------------------------|
| GPS precision score (Horizontal Dilution of Precision) + satellite count | Raw satellite positioning API | Mock app produces artificially clean signal in bad weather |
| `isMockLocationEnabled` flag | Android Settings API | Direct spoofing intent indicator |
| Accelerometer variance standard deviation squared (variance) (60s window) | Device device motion sensors (accelerometer and gyroscope) | Near-zero variance = stationary, not stranded on a bike |
| Cell tower IDs at claim time | Network State API | Home location in Thane mismatches claimed zone in Kurla |
| WiFi SSID hash | Network scan | Home WiFi network appearing during "outdoor" claim |
| Platform session token | Mock Swiggy/Zomato API | No active session = not working that shift |
| Claim submission latency vs trigger | System timestamp | Submission within 60 seconds of trigger = scripted bot |
| Claims per zone per 12-min window | Internal Redis counter | >15 = coordinated ring signature |
| Account registration cohort gap | User DB | Mass signups within 48hr window = organised syndicate |
| Prior zone activity history | Rider profile DB | First-ever claim in unfamiliar zone = behavioural anomaly |

### UX Balance — Protecting Honest Riders

The system defaults to trust. Trust Composite Score runs silently. Riders never see a score.

| Trust Composite Score Score | Experience | Timeline |
|-----------|------------|----------|
| **>75** | Auto-approved. UPI (Unified Payments Interface) payout. No friction, no notification about verification. | Under 10 minutes |
| **40–75** | WhatsApp: *"Tap here to get paid faster."* One passive cell tower re-check. Framed as speed-up, not accusation. Ignored = still pays via lightweight review. | Immediate if verified, 2 hours if ignored |
| **<40 or ring detected** | *"We're processing your claim — high disruption events sometimes take a few hours."* No mention of fraud. Human analyst reviews with 4-hour SLA. Rider can submit brief written context. | Under 4 hours |

**Non-penalisation principle:** A rider whose claim clears manual review receives a Trust Composite Score trust bonus for their next claim. Riders never accumulate false suspicion over time. Only confirmed fraud results in account escalation — and that action is to the platform operator, not unilateral deactivation by InsurGig.

**What InsurGig never does:** Never asks riders to prove they were not at home. Never requires selfies in adverse weather as primary verification (dangerous — incentivises unsafe behaviour). Never publicly discloses which signals triggered a flag.

---

## 8. Platform Choice — Web vs Mobile

**Decision: Mobile-first Progressive Web App (Progressive Web App) + WhatsApp Bot + Web Ops Dashboard**

### Why Progressive Web App over native app?

Delivery riders in India typically have low-storage Android devices. A Play Store download requiring 80MB of storage will be uninstalled within a week. A Progressive Web App works as a full app experience from any browser, installs via a browser prompt (under 1MB), works offline for basic claim status checks, and requires zero Play Store friction.

### Why WhatsApp as onboarding channel?

Every delivery rider in India already has WhatsApp installed. Using it as the entry point (rider messages "JOIN") means zero barrier to first contact. The conversational bot completes onboarding in under 3 minutes with 5 questions — in Hindi, Tamil, Telugu, Kannada, or English — without the rider needing to download anything first. Trust is established before the app install is requested.

### Three interfaces, three purposes

| Interface | User | Purpose |
|-----------|------|---------|
| Mobile Progressive Web App | Rider | Policy dashboard, claim status, payout history, weekly coverage card, risk forecast |
| WhatsApp Bot | Rider | Premium reminders, payout notifications, zone risk alerts, soft-hold verification prompts |
| Web Dashboard | InsurGig Ops | Zone risk heat maps, fraud ring alerts, claim queue, payout analytics, tier distribution |

---

## 9. Tech Stack & Development Plan

### Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Rider frontend | React Native Progressive Web App | No Play Store barrier, works on low-end Android, offline capable |
| Ops dashboard | React + Tailwind CSS | Fast to build, clean analytics UI |
| Notifications | WhatsApp Business API | Zero additional install for riders |
| Backend API | FastAPI (Python) | IncomeShield Score engine, Trust Composite Score engine, trigger evaluator, ring detector as independent microservices |
| Earnings baseline | XGBoost | Interpretable regression, fast inference |
| Tier classifier | LightGBM + explainability score analysis | Fast multi-class, auditable decisions |
| Fraud detection | Isolation Forest | Anomaly detection with low false positive rate |
| Ring detection | Louvain graph clustering on Redis | Real-time, sub-2-second, scales to thousands of concurrent claims |
| Primary database | PostgreSQL | Rider profiles, claim ledger, tier history |
| Real-time store | Redis | Ring detection sliding window (15-min TTL keys), Trust Composite Score score cache |
| Weather data | OpenWeatherMap API (free tier) | Real rainfall, temperature, AQI data |
| Air quality data | AQICN (Air Quality Index China Network) API (free tier) | Real AQI readings by city |
| Disaster alerts | IMD alert feed | Real cyclone and weather warnings |
| Traffic data | Google Maps Distance Matrix API | Zone friction and road congestion proxy |
| Platform APIs | Mock JSON stubs | Swiggy/Zomato earnings, session activity, order velocity |
| Supply data | Mock APIs | PPAC (Petroleum Planning and Analysis Cell) fuel shortage, state electricity distribution company (DISCOM) grid outage, municipal festival closure |
| Payments | Razorpay sandbox | UPI (Unified Payments Interface) mandate auto-debit + instant payout simulation |
| Fraud signals | Android Satellite Positioning + Motion Sensor + Network APIs | GPS precision score, accelerometer motion variance, cell tower IDs, WiFi network hashes |

### Development Plan

---

#### Backend Microservices

**IncomeShield Score (ISS) Engine**
Calculates Baseline Income using the XGBoost model, retrieves Actual Income from the platform mock API, applies the rider's coverage percentage and severity multiplier based on active trigger count, and returns the final payout amount. Exposed as a FastAPI endpoint: `POST /payout/calculate`.

**Trust Composite Score (TCS) Engine**
Receives the six-signal bundle at claim time — GPS quality, accelerometer variance, cell tower match, behavioural consistency score, platform session status, and ring detection flag. Runs Isolation Forest inference and returns a score between 0 and 100 along with a routing decision: auto-approve, soft-hold, or analyst-review. Exposed as a FastAPI endpoint: `POST /fraud/evaluate`. Target response time: under 3 seconds.

**Trigger Evaluator Service**
Polls all 16 trigger data sources on a scheduled interval. The hard rules layer handles deterministic environmental thresholds (rain above 40mm, AQI above 300, curfew declared). The soft ML scoring layer handles nuanced economic and infrastructure triggers (demand drought, LPG cascade, labour oversupply) using a gradient boosted classifier with a fire threshold of 0.65 probability. Publishes trigger events to the Redis pub/sub channel. Exposed as a FastAPI endpoint: `GET /triggers/active/:zone_id`.

**Ring Detection Service**
Runs as a background async worker — not a request/response endpoint. Consumes every claim submission from the Redis queue. Maintains a 15-minute sliding window of claim counts per zone using Redis keys with time-to-live expiry. When the count exceeds 12 in a window, constructs a fraud graph where nodes are rider accounts and edges are weighted by shared attributes: device family match, registration timestamp proximity within 48 hours, zone overlap, and claim timing similarity. Runs Louvain community detection on the graph. Clusters above the density threshold are auto-held and an alert is published to the operations dashboard in real time.

**Rider Profile Service**
Handles all create, read, and update operations for rider registration, tier assignment, earnings history, claim ledger, Trust Composite Score history, and mutual aid pool contributions. PostgreSQL backed. Key endpoints: `POST /riders/register`, `GET /riders/:id`, `PUT /riders/:id/tier`.

**Policy and Premium Service**
Creates and manages weekly policies. Records tier, premium amount, coverage cap, and which triggers are armed for that week. Manages auto-debit UPI mandate records. Key endpoints: `POST /policy/create`, `GET /policy/:rider_id/active`.

**Payout Processing Service**
Receives approved payout requests from the IncomeShield Score engine. Calls the Razorpay sandbox for UPI transfer execution. Records the completed transaction in the claim ledger. Triggers a WhatsApp payout confirmation notification to the rider. Key endpoint: `POST /payout/disburse`.

**Notification Service**
Manages all outbound WhatsApp Business API messages. Handles eight message types: Monday coverage confirmation, weekly zone risk forecast, trigger fire alert, soft-hold verification prompt, payout confirmation with breakdown, Friday premium debit reminder, tier upgrade or downgrade notice, and income recovery stall alert.

---

#### AI/ML Models

**Model 1 — Earnings Baseline (XGBoost Regression)**
Input features: day of week, hour band (morning, afternoon, evening, night), zone tier, historical weather on the same slot, platform (Swiggy or Zomato), rider tenure in weeks, last week's average earnings, peak or off-peak flag. Output: predicted earnings for any 4-hour window. Training data: synthetic rider earnings dataset generated from documented income ranges. Retrained every Sunday midnight via a scheduled cron job. New joiners use zone community 40th percentile of earnings until personal data accumulates over 7 weeks.

**Model 2 — Tier Classifier (LightGBM)**
Input features: 4-week rolling login hours, estimated order count, number of distinct zones covered, platform session duration per day, rider tenure. Output: one of four tier labels — Starter, Casual, Full-time, or Power Rider. Scheduled to run every Monday at 5 AM. Explainability scores generated and stored per decision for regulatory audit trail. Every tier decision is traceable to the specific input features that drove it.

**Model 3 — Trigger Evaluator (Rule and ML Hybrid)**
Hard rules layer: deterministic threshold checks executed first for all environmental triggers. Soft ML layer: gradient boosted classifier for T10 through T16 (economic and infrastructure triggers) where signals are gradual and multi-factor. Takes zone-level metrics as input and outputs a disruption probability between 0 and 1. A probability above 0.65 fires the trigger.

**Model 4 — Trust Composite Score (Isolation Forest)**
Trained on synthetic normal rider behaviour data covering GPS movement entropy per 5-minute window, accelerometer variance over 60 seconds, cell tower consistency score, platform session regularity index, and claim submission timing distribution relative to trigger fire events. At claim time, the incoming 6-signal bundle is scored against the rider's personal normal distribution. Outlier distance is mapped to a Trust Composite Score between 0 and 100. New riders are compared to the population-level model for their first 3 claims while a personal baseline is established.

**Model 5 — Ring Detection (Louvain Graph Clustering)**
Not a trained model but an algorithm applied at runtime to a dynamically constructed graph. Graph edges are weighted by four shared attributes: device family match, registration timestamp proximity within 48 hours of each other, zone overlap score, and claim timing similarity. Louvain community detection runs when the graph contains 12 or more nodes within a 15-minute window. Cluster density score above the configured threshold triggers auto-hold and ops alert.

---

#### Data Layer

**PostgreSQL — Primary Database**
Core tables: `riders`, `policies`, `claims`, `payouts`, `tier_history`, `tcs_scores`, `zone_baselines`, `trigger_log`, `analyst_queue`, `mutual_aid_pool`. The `claims` table stores the full six-signal bundle alongside every claim for retrospective audit. The `zone_baselines` table holds community earnings data by city, zone, platform, day of week, and hour band — updated weekly and used for cold-start new joiners.

**Redis — Real-Time Store**
Used for: ring detection sliding window (15-minute time-to-live keys per zone tracking claim counts), active trigger cache per zone (so the IncomeShield Score engine can look up active triggers without hitting PostgreSQL on every claim), Trust Composite Score cache per rider (avoids recalculating for duplicate submissions), and pub/sub channel for trigger fire events consumed by the IncomeShield Score engine, notification service, and pre-event arming checker simultaneously.

**Model Artefact Store**
Trained model binaries stored as `.pkl` files. Weekly versioned re-saves for the XGBoost earnings baseline and LightGBM tier classifier. Isolation Forest model updated monthly. Version history retained for 8 weeks to support rollback if a new model version underperforms.

---

#### External API Integrations

**Real APIs (active during development)**

OpenWeatherMap API (free tier) — polled every 15 minutes per active zone. Fields used: rain volume per hour, temperature, wind speed, visibility. Feeds T1 (weather) and T2 (flooding proxy) trigger evaluation.

AQICN Air Quality Index China Network API (free tier) — polled hourly per city. AQI value feeds the pollution sub-trigger within T1. Threshold: AQI above 300 fires the trigger.

India Meteorological Department Alert Feed — monitors for cyclone warnings and weather red alerts. Feeds T3 (natural disaster). When a warning is detected, the pre-event arming system activates coverage for all riders in the declared impact zone 24 hours before the event window opens.

Google Maps Distance Matrix API — calculates zone congestion index for T2 (road flooding) and T4 (dead-time friction) by measuring current travel time versus historical baseline for the same zone and hour band.

Razorpay Sandbox — UPI mandate creation for weekly Friday auto-debit from rider earnings wallet. Instant payout simulation to rider UPI ID. Webhook receives payment success and failure events and updates the claim ledger accordingly.

WhatsApp Business API — all outbound templated notifications and inbound onboarding bot conversation handling. Language detection at first message. Webhook processes rider replies during onboarding flow.

**Mock APIs (JSON stubs for development and demo)**

Swiggy/Zomato Earnings and Session API — returns rider session status (active or inactive), last order timestamp, earnings for current shift window, order count in last 2 hours. Pre-built response scenarios: normal shift, disruption shift, zero-earnings shift.

Platform Order Velocity API — returns orders per hour for a given zone over the last 6 hours. Used to detect T12 (peak hour demand collapse) and T13 (labour oversupply). Zone-level aggregated data only, no individual rider data exposed.

PPAC Petroleum Planning and Analysis Cell Fuel Shortage API — returns fuel availability status per city (normal, constrained, or critical). Feeds T10. Multiple disruption scenarios pre-loaded for demo.

State Electricity Distribution Company Grid Outage API — returns declared load shedding schedules and unplanned outage alerts per zone. Feeds T14. Trigger threshold: declared outage above 2 hours during working hours.

Restaurant Operational Density API — returns the percentage of registered restaurants actively accepting orders in a zone in real time. Feeds T11 (LPG cascade). Trigger threshold: below 60% operational density for 3 consecutive hours.

Zone Rider Density API — returns current active rider count per zone. Used to calculate rider-to-order ratio for T13 (labour oversupply). Trigger threshold: ratio above 1.8 times the historical zone baseline for 3 consecutive hours.

---

#### Rider Progressive Web App — Screens

**Onboarding screens** — Language selection (Hindi, Tamil, Telugu, Kannada, English), 5-question setup form, earnings baseline input, tier display with premium amount and coverage cap, UPI mandate consent, Progressive Web App install prompt.

**Home dashboard** — Active coverage card showing tier, premium, and coverage cap in plain language. Current week risk forecast listing predicted disruptions in the rider's zone. Active trigger status badge when a disruption is live. Quick claim status if a payout is pending.

**Policy screen** — Current week policy details, coverage formula explained without jargon, this week's armed triggers listed, weekly premium payment history, next auto-debit date and amount.

**Claims screen** — All active claims with status (auto-approved, processing, or paid). Full payout breakdown showing the rider's baseline income, actual earnings during disruption, which triggers stacked, the multiplier applied, and the final amount paid.

**Earnings screen** — Personal earnings baseline trend over 8 weeks. Tier assignment history. Coverage cap progression for new joiners showing weekly growth. Income recovery tracker showing post-disruption earnings versus baseline.

**Profile screen** — Rider details, platform (Swiggy or Zomato), city and zone, UPI mandate status, notification preferences, language setting.

---

#### WhatsApp Bot — Conversation Flows

**Onboarding flow** — Triggered by rider messaging "JOIN". Collects language preference, name, city, platform, weekly working hours, and approximate last-month earnings. Handles corrections, validates each input, and completes with a Progressive Web App install link and tier confirmation message. Target completion time: under 3 minutes.

**Monday weekly notification** — Coverage active confirmation, this week's tier and premium amount, risk forecast for the week listing predicted disruptions by day.

**Trigger fire notification** — Sent when a disruption is detected in the rider's zone. Example: *"Heavy rain detected in your zone. Your InsurGig coverage is calculating your payout now."*

**Soft-hold verification prompt** — Sent when Trust Composite Score is between 40 and 75. Framed as a speed-up option: *"Your claim is processing. Tap here to confirm your location and get paid faster."* Triggers a passive one-tap cell tower re-check.

**Payout confirmation** — Sent when UPI transfer completes. Shows rupee amount, claim reference, baseline income used, and which disruption triggered the payout.

**Friday debit reminder** — Sent Friday morning for riders on manual payment or if auto-debit fails. One-tap UPI deep link. *"Your ₹129 InsurGig premium is due today. Tap to pay and keep your coverage active."*

---

#### Operations Web Dashboard — Screens

**Zone risk heat map** — City map with colour-coded zones by active trigger count and payout volume. Updated hourly. Click any zone for a drill-down showing active triggers, claims in the last 24 hours, and total payout amount for that zone.

**Fraud ring alerts panel** — Real-time ring detection alerts with zone name, claim count, detection time window, cluster density score, and the list of flagged rider accounts. One-click bulk approve or bulk reject with mandatory reason logging.

**Analyst review queue** — Claims with Trust Composite Score below 40 or ring-flagged. Each entry shows the full rider profile, claim details, all six signal readings with plain-English explanations, the rider's written context note if submitted, and approve or reject buttons with a 4-hour SLA timer.

**Payout analytics** — Weekly payout volume, claim acceptance rate, average payout per tier, revenue versus payout ratio per zone, and mutual aid pool balance with draw history.

**Rider tier distribution** — Breakdown of active riders per tier, weekly tier movements (upgrades and downgrades), new joiner cold-start progression tracking, and churned rider count.

**Trigger management panel** — Live status of all 16 triggers per zone with the ability to manually arm or disarm any trigger without a code deployment. Threshold configuration for each trigger. Full audit log of all manual overrides with operator name and timestamp.

---

#### Fraud Detection — Full Implementation

**Device fingerprint capture at onboarding** — Silent background collection during Progressive Web App first launch: device ID hash, cell tower IDs at registration location, accelerometer baseline calibration sample over a 5-minute passive reading, and initial GPS quality reading. Stored as the rider's home fingerprint baseline used by all future Trust Composite Score calculations.

**Claim-time signal bundle collection** — At every claim submission: GPS coordinates, satellite count, GPS precision score, accelerometer variance over last 60 seconds, current cell tower IDs, WiFi network hash, platform session token validity, and timestamp delta between trigger fire event and claim submission.

**Trust Composite Score calculation** — Isolation Forest inference on the incoming signal bundle against the rider's personal normal distribution. Score returned in under 1 second. Stored to rider's trust history after every claim.

**Ring detection pipeline** — Every claim pushed to Redis queue. Background worker checks zone claim count in the 15-minute sliding window. Graph built and Louvain runs when threshold crossed. All claims in a confirmed ring cluster are auto-held and the operations dashboard is alerted instantly.

**Duplicate claim prevention** — Each claim is linked to a composite unique key of rider ID plus trigger ID plus zone ID plus date. This prevents the same rider claiming the same trigger twice in the same zone on the same day. A Redis lock during processing prevents race conditions from concurrent submissions.

**Trust score feedback loop** — A rider whose claim clears analyst manual review receives a Trust Composite Score bonus of 10 points applied to their next claim. A rider confirmed as fraudulent has their account flagged and all future claims auto-held. Honest riders accumulate trust over time and the system becomes progressively more frictionless for them.

---

#### Three Unique Feature Components

**Pre-event coverage arming** — A cron job runs every 6 hours checking the India Meteorological Department cyclone alert feed and the Election Commission of India notification feed. When a predictable high-impact event is detected more than 24 hours before its start, the system automatically flags all rider zones in the impact area, arms their coverage, and sends a WhatsApp pre-alert. No claim submission needed — payout auto-triggers if earnings drop below baseline during the declared event window.

**Income recovery tracker** — A post-payout background job monitors the rider's weekly earnings for the 2 weeks following any payout. If earnings remain below 80% of their personal baseline (the recovery stall threshold), a follow-on partial payout of 30% of the original claim amount is triggered automatically. This directly addresses the algorithmic deprioritisation spiral documented in research — where a single disruption causes lasting rating damage that suppresses earnings for weeks afterward.

**Mutual aid reserve pool** — 10% of each weekly premium is deducted before allocation to the individual coverage pool and stored per zone in the PostgreSQL `mutual_aid_pool` table. The pool is activated for Category A disruption events (T6 pandemic lockdown, T3 declared cyclone). During activation, the pool supplements individual payouts so riders receive up to 90% of their baseline income even when the individual insurance pool is strained by the scale of the event.

---

## 10. Unique Differentiators

### 1. IncomeShield Score — actual delta, not flat payout
Every other parametric product pays a fixed amount per event (e.g., "₹200 if it rains"). InsurGig calculates the actual income the rider would have earned minus what they actually earned, multiplied by their coverage percentage and a severity multiplier. Every payout is personalised, fair, and proportional to real loss.

### 2. Trigger stacking with severity multiplier
Rain alone is bad. Rain + restaurant delays + zone friction simultaneously is 2.5x worse. InsurGig's severity multiplier reflects the compounding reality of how disruptions affect rider income — not the simplified binary view that existing products use.

### 3. Economic & Supply Chain triggers (India-specific, first-of-kind)
No insurance product anywhere insures income lost from LPG shortage restaurant closures, CNG supply disruptions from geopolitical events, or platform labour oversupply surges caused by ONDC market shifts. These are InsurGig's proprietary fourth trigger category — directly derived from India's 2025–26 macro risk landscape.

### 4. Pre-event coverage arming
For predictable disruptions (declared cyclones, elections, announced festival closures), InsurGig arms coverage 24 hours in advance. The rider gets a WhatsApp the night before: *"Heavy rain forecast tomorrow. Your InsurGig is pre-armed — if earnings drop below your baseline, your claim auto-processes. No action needed."* Zero claim submission required.

### 5. Income recovery trajectory tracking
After a payout, InsurGig monitors whether earnings recovered within 2 weeks. If not — because the disruption caused lasting algorithmic deprioritisation (lower rating → fewer orders → sustained loss spiral) — a recovery stall flag fires and a partial follow-on payout activates. This addresses the compounding income spiral that every researcher has documented but no insurance product has ever acted on.

### 6. Dynamic weekly tier reassignment
Unlike annual or monthly insurance products with fixed premiums, InsurGig's LightGBM classifier reassigns rider tiers every Monday based on the prior 4-week activity window. A power rider who gets sick drops to full-time. A starter who rides hard for 6 weeks upgrades. The model stays actuarially sound and always reflects the rider's current reality.

---

## Appendix — Complete Trigger Reference

| # | Trigger | Category | Detection | Income Loss Mechanism |
|---|---------|----------|-----------|----------------------|
| T1 | Extreme weather | Environmental | OpenWeather + IMD | Cannot ride safely outdoors |
| T2 | Urban road flooding | Environmental | Rain + traffic API | Zone roads physically impassable |
| T3 | Natural disaster alert | Environmental | IMD alert API | City-wide operations halted |
| T4 | Zone friction / dead-time | Environmental | Mock restaurant + traffic API | Unpaid waiting time kills order count |
| T5 | Civic curfew / strike | Social | News + govt API | Cannot access pickup/drop locations |
| T6 | Pandemic / containment | Social | Gazette API | Movement restriction = zero deliveries |
| T7 | Election / dry day | Social | ECI (Election Commission of India) API | Mandatory operational restriction |
| T8 | Festival road closures | Social | Municipal police API | Restaurant hub access blocked |
| T9 | Regulatory vehicle ban | Social | Traffic advisory API | Legally cannot operate in zone |
| T10 | Fuel / CNG shortage | Economic | MoPNG (Ministry of Petroleum and Natural Gas) + PPAC (Petroleum Planning and Analysis Cell) API | Cannot fuel vehicle = cannot operate |
| T11 | LPG shortage cascade | Economic | Restaurant density index | Restaurants closed = zero orders |
| T12 | Peak hour demand collapse | Economic | Platform velocity API | Lost highest-earning time window |
| T13 | Labour oversupply surge | Economic | Zone density index | Algorithmic order starvation |
| T14 | Power grid outage | Infrastructure | state electricity distribution company (DISCOM) API | EV riders cannot charge vehicles |
| T15 | Telecom blackout | Infrastructure | Platform zero-activity | App non-functional = no orders |
| T16 | Platform app outage | Infrastructure | Session health API | Platform unavailable >30 minutes |

> **Critical constraint compliance:** All 16 triggers insure **income lost during the event only**. No trigger results in vehicle repair payouts, fuel cost reimbursement, health expense coverage, or accident medical bills. The boundary between income loss and operating cost is maintained throughout every trigger definition.

---

*InsurGig — Because Rajan deserves a safety net.*

*Built for Guidewire DEVTrails 2026*
