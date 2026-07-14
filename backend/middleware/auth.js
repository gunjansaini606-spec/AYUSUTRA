const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ status: 'error', message: 'Access Denied: Missing auth context header.' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET || 'SUPER_SECRET_PRODUCTION_KEY');
            req.user = verified;

            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ status: 'error', message: 'Forbidden: Insufficient clearing privileges.' });
            }

            next();
        } catch (err) {
            return res.status(400).json({ status: 'error', message: 'Malformed cryptographic signature.' });
        }
    };
};