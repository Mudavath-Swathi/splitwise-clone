# AI_CONTEXT.md — SplitMate (Splitwise Clone)

## Project Overview
SplitMate is a simplified Splitwise-inspired expense splitting app built as an internship assignment. The app was built using Claude (Anthropic) as the primary AI development collaborator over 2 days.

---

## Product Understanding

### What is Splitwise?
Splitwise is an app that helps groups of people track shared expenses and settle debts. When friends go on a trip, share a house, or split bills, Splitwise tracks who paid what and calculates who owes who.

### Core Problem Solved
When multiple people share expenses, it's hard to track who paid what and who owes who. SplitMate solves this by:
1. Tracking all expenses in a group
2. Automatically calculating balances
3. Suggesting who should pay who to settle debts
4. Recording payments when debts are settled

---

## Product Scope (MVP)

### In Scope
- User registration and login with JWT authentication
- Create and manage groups (invite, add, remove members)
- Add expenses with 4 split types (equal, unequal, percentage, shares)
- Real-time group chat on each expense using Socket.io
- Group-wise balance calculation
- Individual balance summary across all groups
- Settle debts and record payments
- Settlements history

### Out of Scope
- Email notifications
- Profile picture upload
- Multiple currencies
- Export to CSV/PDF
- Mobile app
- Friend requests system
- Recurring expenses
- Bill scanning

---

## User Personas
1. **Trip organizer** (Swathi) — creates group, adds expenses, tracks who owes
2. **Group member** (Shruthi, Priya, Karan, Meera) — views balances, settles debts
3. **Admin** — only the group creator can remove members

---

## Tech Stack

### Frontend
- React + Vite + TypeScript
- React Router DOM (client-side routing)
- Axios (API calls with JWT interceptor)
- Socket.io-client (real-time chat)
- Lucide React (icons)
- React Hot Toast (notifications)
- Inline styles (Tailwind v4 had loading issues)
- Inter font from Google Fonts

### Backend
- Node.js + Express.js
- JWT authentication (jsonwebtoken + bcryptjs)
- Socket.io (real-time WebSocket)
- pg (PostgreSQL client)
- express-validator (input validation)
- cors, dotenv, nodemon

### Database
- PostgreSQL on Neon (serverless, AWS Asia Pacific Singapore)

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon (already cloud-hosted)

---

## Database Schema

```sql
-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- GROUPS TABLE
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  paid_by INTEGER REFERENCES users(id),
  split_type VARCHAR(20) NOT NULL CHECK (split_type IN ('equal','unequal','percentage','shares')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXPENSE SPLITS TABLE
CREATE TABLE IF NOT EXISTS expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2),
  shares INTEGER,
  is_settled BOOLEAN DEFAULT FALSE
);

-- SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  paid_by INTEGER REFERENCES users(id),
  paid_to INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXPENSE COMMENTS (CHAT) TABLE
CREATE TABLE IF NOT EXISTS expense_comments (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Design

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Register new user |
| POST | /login | Login, returns JWT |
| GET | /profile | Get current user profile |
| GET | /search?q= | Search users by name/email |

### Group Routes (`/api/groups`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create group |
| GET | / | Get my groups |
| GET | /:id | Get single group with members |
| POST | /:id/members | Add member to group |
| DELETE | /:id/members/:userId | Remove member from group |
| GET | /:id/balances | Get group balances |

### Expense Routes (`/api/expenses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create expense with splits |
| GET | /group/:group_id | Get group expenses |
| GET | /:id | Get single expense with splits |
| DELETE | /:id | Delete expense (creator only) |
| GET | /my-balances | Get overall balance summary |

### Settlement Routes (`/api/settlements`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Record a settlement |
| GET | /group/:group_id | Get group settlements |
| GET | /all | Get all settlements across groups |

### Comment Routes (`/api/comments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Add comment to expense |
| GET | /:expense_id | Get expense comments |

---

## Frontend Structure

```
frontend/src/
├── api/
│   └── axios.ts              # Axios instance with JWT interceptor
├── context/
│   └── AuthContext.tsx       # User auth state, login/logout
├── components/
│   └── Sidebar.tsx           # Desktop + mobile responsive sidebar
├── pages/
│   ├── Login.tsx             # Login page
│   ├── Register.tsx          # Register page
│   ├── Dashboard.tsx         # Balance cards, groups list
│   ├── GroupPage.tsx         # Group detail with tabs
│   ├── ExpensePage.tsx       # Expense detail + real-time chat
│   ├── Groups.tsx            # All groups list
│   ├── Expenses.tsx          # All expenses across groups
│   ├── Settlements.tsx       # All settlements
│   ├── Friends.tsx           # Friends from group members
│   ├── Balances.tsx          # Balance summary across groups
│   └── Profile.tsx           # Profile and settings
├── App.tsx                   # Routes
└── main.tsx                  # Entry point
```

---

## Key Implementation Decisions

### Balance Calculation Logic
Balances are calculated in the backend (`getGroupBalances`):
1. For each member, start with balance = 0
2. For each expense split: if not settled and payer ≠ splitter → payer gets +amount, splitter gets -amount
3. For each settlement: paid_by gets +amount, paid_to gets -amount
4. Result: positive balance = gets back money, negative = owes money

### Split Type Logic
- **Equal**: amount ÷ number of people, remainder goes to first person
- **Unequal**: manually entered amounts, remainder adjustment on last person
- **Percentage**: (percentage / 100) × total amount
- **Shares**: (person_shares / total_shares) × total amount

### is_settled Flag
When an expense is created, the payer's split is marked `is_settled = true` automatically. This means the payer doesn't owe themselves. Critical bug fixed: `paid_by` must be parsed as `parseInt()` before comparison.

### Real-time Chat
Socket.io rooms are used per expense. When user opens an expense, they join the room `join_expense`. Messages are emitted to the room and all members receive them instantly.

### JWT Authentication
- Token stored in localStorage
- Axios interceptor adds `Authorization: Bearer <token>` to all requests
- Backend middleware verifies token on protected routes

---

## Bugs Fixed During Development

### Bug 1: Balance ID was null
- **Root cause**: `getGroupBalances` returned `{ name, balance }` without `id`
- **Fix**: Changed to `{ id: m.id, name: m.name, balance: 0 }`
- **File**: `groupsController.js`

### Bug 2: Paid/Owes showing incorrectly
- **Root cause**: `split.user_id === paid_by` — type mismatch (number vs string)
- **Fix**: `const paidById = parseInt(paid_by)` then `split.user_id === paidById`
- **File**: `expensesController.js`

### Bug 3: ₹1-3 rounding in splits
- **Root cause**: Floating point arithmetic
- **Fix**: `Math.round(x * 100) / 100` throughout, remainder adjustment on last person
- **File**: `expensesController.js`

### Bug 4: Settle Up amount not auto-filling
- **Root cause**: Balance `id` coming as string from backend
- **Fix**: Parse balances on frontend: `id: Number(b.id), balance: parseFloat(b.balance)`
- **File**: `GroupPage.tsx`

### Bug 5: Neon DB connection crash on idle
- **Fix**: Removed `pool.connect()` test, added `pool.on('error')` handler
- **File**: `db.js`

---

## Frontend Routing

```
/ → Dashboard (private)
/login → Login
/register → Register
/groups → All groups (private)
/groups/:id → Group detail (private)
/expenses → All expenses (private)
/expenses/:id → Expense detail + chat (private)
/settlements → All settlements (private)
/friends → Friends list (private)
/balances → Balance summary (private)
/profile → Profile (private)
/settings → Settings (same as profile)
```

---

## Testing Plan

### Manual Test Cases
1. Register 5 users: swathi, shruthi, priya, karan, meera
2. Login as swathi, create group "Europe Trip"
3. Invite all 4 members
4. Add 4 expenses covering all split types:
   - Equal: ₹3,00,000 paid by Swathi
   - Unequal: ₹1,75,000 paid by Shruthi
   - Percentage: ₹5,00,000 paid by Priya
   - Shares: ₹8,40,000 paid by Karan
5. Verify balances add to ₹0
6. Login as each member, test Settle Up auto-fill
7. Record settlements, verify balances update
8. Test real-time chat in expense
9. Test delete expense
10. Test remove member (admin only)

### Balance Verification Formula
Sum of all balances must always = ₹0
`Σ(paid - share) = 0` for all members

---

## Known Limitations

1. No email verification on registration
2. No password reset functionality
3. Settle Up only auto-suggests one creditor (the one with highest positive balance)
4. No way to edit an expense (must delete and re-create)
5. No notification system (email/push)
6. Currency fixed to Indian Rupee (₹)
7. No image upload for receipts
8. Socket.io uses localhost URL hardcoded — needs update for production
9. Shares column stored as INTEGER (not DECIMAL) — shares must be whole numbers

---

## Trade-offs Made

| Decision | What we chose | What we avoided | Why |
|----------|---------------|-----------------|-----|
| Styling | Inline styles | Tailwind v4 | Tailwind v4 had loading issues |
| Auth | JWT in localStorage | Session cookies | Simpler for SPA |
| Real-time | Socket.io | Polling | Better UX |
| DB | Neon (serverless) | Local PostgreSQL | No setup needed |
| Hosting | Render + Vercel | AWS/GCP | Free tier available |

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Deployment Plan

### Backend → Render
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Set environment variables
5. Deploy

### Frontend → Vercel
1. Push code to GitHub
2. Import project on Vercel
3. Set VITE_API_URL to Render backend URL
4. Deploy

### After Deployment
- Update Socket.io URL in ExpensePage.tsx to production URL
- Update CORS in backend to allow Vercel domain

---

## AI Collaboration Notes

- **AI used**: Claude (Anthropic) — claude.ai
- **Approach**: Claude acted as junior engineer, building features step by step
- **Context maintained**: This AI_CONTEXT.md file
- **Key decisions made by developer**: Tech stack, UI design, split logic
- **Key code written by AI**: All components, controllers, routes, schema
- **Bugs found**: Through manual testing with real data
- **Iterations**: Multiple bug fixes through console debugging and DB queries