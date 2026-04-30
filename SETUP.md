# Setup Guide — Document Software

## Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **MySQL** 5.7+ or 8.x ([download](https://dev.mysql.com/downloads/installer/))
- **Git** (optional)

## Step 1 — Database Setup

1. Open MySQL command line or Workbench.
2. Run the schema file:
```bash
mysql -u root -p < "C:/Document Software/database/schema.sql"
```
Or paste contents of `database/schema.sql` into Workbench and execute.

3. Generate a real bcrypt password hash for the admin user (the seed hash is a placeholder):
```bash
cd "C:/Document Software/backend"
npm install
node -e "console.log(require('bcryptjs').hashSync('admin123', 10))"
```
Copy the output and run in MySQL:
```sql
USE doc_software;
UPDATE users SET password='<paste_hash_here>' WHERE email='admin@docsoft.com';
```

## Step 2 — Backend

```bash
cd "C:/Document Software/backend"
copy .env.example .env
```
Edit `.env` with your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=doc_software
JWT_SECRET=any_long_random_string
```

Install & run:
```bash
npm install
npm run dev
```
Backend → http://localhost:5000

> **Note:** First `npm install` will download Puppeteer (~170 MB Chromium). This is one-time.

## Step 3 — Frontend

In a new terminal:
```bash
cd "C:/Document Software/frontend"
npm install
npm run dev
```
Frontend → http://localhost:5173

## Step 4 — Login

Open http://localhost:5173 and log in with:
- Email: `admin@docsoft.com`
- Password: `admin123`

## Step 5 — First-Time Workflow

1. **Add a Company** → Companies → Add Company (upload logo, signature, stamp)
2. **Add Employees** → Employees → Add Employee (fill basic, job, salary, bank tabs)
3. **Generate Document** → Generate Doc → pick type → select company & employee → Generate
4. **View History** → Documents (download / re-print any time)

## Folder Structure
```
Document Software/
├── backend/          Node.js + Express API
├── frontend/         React + Vite + Tailwind
├── database/         schema.sql
├── README.md
└── SETUP.md
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET/POST/PUT/DELETE | /api/companies | Companies CRUD |
| GET/POST/PUT/DELETE | /api/employees | Employees CRUD |
| GET | /api/documents | List documents |
| POST | /api/documents/generate | Generate PDF |
| GET | /api/documents/:id/download | Download PDF |
| GET | /api/dashboard/stats | Dashboard stats |

## Troubleshooting

**Puppeteer fails to launch on Windows**
Add to `pdfGenerator.js` `launch()` options: `executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'`

**MySQL access denied**
Make sure user has privileges: `GRANT ALL ON doc_software.* TO 'root'@'localhost';`

**Port already in use**
Change `PORT=5000` in `backend/.env` and update `vite.config.js` proxy target.

**Logo/signature not appearing in PDF**
Ensure files were uploaded successfully — check `backend/uploads/` folder. The PDF generator references them via absolute file paths.

## Production Build

```bash
# Frontend
cd frontend
npm run build      # creates dist/ folder

# Backend (just run prod)
cd backend
npm start
```
Serve `frontend/dist` via Nginx and proxy `/api`, `/uploads`, `/generated` to backend.
