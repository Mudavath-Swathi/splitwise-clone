# BUILD_PLAN.md — SplitMate (Splitwise Clone)

## 1. Product Research

### How I Studied Splitwise
- Used the Splitwise app personally to understand core workflows
- Studied how expenses are added, split, and settled
- Identified the 4 split types: equal, unequal, percentage, shares
- Observed how balances are calculated and displayed
- Noted the real-time chat feature on each expense
- Studied the settlement flow — who pays who and how much

### What I Learned
- Splitwise is fundamentally a debt tracking app, not a payment app
- The core logic is: balance = amount paid - share owed
- Balances always sum to zero across all group members
- Settlements don't actually move money — they just record that payment happened
- The payer of an expense is automatically marked as "settled" for their own share
- Groups are the core unit — everything happens inside a group

### Core Workflows Identified
1. **Register/Login** → access the app
2. **Create Group** → invite friends
3. **Add Expense** → choose who paid, how to split
4. **View Balances** → see who owes who
5. **Settle Up** → record payment, balances update
6. **Chat** → discuss expense details in real-time

### Product Assumptions Made
- Only one currency (₹ Indian Rupee)
- Group creator is always admin
- Only admin can remove members
- Expenses cannot be edited (only deleted and re-created)
- Settlements are manual (no actual payment processing)
- No email verification required for registration

---

## 2. Architecture

### Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React + Vite + TypeScript | Fast, modern, type-safe |
| Styling | Inline styles | Tailwind v4 had loading issues |
| Routing | React Router DOM | Industry standard SPA routing |
| API Client | Axios | JWT interceptor support |
| Real-time | Socket.io | WebSocket abstraction |
| Icons | Lucide React | Clean, lightweight |
| Backend | Node.js + Express | Fast REST API |
| Auth | JWT + bcryptjs | Stateless authentication |
| Database | PostgreSQL on Neon | Relational, serverless, free |
| Deployment | Render + Vercel | Free tier, easy setup |

### Database Schema

7 tables:
- **users** — stores user accounts
- **groups** — stores group info
- **group_members** — many-to-many: users ↔ groups with role
- **expenses** — stores each expense
- **expense_splits** — stores each person's share per expense
- **settlements** — records payments between members
- **expense_comments** — stores chat messages per expense

Key design decisions:
- `expense_splits.is_settled` tracks if a person's share is settled
- `expense_splits.shares` stores share count for shares split type
- `settlements` are separate from splits — settling doesn't mark splits as settled, balance is recalculated from both tables

### Balance Calculation Algorithm
```
For each member in group:
  balance = 0
  
For each expense split:
  if not settled AND payer ≠ splitter:
    payer.balance += split.amount    (they get back money)
    splitter.balance -= split.amount (they owe money)

For each settlement:
  payer.balance += settlement.amount  (they paid, so they get credit)
  receiver.balance -= settlement.amount (they received, so they owe less)

Result: positive = gets back, negative = owes
Rule: Sum of all balances = 0 always
```

### API Design
RESTful API with 5 route groups:
- `/api/auth` — register, login, profile, search
- `/api/groups` — CRUD groups, manage members, get balances
- `/api/expenses` — CRUD expenses, splits, balance summary
- `/api/settlements` — record and view payments
- `/api/comments` — expense chat messages

### Frontend Structure
- **Pages**: Dashboard, GroupPage, ExpensePage, Groups, Expenses, Settlements, Friends, Balances, Profile
- **Components**: Sidebar (desktop + mobile responsive)
- **Context**: AuthContext (user state, token management)
- **API**: Axios instance with JWT interceptor

### Deployment Approach
- Backend → Render (Node.js web service, free tier)
- Frontend → Vercel (static site, free tier)
- Database → Neon (already cloud-hosted PostgreSQL)

---

## 3. AI Collaboration Process

### How I Instructed the AI
- Used Claude (claude.ai) as the primary development collaborator
- Gave requirements one feature at a time
- Shared screenshots when UI issues occurred
- Pasted error messages and console logs for debugging
- Asked Claude to explain logic before implementing
- Verified calculations manually against expected values

### How the Build Progressed

**Day 1: Setup and Core Features**
1. Set up backend: Express + PostgreSQL + JWT auth
2. Created all 7 database tables
3. Built auth routes (register, login)
4. Built group routes (create, invite members)
5. Built expense routes (create with all 4 split types)
6. Set up React + Vite frontend
7. Built Login, Register, Dashboard pages

**Day 2: Features + Bug Fixes**
1. Built GroupPage with 4 tabs (overview, expenses, balances, settlements)
2. Built ExpensePage with real-time Socket.io chat
3. Fixed balance ID null bug (major bug)
4. Fixed Paid/Owes type mismatch bug
5. Fixed rounding bug (₹1-3 difference)
6. Fixed Settle Up auto-fill not working
7. Added delete expense feature
8. Added Members tab with remove member (admin only)
9. Built Balances, Profile, Settings pages
10. Verified all 4 split types with large real-world amounts

### Key Questions Asked to AI
- "How should balance calculation work?"
- "Why is Karan showing Paid when he didn't pay?"
- "Why is Meera showing ₹2999 instead of ₹3000?"
- "Why is the settle up amount not auto-filling?"
- "What is is_settled and how does it work?"

### How the Plan Evolved
- Originally planned Tailwind CSS → switched to inline styles (Tailwind v4 loading issues)
- Originally no delete expense → added after testing with wrong data
- Originally no Members tab → added for remove member feature
- Balance calculation was refined multiple times based on testing
- Settle Up auto-fill required 3 iterations to fix properly

### How AI_CONTEXT.md Was Maintained
- Updated after every major feature was built
- Updated every time a bug was fixed
- Updated when architecture decisions changed
- Final version reflects the complete working codebase

---

## 4. Trade-offs

### What We Simplified
- **No email verification** — register directly without confirming email
- **No password reset** — users cannot recover forgotten passwords
- **No expense editing** — must delete and re-create to fix mistakes
- **Single currency** — only Indian Rupee (₹), no currency conversion
- **Simple settlement** — settle full amount only (no partial suggested)
- **No friend system** — friends are derived from group members only

### What We Hardcoded
- Currency symbol ₹
- Primary color #16a34a (green)
- Socket.io URL (localhost for dev, needs env var for production)
- JWT expiry (7 days)
- Avatar colors (array of 6 colors based on first letter)

### What We Avoided
- Email/push notifications
- Receipt scanning
- Export to PDF/CSV
- Multiple currencies
- Recurring expenses
- Payment processing (Razorpay/Stripe)
- Mobile app
- Admin dashboard

### What We Would Improve With More Time
1. **Edit expense** — allow modifying description, amount, splits
2. **Expense categories** — food, travel, accommodation etc.
3. **Simplify debts** — minimize number of transactions to settle
4. **Push notifications** — notify when added to group or expense
5. **Receipt upload** — photo of bill attached to expense
6. **Export** — download group expenses as CSV/PDF
7. **Password reset** — email-based password recovery
8. **Profile pictures** — user avatar upload
9. **Multiple currencies** — with conversion rates
10. **Partial settlements** — settle part of what you owe

---

## 5. Testing Summary

### Test Group: "Europe Trip"
Members: Swathi, Shruthi, Priya, Karan, Meera

| Expense | Amount | Paid By | Split Type | Result |
|---------|--------|---------|-----------|--------|
| Hotel Paris | ₹3,00,000 | Swathi | Equal | ✅ ₹60,000 each |
| Shopping | ₹1,75,000 | Shruthi | Unequal | ✅ Custom amounts |
| Flight Tickets | ₹5,00,000 | Priya | Percentage | ✅ By % |
| Luxury Cruise | ₹8,40,000 | Karan | Shares | ✅ By ratio |

### Final Verified Balances
| Member | Balance | Status |
|--------|---------|--------|
| Swathi | -₹1,50,000 | Owes ✅ |
| Shruthi | -₹1,50,000 | Owes ✅ |
| Priya | +₹2,20,000 | Gets back ✅ |
| Karan | +₹3,15,000 | Gets back ✅ |
| Meera | -₹2,35,000 | Owes ✅ |
| **Sum** | **₹0** | **✅** |

### Features Tested
- ✅ Register and login (5 users)
- ✅ Create group and invite all members
- ✅ Add expenses with all 4 split types
- ✅ Balance calculation verified correct
- ✅ Settle Up auto-fills amount and recipient
- ✅ Settlement recorded and balances updated
- ✅ Real-time chat working between users
- ✅ Delete expense working
- ✅ Remove member working (admin only)
- ✅ Dashboard showing correct totals
- ✅ Balances page showing all groups
- ✅ Settlements page showing history