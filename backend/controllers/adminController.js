const db = require('../config/db');

exports.getSystemMetrics = async (req, res) => {
    try {
        const [[patientsCount]] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [[doctorsCount]] = await db.query('SELECT COUNT(*) as count FROM doctors');
        const [[apptsCount]] = await db.query('SELECT COUNT(*) as count FROM appointments');
        const [[revenueSum]] = await db.query('SELECT SUM(amount) as total FROM payments WHERE payment_status="paid"');

        const [therapyDist] = await db.query(`
            SELECT t.name, COUNT(a.id) as volumes FROM appointments a 
            JOIN therapies t ON a.therapy_id = t.id GROUP BY t.id
        `);

        res.status(200).json({
            status: 'success',
            metrics: {
                patients: patientsCount.count,
                doctors: doctorsCount.count,
                appointments: apptsCount.count,
                revenue: revenueSum.total || 0.00
            },
            distribution: therapyDist
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};