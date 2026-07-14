-- Create Database
CREATE DATABASE IF NOT EXISTS ayursutra_db;
USE ayursutra_db;

-- 1. Users Core Table (Authentication & Access Control)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'patient') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Doctor Profiles Table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    license_no VARCHAR(100) UNIQUE NOT NULL,
    availability_slots JSON NOT NULL, -- Format: {"Monday": ["09:00-10:00", "10:00-11:00"]}
    rating DECIMAL(3,2) DEFAULT 5.00,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_doctor_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Patient Clinical Profiles Table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    height DECIMAL(5,2), -- in cm
    weight DECIMAL(5,2), -- in kg
    bmi DECIMAL(4,2),
    blood_pressure VARCHAR(20), -- Format: "120/80"
    medical_conditions TEXT,
    allergies TEXT,
    lifestyle ENUM('Sedentary', 'Moderate', 'Active') DEFAULT 'Moderate',
    sleep_pattern ENUM('Poor', 'Normal', 'Excessive') DEFAULT 'Normal',
    stress_level ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
    diet_type ENUM('Veg', 'Non-Veg', 'Vegan') DEFAULT 'Veg',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_patient_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Panchakarma Therapies Master Data
CREATE TABLE IF NOT EXISTS therapies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    duration_mins INT NOT NULL,
    preparation TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Appointments & Scheduling Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    therapy_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (therapy_id) REFERENCES therapies(id) ON DELETE CASCADE,
    INDEX idx_appt_date (appointment_date),
    INDEX idx_appt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Clinical Records & Progress Tracker
CREATE TABLE IF NOT EXISTS medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    checkin_date DATE NOT NULL,
    pulse_rate INT, -- Nadi Pariksha metric
    completion_percentage INT DEFAULT 0,
    doctor_notes TEXT,
    prescription_url VARCHAR(512),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Automated AI Clinical Audit Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    symptoms_analyzed TEXT NOT NULL,
    recommended_therapies JSON NOT NULL,
    diet_plan JSON NOT NULL,
    yoga_asana JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Ledger Payments & Revenue Tracker
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
    transaction_id VARCHAR(255) DEFAULT NULL,
    payment_date TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Real-time System Notifications Queue
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('email', 'sms', 'system') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Base Panchakarma Master Records
INSERT INTO therapies (name, description, benefits, duration_mins, preparation, cost) VALUES
('Abhyanga', 'Full body warm herbal oil massage coordinated by two therapists.', 'Detoxification, improved circulation, stress reduction', 60, 'Fasting for 2 hours prior to therapy.', 2500.00),
('Shirodhara', 'Continuous pouring of warm medicated herbal oil onto the forehead.', 'Calms central nervous system, treats insomnia, reduces anxiety', 45, 'Hair washed with plain water before arriving.', 3500.00),
('Vamana', 'Therapeutic clinical emesis safely administered under expert medical supervision.', 'Eliminates Kapha toxins, clears respiratory systems', 90, 'Internal oleation for 3-5 days before the main procedure.', 5000.00),
('Virechana', 'Medicated purgation therapy cleansing liver, gallbladder, and gastrointestinal tracts.', 'Eliminates Pitta toxins, cleanses blood, treats skin disorders', 75, 'Strict warm liquid diet 24 hours prior.', 4500.00),
('Basti', 'Herbal decoction or oil enema serving as the backbone of Panchakarma.', 'Balances Vata dosha, treats arthritis, colon cleansing', 45, 'Light meal consumed 1 hour prior.', 3000.00),
('Nasya', 'Nasal administration of warm medicated oils or herbal extracts.', 'Clears sinuses, mitigates migraines, enhances sensory clarity', 30, 'Facial massage and steam fermentation prior to drop infusion.', 1500.00),
('Raktamokshana', 'Highly advanced blood-letting therapy to treat deep-seated blood disorders.', 'Purifies blood, cures eczema, treats localized inflammation', 60, 'Complete physical assessment and dynamic vitals screening.', 6000.00);