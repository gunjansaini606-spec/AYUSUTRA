const db = require('../config/db');

exports.updatePatientProfile = async (req, res) => {
    try {
        const { height, weight, blood_pressure, medical_conditions, allergies, lifestyle, sleep_pattern, stress_level, diet_type } = req.body;
        const patientId = req.user.profileId;

        const hMeters = parseFloat(height) / 100;
        const bmi = (parseFloat(weight) / (hMeters * hMeters)).toFixed(2);

        await db.query(
            `UPDATE patients SET height=?, weight=?, bmi=?, blood_pressure=?, medical_conditions=?, allergies=?, 
             lifestyle=?, sleep_pattern=?, stress_level=?, diet_type=? WHERE id=?`,
            [height, weight, bmi, blood_pressure, medical_conditions, allergies, lifestyle, sleep_pattern, stress_level, diet_type, patientId]
        );

        res.status(200).json({ status: 'success', message: 'Vitals profile synchronized.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getPatientData = async (req, res) => {
    try {
        const id = req.params.id || req.user.profileId;
        const [profile] = await db.query(`
            SELECT p.*, u.name, u.email FROM patients p 
            JOIN users u ON p.user_id = u.id WHERE p.id = ?`, [id]);
        
        if (!profile.length) return res.status(404).json({ message: 'Profile record empty.' });
        res.status(200).json({ status: 'success', data: profile[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};