require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./src/routes/auth.routes');
const companyRoutes = require('./src/routes/company.routes');
const employeeRoutes = require('./src/routes/employee.routes');
const documentRoutes = require('./src/routes/document.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const salaryRoutes    = require('./src/routes/salary.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/salary',   salaryRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Doc Software API is running', version: '1.0.0' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
