const db = require('../config/db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.MAIL_PORT || 2525,
    auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || ''
    }
});

exports.bookAppointment = async (req, res) => {
    try {
        const { doctor_id, therapy_id, appointment_date, time_slot, notes } = req.body;
        const patient_id = req.user.profileId;

        const [existing] = await db.query(
            'SELECT id FROM appointments WHERE doctor_id=? AND appointment_date=? AND time_slot=? AND status != "cancelled"',
            [doctor_id, appointment_date, time_slot]
        );
        if (existing.length > 0) return res.status(400).json({ message: 'Target time-slot is already booked.' });

        const [result] = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, therapy_id, appointment_date, time_slot, notes) VALUES (?, ?, ?, ?, ?, ?)',
            [patient_id, doctor_id, therapy_id, appointment_date, time_slot, notes]
        );

        // Fetch therapy details to log initial invoicing ledger records
        const [th] = await db.query('SELECT cost FROM therapies WHERE id = ?', [therapy_id]);
        if(th.length) {
            await db.query('INSERT INTO payments (appointment_id, amount) VALUES (?, ?)', [result.insertId, th[0].cost]);
        }

        // Notify user via transactional email context background worker
        const [pEmail] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if(pEmail.length) {
            transporter.sendMail({
                from: '"AyurSutra Clinic System" <no-reply@ayursutra.com>',
                to: pEmail[0].email,
                subject: 'Panchakarma Clinical Operations Appointment Received',
                text: `Your therapy appointment scheduling operation has been initialized for ${appointment_date} at ${time_slot}. Status: Pending.`
            }).catch(e => console.error('Notification layer fault:', e));
        }

        res.status(201).json({ status: 'success', appointmentId: result.insertId });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getPatientAppointments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, t.name as therapy_name, u.name as doctor_name 
            FROM appointments a
            JOIN therapies t ON a.therapy_id = t.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`, [req.user.profileId]);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, t.name as therapy_name, u.name as patient_name, p.blood_pressure, p.bmi
            FROM appointments a
            JOIN therapies t ON a.therapy_id = t.id
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = ? ORDER BY a.appointment_date ASC`, [req.user.profileId]);
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ status: 'success', message: 'Operational records updated.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};