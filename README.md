# 📄 CV Scanner SaaS

**AI-Powered Resume Screening for HR Professionals**

A complete SaaS application that scans and analyzes CVs/resumes against job descriptions using Google's Gemini AI. Built with Node.js, React, and MySQL.

---

## ✨ Features

### Core Functionality
- **📤 Upload CVs** — Supports PDF and DOCX format (max 5MB)
- **🤖 AI-Powered Analysis** — Uses Google Gemini 1.5 Flash (FREE tier)
- **📊 Match Scoring** — Percentage match with detailed breakdown
- **📋 Skills Analysis** — Matched, partial, and missing skills identification
- **📝 Interview Questions** — AI-generated targeted interview questions per candidate
- **📁 Job Management** — Save and manage job descriptions for reuse

### User Experience
- **🏠 Dashboard** — Overview with stats, recent scans, and quick actions
- **📜 History** — Full scan history with search, filter, and pagination
- **🔍 Detailed Results** — Comprehensive candidate analysis page
- **📱 Responsive** — Works on desktop and mobile

### Security
- **🔐 JWT Auth** — httpOnly cookies + token rotation
- **🚫 SQL Injection Proof** — All queries use parameterized statements
- **🛡️ XSS Protection** — Input sanitization with `xss` library
- **⏱️ Rate Limiting** — Protects against brute force and API abuse
- **🔒 Helmet** — Security headers
- **🔑 Password Hashing** — bcrypt with cost factor 12

### Admin Panel
- **📊 System Dashboard** — User/job/scan statistics
- **👥 User Management** — Activate/deactivate users, change roles
- **📈 Activity Graphs** — Scan trends over time

---

## 🏗️ Architecture

```
cv-scanner/
├── backend/                  # Node.js + Express API
│   ├── config/               # Database & Gemini config
│   ├── middleware/            # Auth, validation, rate limiting
│   ├── models/               # Database models (User, Job, Candidate)
│   ├── routes/               # API routes
│   ├── services/             # Business logic (CV parsing, Gemini)
│   ├── migrations/           # Database schema & migration runner
│   ├── uploads/              # Temporary CV file storage
│   ├── server.js             # Entry point
│   └── .env                  # Environment variables
│
└── frontend/                 # React + Vite + Tailwind CSS
    ├── src/
    │   ├── components/       # Reusable UI components
    │   ├── contexts/         # AuthContext (JWT management)
    │   ├── pages/            # All application pages
    │   └── utils/            # API helper
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **MySQL** 8+
- **Google Gemini API Key** (free — get one at [makersuite.google.com](https://makersuite.google.com/app/apikey))

### 1. Clone & Install

```bash
cd cv-scanner

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE cv_scanner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configure Environment

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cv_scanner
DB_USER=root
DB_PASSWORD=your_mysql_password

GEMINI_API_KEY=your-gemini-api-key-here
```

### 4. Run Database Migration

```bash
cd backend
npm run migrate
```

This creates all tables and the default admin account:
- **Email:** admin@cvscanner.com
- **Password:** Admin@12345

### 5. Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Server starts at http://localhost:5000

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
App opens at http://localhost:5173

### 6. Login

Open http://localhost:5173 and login with:
- **Admin:** admin@cvscanner.com / Admin@12345
- **User:** Register a new account

---

## 🧠 AI Model: Google Gemini 1.5 Flash

The application uses **Gemini 1.5 Flash** — the best **FREE** LLM option for this use case:

| Feature | Gemini 1.5 Flash |
|---------|-----------------|
| **Free Tier** | ✅ Yes — no credit card needed |
| **Requests/Day** | 1,500 free requests |
| **Rate Limit** | 60 requests per minute |
| **Context Window** | 1,048,576 tokens (handles large CVs) |
| **Speed** | Fast — <5 seconds per analysis |
| **Output** | Structured JSON supported |
| **Quality** | Excellent at structured analysis |

### Getting Your API Key
1. Go to https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Copy the key and paste it in `backend/.env` as `GEMINI_API_KEY`

### Alternative Free Models
| Model | Provider | Free Tier | Notes |
|-------|----------|-----------|-------|
| **Gemini 1.5 Flash** | Google | 1500/day | ✅ Recommended |
| **Gemini 1.5 Pro** | Google | 50/day | Higher quality, slower |
| **Llama 3.1 70B** | Groq | 30/min | Fast, needs Groq API key |
| **Mistral 7B** | Replicate | Limited | Smaller model, less accurate |

---

## 🔒 Security Architecture

### SQL Injection Prevention
Every database query uses `mysql2`'s **parameterized statements** with `?` placeholders. User input is NEVER concatenated into SQL strings:

```javascript
// ✅ SAFE — parameterized query
await pool.execute('SELECT * FROM users WHERE email = ?', [userEmail]);

// ❌ UNSAFE — never used in this codebase
await pool.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### Authentication Flow
1. User logs in → server validates credentials
2. Server generates **access token** (1hr) + **refresh token** (7 days)
3. Tokens stored in **httpOnly cookies** (not accessible to JavaScript)
4. Refresh token is **one-time use** (rotated on each refresh)
5. Old refresh tokens are **revoked** in database

### Additional Security
- **Input validation** on every endpoint
- **XSS sanitization** via `xss` package
- **Rate limiting** on auth (10/15min) and scan (30/hour) endpoints
- **Helmet** HTTP security headers
- **CORS** with explicit origin whitelist
- **bcrypt** password hashing (cost factor 12)
- **File upload validation** (type, size)
- **Cookie security** (httpOnly, secure, sameSite)

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh-token` | Refresh JWT |
| GET | `/api/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List user's jobs |
| GET | `/api/jobs/active` | List active jobs |
| GET | `/api/jobs/:id` | Get job details |
| POST | `/api/jobs` | Create job |
| PUT | `/api/jobs/:id` | Update job |
| PATCH | `/api/jobs/:id/toggle` | Toggle active status |
| DELETE | `/api/jobs/:id` | Delete job |

### Candidates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | List candidates |
| GET | `/api/candidates/stats` | Get user statistics |
| GET | `/api/candidates/:id` | Get candidate details |
| POST | `/api/candidates/:id/generate-questions` | Generate interview questions |

### Scanning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Upload and scan CV |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Admin dashboard data |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/toggle-active` | Toggle user status |
| PATCH | `/api/admin/users/:id/role` | Change user role |
| GET | `/api/admin/candidates` | All candidates (admin) |
| GET | `/api/admin/scans-over-time` | Scan trend data |

---

## 📊 Scoring System

The AI evaluates candidates on 4 dimensions:

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Skills Match** | 40% | Direct & partial skill matches |
| **Experience** | 30% | Relevance of experience level |
| **Education** | 15% | Educational requirements |
| **Overall Fit** | 15% | Holistic assessment |

**Recommendation Thresholds:**
- **Shortlist** — 80%+ match
- **Consider** — 60-79% match
- **Reject** — Below 60%

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router 6 |
| **Backend** | Node.js, Express 4 |
| **Database** | MySQL 8+ (via mysql2 with prepared statements) |
| **AI** | Google Gemini 1.5 Flash (free) |
| **Auth** | JWT with httpOnly cookies + refresh token rotation |
| **Security** | Helmet, CORS, bcrypt, express-rate-limit, XSS sanitization |
| **File Parsing** | pdf-parse (PDF), mammoth (DOCX) |

---

## 📝 License

MIT — Free for personal and commercial use.

---

## ⚠️ Production Notes

Before deploying to production:
1. Set `NODE_ENV=production` in `.env`
2. Use strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Enable HTTPS (required for secure cookies)
4. Set `FRONTEND_URL` to your actual frontend domain
5. Configure a production-grade MySQL instance
6. Set up proper file storage (S3/Cloudinary) instead of local uploads
7. Enable database backup schedule
8. Upgrade to a paid Gemini/Claude API plan for higher volume
