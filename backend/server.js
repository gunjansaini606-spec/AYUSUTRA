const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();

// Secure Layer Implementation (Production Best Practices)
app.use(helmet());
app.use(cors({ origin: '*' })); // Custom configure to tighten cross domain access paths
app.use(express.json());

// Application DDoS Mitigation Layer
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, 
    message: 'Too many functional query cycles originated from this network adapter routing address.'
});
app.use('/api/', apiLimiter);

// Operational Base Routing Handlers
app.use('/api', apiRoutes);

// Catch-All Structural Safe Exception Pipeline
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Unhandled kernel platform anomaly detected.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`AyurSutra Enterprise System initialized on networking address context port: ${PORT}`);
});