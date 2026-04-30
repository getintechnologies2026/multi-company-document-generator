# Multi-Company Document Generator

A full-stack web application to generate **Offer Letters, Payslips, Experience Letters, and Relieving Letters** for multiple companies from a single dashboard.

## Tech Stack
- **Frontend:** React.js + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL
- **PDF Engine:** Puppeteer
- **Auth:** JWT

## Project Structure
```
Document Software/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   ├── models/       # DB models
│   │   ├── middleware/   # Auth & validation
│   │   ├── templates/    # HTML doc templates
│   │   └── utils/        # PDF generator, helpers
│   ├── uploads/          # Logos, signatures
│   ├── generated/        # Generated PDFs
│   └── server.js
├── frontend/             # React app
│   └── src/
│       ├── pages/        # Dashboard, Login, Generate, etc.
│       ├── components/   # Reusable UI
│       ├── services/     # API calls
│       └── context/      # Auth context
└── database/
    └── schema.sql        # MySQL schema
```

## Setup Instructions

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
# Edit .env with your DB credentials
npm run dev
```
Backend runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

## Default Login
- Email: `admin@docsoft.com`
- Password: `admin123`

## Features
- [x] Multi-company support
- [x] Employee management (CRUD + bulk import)
- [x] 4 document types: Offer Letter, Payslip, Experience Letter, Relieving Letter
- [x] PDF generation with company letterhead, logo, signature
- [x] Document history & re-download
- [x] Role-based access (Admin / HR / Viewer)
- [x] Dashboard with analytics
