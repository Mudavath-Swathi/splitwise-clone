# SplitMate — Splitwise Clone

A simplified Splitwise-inspired expense splitting app built with React, Node.js, and PostgreSQL.

## 🌐 Live Demo
- **Frontend**: [https://splitmate.vercel.app](https://splitmate.vercel.app) *(update after deployment)*
- **Backend**: [https://splitmate-api.onrender.com](https://splitmate-api.onrender.com) *(update after deployment)*

---

## 🤖 AI Tool Used
**Claude by Anthropic** (claude.ai) was used as the primary development collaborator throughout this project.

---

## ✨ Features
- 🔐 User registration and login (JWT authentication)
- 👥 Create and manage groups (invite, add, remove members)
- 💰 Add expenses with 4 split types:
  - Equal split
  - Unequal split
  - Percentage split
  - Shares split
- 💬 Real-time group chat on each expense (Socket.io)
- 📊 Group-wise balances and individual balance summary
- 💸 Settle debts and record payments
- 🗑️ Delete expenses
- 👑 Admin-only member management

---

## 🛠️ Tech Stack

### Frontend
- React + Vite + TypeScript
- React Router DOM
- Axios
- Socket.io-client
- Lucide React
- React Hot Toast

### Backend
- Node.js + Express.js
- JWT + bcryptjs
- Socket.io
- PostgreSQL (Neon)

---

## 📁 Project Structure

```
splitwise-clone/
├── frontend/
│   ├── src/
│   │   ├── api/axios.ts
│   │   ├── context/AuthContext.tsx
│   │   ├── components/Sidebar.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── GroupPage.tsx
│   │   │   ├── ExpensePage.tsx
│   │   │   ├── Groups.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Settlements.tsx
│   │   │   ├── Friends.tsx
│   │   │   ├── Balances.tsx
│   │   │   └── Profile.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── groupsController.js
│   │   │   ├── expensesController.js
│   │   │   ├── settlementsController.js
│   │   │   └── commentsController.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── groups.js
│   │   │   ├── expenses.js
│   │   │   ├── settlements.js
│   │   │   └── comments.js
│   │   └── index.js
│   └── package.json
├── AI_CONTEXT.md
├── BUILD_PLAN.md
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- npm
- PostgreSQL database (we used Neon — free at neon.tech)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/splitwise-clone.git
cd splitwise-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/`:
```env
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Run database schema:
- Go to Neon SQL Editor
- Paste contents of `backend/src/config/schema.sql`
- Run it

Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## 🗄️ Database Setup

Run this SQL in your PostgreSQL database:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

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

CREATE TABLE IF NOT EXISTS expense_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  percentage DECIMAL(5,2),
  shares INTEGER,
  is_settled BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  paid_by INTEGER REFERENCES users(id),
  paid_to INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_comments (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Deployment

### Backend → Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `node src/index.js`
6. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel URL)
7. Deploy

### Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set root directory to `frontend`
4. Add environment variables:
   - `VITE_API_URL` (your Render backend URL + /api)
   - `VITE_SOCKET_URL` (your Render backend URL)
5. Deploy

---

## 🧪 Test Accounts
You can register these accounts to test:
- swathi@gmail.com / password123
- shruthi@gmail.com / password123
- priya@gmail.com / password123
- karan@gmail.com / password123
- meera@gmail.com / password123

---

## 📝 Key Prompts Used

1. "Build a Splitwise clone with React frontend and Node.js backend using PostgreSQL"
2. "Fix the balance calculation — balances should always sum to zero"
3. "The Paid/Owes status is showing wrong for some members in shares split"
4. "Add real-time chat using Socket.io for each expense"
5. "Add a Members tab visible only to admin with ability to remove members"
6. "Fix the settle up auto-fill — amount should pre-populate based on what the user owes"

---

## ⚠️ Known Limitations
1. No email verification
2. No password reset
3. No expense editing (delete and re-create)
4. Currency fixed to ₹ Indian Rupee
5. Shares must be whole numbers
6. No notification system

---

## 👩‍💻 Developer
Built by **Swathi** as part of a Full Stack Engineering Internship assignment.
AI Collaborator: **Claude by Anthropic** (claude.ai)