const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, dob, gender, phone, address, specialization, license_no } = req.body;
        
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Email identifier registered elsewhere.' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const [userResult] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        const userId = userResult.insertId;

        if (role === 'patient') {
            await db.query(
                'INSERT INTO patients (user_id, dob, gender, phone, address) VALUES (?, ?, ?, ?, ?)',
                [userId, dob, gender, phone, address]
            );
        } else if (role === 'doctor') {
            const emptyAvailability = JSON.stringify({"Monday": ["09:00-12:00"], "Wednesday": ["14:00-17:00"]});
            await db.query(
                'INSERT INTO doctors (user_id, specialization, license_no, availability_slots) VALUES (?, ?, ?, ?)',
                [userId, specialization, license_no, emptyAvailability]
            );
        }

        res.status(201).json({ status: 'success', message: 'User resource successfully initialized.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User records non-existent.' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid cryptographic credentials.' });

        let profileId = null;
        if (user.role === 'patient') {
            const [p] = await db.query('SELECT id FROM patients WHERE user_id = ?', [user.id]);
            if (p.length) profileId = p[0].id;
        } else if (user.role === 'doctor') {
            const [d] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
            if (d.length) profileId = d[0].id;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, profileId: profileId, name: user.name },
            process.env.JWT_SECRET || 'SUPER_SECRET_PRODUCTION_KEY',
            { expiresIn: '8h' }
        );

        res.status(200).json({ status: 'success', token, user: { name: user.name, role: user.role, id: user.id, profileId } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};