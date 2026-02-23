# Web-Based Digital Culture Pledge System

A full-stack web application that enables employees to digitally sign and manage organizational culture pledges, with email OTP login, PDF certificate generation, and automated email reminders.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS v4 |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | Email OTP + JWT |
| PDF Generation | Puppeteer |
| Email | Nodemailer |
| Scheduler | Node-Cron |

## 📁 Project Structure

```
digital-pledge/
├── .env                        # Environment variables
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── api/                # Axios instance
│       ├── components/         # Navbar, Sidebar, ProtectedRoute
│       ├── context/            # AuthContext
│       ├── layouts/            # AppLayout
│       └── pages/              # Login, OTP, Dashboard, Pledge, Admin
└── server/                     # Node.js backend
    ├── index.js                # Entry point
    ├── config/db.js            # PostgreSQL connection
    ├── controllers/            # authController, pledgeController
    ├── middleware/             # JWT authMiddleware
    ├── models/initDb.js        # DB schema (auto-created)
    ├── routes/                 # authRoutes, pledgeRoutes
    └── utils/                  # emailUtil, pdfUtil, cronJobs
```

## ⚙️ Setup & Configuration

### 1. Configure Environment
Edit `.env` in the project root:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_pledge
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_super_secret_jwt_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Digital Pledge System <your_email@gmail.com>"
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 2. Create PostgreSQL Database
```sql
CREATE DATABASE digital_pledge;
```
> Tables are auto-created when the server starts.

### 3. Install Dependencies
```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 4. Run the Application
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

## 🔑 Key Features

- **Email OTP Login** — No passwords. Get a 6-digit code emailed, valid 10 minutes.
- **Pledge Management** — Sign culture pledges with selectable commitment statements.
- **PDF Certificates** — Download official pledge certificates as styled PDF files.
- **Admin Panel** — Review, approve, or reject pledges with optional admin notes.
- **Cron Scheduler** — Daily reminders at 8am for users with pending pledges.
- **Responsive UI** — Fully responsive for desktop, tablet, and mobile.

## 🛠️ Making a User Admin

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourcompany.com';
```

## 🔒 Security

- OTPs are hashed with bcryptjs before storage
- Rate limiting on auth endpoints (10 req / 15 min)
- JWT tokens expire in 7 days
- Admin routes protected by role middleware
