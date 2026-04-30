const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid or expired token' });
        req.user = decoded;
        next();
    });
};

exports.requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};
