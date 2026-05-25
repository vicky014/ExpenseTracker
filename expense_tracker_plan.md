# Expense Tracker & Smart Loan Payoff Planner
## Full Product Plan — for Development Handoff

---

## 1. Project Summary

Build a **cross-platform Expense Tracker & Smart Loan Payoff Planner** — available as both a **web app** and an **Android app** — that helps users manage daily spending, track EMIs and loans, and get AI-powered personalized debt payoff strategies with real-time visual progress tracking.

The app must be **usable by anyone**, regardless of financial literacy. Every input screen should be so simple that even a first-time smartphone user can fill it out confidently.

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| **Frontend (Web)** | React + TypeScript | Component reuse, strong typing, large ecosystem |
| **Mobile (Android)** | React Native | Shares 70–80% of code with the web app |
| **Backend / API** | Java + Spring Boot | Native H2 integration via Spring Data JPA, auto-schema generation |
| **Database** | H2 (embedded) | Lightweight, zero-config, file-based persistence, ideal for local/dev builds |
| **AI Assistant** | Claude API (claude-sonnet-4-20250514) | Best for financial reasoning and custom user context |
| **Charts** | Recharts (web) + Victory Native (mobile) | Consistent look across both platforms |
| **Authentication** | Supabase Auth | Easy OAuth, social login, free tier |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | EMI reminders, budget alerts |
| **Hosting** | Vercel (web) + Render (backend) | Simple CI/CD, supports Java Spring Boot deployments |

---

## 3. App Screens & Navigation

```
🏠  Dashboard          → Net worth snapshot, today's spend, quick-add button
💸  Expenses           → Log & categorize daily spending
🏦  Loans & EMIs       → All active loans, tick off payments, view progress
📈  Payoff Planner     → AI strategies + graphs + custom context input
📊  Analytics          → Trends, heatmaps, category breakdowns
🔔  Reminders          → Upcoming EMI due dates, budget alerts
⚙️  Settings           → Income setup, budget limits, profile, notifications
```

---

## 4. Core Features

### 4.1 Onboarding Wizard (First-Time Setup)

- Step-by-step guided setup — **one question per screen**
- Questions:
  1. What is your monthly take-home salary?
  2. Do you have any other income? (freelance, rent, returns)
  3. Do you have any active loans or EMIs?
  4. What are your fixed monthly expenses? (rent, groceries, bills)
  5. Set a monthly savings goal
- Plain language throughout — no financial jargon
- Big buttons, emoji icons, example placeholder values in every field
- Pre-filled demo mode so users can see how the app works before entering real data

---

### 4.2 Income Manager

Users can add multiple income sources:

| Field | Description |
|---|---|
| Salary | Monthly fixed take-home |
| Freelance / Side Income | Variable, entered per month |
| Returns / Investments | SIP returns, fixed deposit interest |
| Rental Income | Monthly rental received |
| One-time Bonus | Expected or received bonus |

- All income is aggregated into a **monthly income total**
- Income can be marked as **confirmed** or **expected**

---

### 4.3 Daily Expense Tracker

- Quick-add button always visible (floating action button on mobile)
- Input: amount, category, note (optional), date
- Category icons with emoji for easy recognition:
  - 🍕 Food & Dining
  - 🚗 Transport
  - 💡 Utilities & Bills
  - 🏥 Health
  - 🎮 Entertainment
  - 🛍️ Shopping
  - 📚 Education
  - ✈️ Travel
  - 💰 Savings / Investment
  - 📦 Other
- Voice input option for adding expenses hands-free
- Recurring expense templates (e.g., Netflix every month)
- Edit or delete any past entry

---

### 4.4 EMI & Loan Tracker

Users can add multiple loans. For each loan:

| Field | Example |
|---|---|
| Loan Name | "Home Loan – SBI" |
| Principal Amount | ₹25,00,000 |
| Interest Rate (p.a.) | 8.5% |
| Tenure (months) | 240 |
| EMI Amount | ₹21,700 |
| Start Date | January 2023 |
| Lender | SBI / HDFC / Friend |
| Loan Type | Home / Car / Personal / Credit Card / Education / Other |

- Auto-calculate: remaining balance, months left, total interest remaining
- **Tick-off checkbox** for each EMI — marks it as paid and updates progress bar in real time
- Missed EMI detection — if due date passes without tick, flag it

---

### 4.5 AI-Powered Loan Payoff Planner

This is the flagship feature. Based on the user's income, expenses, and loans, the AI generates **multiple payoff strategies**.

#### Built-in Strategies

| Strategy | How It Works | Best For |
|---|---|---|
| **Avalanche** | Pay highest interest rate loan first | Saving the most money overall |
| **Snowball** | Pay smallest balance loan first | Staying motivated with quick wins |
| **Balanced** | Split extra money proportionally across all loans | Even progress everywhere |
| **Custom** | User defines priority order manually | Full control |

#### For Each Strategy, Show:
- Projected **debt-free date**
- **Total interest saved** vs. paying only minimums
- Month-by-month payment breakdown
- **Line graph**: remaining balance over time per loan
- **Bar chart**: monthly payment split (principal vs. interest)
- **Milestone markers** on the graph: "Loan A cleared! 🎉"

---

### 4.6 Custom AI Context Input

Users can type future financial events in plain English. The AI reads this and recalculates all plans.

**Example inputs the user might type:**
- *"I'm switching jobs in 3 months and expect a 25% salary hike"*
- *"I'm getting ₹80,000 from my FD maturity in June"*
- *"I'll be getting a Diwali bonus of ₹50,000 in October"*
- *"My rent is increasing by ₹3,000 next month"*
- *"I'm planning to prepay ₹1,00,000 on my home loan in March"*

The AI then:
1. Acknowledges the change
2. Shows updated payoff timeline
3. Compares new plan vs. current plan (how many months saved, interest saved)
4. Suggests whether to prepay or invest the lump sum

---

### 4.7 Analytics Dashboard

**Daily Spend View**
- Calendar heatmap — colour-coded by spend intensity
- Day-of-week average spend (e.g., "You spend most on Saturdays")
- Daily budget vs. actual bar

**Monthly View**
- Category-wise pie chart
- Month-over-month comparison bar chart
- Top 3 spending categories with trend arrows
- Biggest single expense of the month

**Annual View**
- Year-at-a-glance heatmap
- Savings rate graph (% of income saved each month)
- Net worth growth line chart

---

### 4.8 Progress Tracking

- **Debt-free countdown**: "You are X months away from being completely debt-free"
- Per-loan **progress bars** that fill up as EMIs are ticked
- **Milestone badges** when a loan is fully paid off
- **Streak counter**: "You've paid your EMIs on time for 6 months in a row 🔥"

---

### 4.9 Budget Alerts & Reminders

- Set monthly budget per category
- Push notification when spending exceeds 80% of category budget
- EMI due date reminders (3 days before, 1 day before, day-of)
- Monthly summary notification (income, spend, savings for the month)

---

## 5. What-If Simulator

A dedicated screen where users can ask:

- *"What if I pay ₹5,000 extra on my car loan every month?"*
- *"What if I prepay ₹2,00,000 on my home loan?"*
- *"What if my salary increases by ₹10,000 next year?"*

The simulator shows two side-by-side graphs: **current plan** vs. **what-if plan**, highlighting the difference in payoff date and total interest.

---

## 6. Additional Features (Phase 2)

| Feature | Description |
|---|---|
| **Export Reports** | PDF or Excel monthly/annual financial summary |
| **Multi-currency** | For users with income or loans in foreign currency |
| **Family / Household Mode** | Shared budget with multiple contributors |
| **Split Expense** | For shared household bills |
| **Investment Tracker** | Track SIP, mutual funds, FD alongside loans |
| **Credit Score Tips** | AI tips for improving credit score based on behavior |
| **Dark Mode** | Essential for mobile users |
| **Offline Mode** | Log expenses without internet; sync when connected |
| **Data Backup** | Google Drive / iCloud backup of all financial data |
| **Widgets** | Android home screen widget for quick expense entry |

---

## 7. UX Principles

1. **One action per screen** — never overwhelm the user with too many fields at once
2. **Always show, never just tell** — every piece of advice must be backed by a graph or number
3. **Confirm before deleting** — never let users accidentally lose financial data
4. **Accessible language** — no jargon; explain any financial term in a tooltip if used
5. **Forgiving inputs** — accept ₹1,200 or 1200 or 1,200.00 all the same way
6. **Progress is visible** — users should feel good every time they tick an EMI

---

## 8. AI Prompt Design

The AI assistant (Claude) receives a structured context object for every query. Here is the template:

```
You are a personal financial advisor helping a user manage expenses and pay off debt.

User Profile:
- Monthly income: ₹{total_income}
- Fixed monthly expenses: ₹{fixed_expenses}
- Variable average monthly spend: ₹{variable_avg}
- Active loans: {loan_list with balance, rate, EMI, months remaining}
- Current payoff strategy: {strategy_name}

User's custom note: "{user_free_text}"

Task: Recalculate the best loan payoff strategy given the above context.
Show: updated debt-free date, total interest saved, month-by-month plan.
Format the response as JSON so graphs can be rendered.
```

---

## 9. Database Schema (H2 + Spring Data JPA)

H2 runs embedded inside the Spring Boot app. Schema is auto-generated from JPA entity classes. The H2 file is stored locally at `./data/expensetracker.db` and can be inspected via the built-in H2 console at `/h2-console` during development.

```
users           → id, name, email, currency, created_at
income_sources  → id, user_id, type, amount, frequency, is_confirmed
expenses        → id, user_id, amount, category, note, date, is_recurring
loans           → id, user_id, name, principal, rate, tenure, emi, start_date, lender, type
emi_payments    → id, loan_id, due_date, paid_date, amount, is_paid
budgets         → id, user_id, category, monthly_limit
ai_contexts     → id, user_id, free_text, created_at
```

**Spring Boot config (application.properties):**
```properties
spring.datasource.url=jdbc:h2:file:./data/expensetracker
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.h2.console.enabled=true
```

> **Note:** H2 is ideal for development and single-server deployments. If the app scales to multiple servers later, migrating to PostgreSQL requires only a config change — all JPA entities remain the same.

---

## 10. Development Phases

### Phase 1 — MVP (8–10 weeks)
- [ ] User auth (sign up, login, Google OAuth)
- [ ] Onboarding wizard
- [ ] Income manager
- [ ] Daily expense logging
- [ ] Loan & EMI tracker with tick-off
- [ ] Basic payoff strategies (Avalanche + Snowball) with graphs
- [ ] Monthly analytics dashboard
- [ ] Web app (React)

### Phase 2 — AI & Mobile (6–8 weeks)
- [ ] Claude AI integration for payoff planner
- [ ] Custom context input (plain English events)
- [ ] What-if simulator
- [ ] Android app (React Native)
- [ ] Push notifications & EMI reminders

### Phase 3 — Polish & Expand (4–6 weeks)
- [ ] Export PDF/Excel reports
- [ ] Offline mode + sync
- [ ] Progress badges and streak tracking
- [ ] Family/household mode
- [ ] Investment tracker
- [ ] Dark mode
- [ ] Android home screen widget

---

## 11. Summary of Recommended Choices

| Decision | Recommendation | Reason |
|---|---|---|
| Language | TypeScript (React + React Native) + Java (Spring Boot) | Type-safe frontend, robust Java backend |
| Mobile Framework | React Native | Share logic with web, single codebase |
| AI Model | Claude Sonnet (claude-sonnet-4-20250514) | Best financial reasoning, handles long user context |
| Charts | Recharts + Victory Native | Works on both platforms, good React integration |
| Database | H2 (embedded, file-based) | Zero-config setup, Spring Boot native support, easy migration to PostgreSQL later |
| Auth | Supabase | Fast setup, built-in OAuth, generous free tier |
| Hosting | Vercel + Render | Easy deploy, CI/CD, affordable |

---

*Plan version 1.0 — Ready for development handoff*
