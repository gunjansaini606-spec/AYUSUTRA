const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const clinicalController = require('../controllers/clinicalController');
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Authentication API Endpoints
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Clinical Vitals API Endpoints
router.put('/clinical/profile', authMiddleware('patient'), clinicalController.updatePatientProfile);
router.get('/clinical/profile/me', authMiddleware('patient'), clinicalController.getPatientData);
router.get('/clinical/profile/:id', authMiddleware(['doctor', 'admin']), clinicalController.getPatientData);

// Appointment Management API Endpoints
router.post('/appointments/book', authMiddleware('patient'), appointmentController.bookAppointment);
router.get('/appointments/patient', authMiddleware('patient'), appointmentController.getPatientAppointments);
router.get('/appointments/doctor', authMiddleware('doctor'), appointmentController.getDoctorAppointments);
router.put('/appointments/status/:id', authMiddleware(['doctor', 'admin']), appointmentController.updateStatus);

// Admin Business Intelligence Analytics Dashboard
router.get('/admin/metrics', authMiddleware('admin'), adminController.getSystemMetrics);

// Global Diagnostics Route exposing available therapies list dynamically
const db = require('../config/db');
router.get('/therapies', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM therapies');
    res.json({ status: 'success', data: rows });
});

router.get('/doctors', async (req, res) => {
    const [rows] = await db.query(`
        SELECT d.id, u.name, d.specialization, d.availability_slots 
        FROM doctors d JOIN users u ON d.user_id = u.id`);
    res.json({ status: 'success', data: rows });
});

module.exports = router;