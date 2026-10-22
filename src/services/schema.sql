-- =====================================================================
-- QueueLess: Smart Queue and Waiting-Time Optimizer
-- Production Relational Database Schema (MySQL 8.0+ / InnoDB)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS queueless_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE queueless_db;

-- 1. Users Table (Core Authentication and Identity)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role ENUM('STUDENT', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. StudentProfiles Table (Academic Details & Priority Eligibility)
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    roll_number VARCHAR(32) NOT NULL UNIQUE,
    department VARCHAR(80) NOT NULL,
    batch_year INT NOT NULL,
    is_differently_abled BOOLEAN NOT NULL DEFAULT FALSE,
    accessibility_pass_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. StaffProfiles Table (Campus Department & Counter Designation)
CREATE TABLE IF NOT EXISTS staff_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    staff_employee_code VARCHAR(32) NOT NULL UNIQUE,
    department VARCHAR(80) NOT NULL,
    desk_extension VARCHAR(20),
    is_counter_lead BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Facilities Table (Campus Buildings & Service Centers)
CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    category ENUM('CANTEEN', 'LIBRARY', 'ADMIN', 'FEES', 'LABORATORY', 'HEALTH') NOT NULL,
    description TEXT,
    building_location VARCHAR(120) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_facility_category (category)
) ENGINE=InnoDB;

-- 5. OperatingSchedules Table (Facility & Counter Operating Hours)
CREATE TABLE IF NOT EXISTS operating_schedules (
    id VARCHAR(36) PRIMARY KEY,
    facility_id VARCHAR(36) NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Monday ... 7=Sunday',
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    lunch_break_start TIME,
    lunch_break_end TIME,
    CONSTRAINT fk_schedule_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    INDEX idx_sched_lookup (facility_id, day_of_week)
) ENGINE=InnoDB;

-- 6. ServiceCounters Table (Active Windows / Desks)
CREATE TABLE IF NOT EXISTS service_counters (
    id VARCHAR(36) PRIMARY KEY,
    facility_id VARCHAR(36) NOT NULL,
    counter_number INT NOT NULL,
    counter_name VARCHAR(100) NOT NULL,
    assigned_staff_id VARCHAR(36),
    status ENUM('OPEN', 'BUSY', 'PAUSED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    avg_service_duration_seconds INT NOT NULL DEFAULT 240,
    is_priority_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_counter_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    CONSTRAINT fk_counter_staff FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_facility_counter (facility_id, counter_number)
) ENGINE=InnoDB;

-- 7. Tokens Table (Digital Queue Tickets)
CREATE TABLE IF NOT EXISTS tokens (
    id VARCHAR(36) PRIMARY KEY,
    token_number VARCHAR(32) NOT NULL,
    facility_id VARCHAR(36) NOT NULL,
    counter_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    priority ENUM('NORMAL', 'ACCESSIBLE', 'EMERGENCY', 'FACULTY_REFERRAL') NOT NULL DEFAULT 'NORMAL',
    priority_reason VARCHAR(255),
    status ENUM('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED', 'SKIPPED') NOT NULL DEFAULT 'WAITING',
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_time TIMESTAMP NULL,
    served_start_time TIMESTAMP NULL,
    completed_time TIMESTAMP NULL,
    estimated_wait_minutes INT NOT NULL DEFAULT 0,
    qr_payload VARCHAR(255) NOT NULL,
    CONSTRAINT fk_token_facility FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    CONSTRAINT fk_token_counter FOREIGN KEY (counter_id) REFERENCES service_counters(id) ON DELETE CASCADE,
    CONSTRAINT fk_token_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_counter_status (counter_id, status),
    INDEX idx_student_status (student_id, status),
    INDEX idx_token_booking (booking_time)
) ENGINE=InnoDB;

-- 8. QueueEvents Table (Immutable Event Sourcing Audit Trail)
CREATE TABLE IF NOT EXISTS queue_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_id VARCHAR(36) NOT NULL,
    token_number VARCHAR(32) NOT NULL,
    counter_id VARCHAR(36) NOT NULL,
    event_type ENUM('BOOKED', 'CALLED', 'SERVING', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'PAUSED') NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(120) NOT NULL,
    details VARCHAR(255),
    event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_token (token_id),
    INDEX idx_event_counter (counter_id),
    INDEX idx_event_timestamp (event_timestamp)
) ENGINE=InnoDB;

-- 9. ServiceRecords Table (Completed Service Duration Metrics for Analytics)
CREATE TABLE IF NOT EXISTS service_records (
    id VARCHAR(36) PRIMARY KEY,
    token_id VARCHAR(36) NOT NULL,
    counter_id VARCHAR(36) NOT NULL,
    facility_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    waiting_duration_seconds INT NOT NULL,
    service_duration_seconds INT NOT NULL,
    student_rating TINYINT NULL,
    recorded_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_token FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_counter FOREIGN KEY (counter_id) REFERENCES service_counters(id) ON DELETE CASCADE,
    INDEX idx_rec_analytics (facility_id, recorded_date)
) ENGINE=InnoDB;

-- 10. Notifications Table (In-App & Push Message Queue)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_id VARCHAR(36) NULL,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('INFO', 'WARNING', 'TURN_NEAR', 'TURN_NOW', 'COMPLETED', 'PAUSE') NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read)
) ENGINE=InnoDB;

-- =====================================================================
-- Seed Data for College Campus Demonstration
-- =====================================================================

INSERT INTO users (id, email, password_hash, full_name, role, phone_number) VALUES
('user-student-1', 'alex.rivera@campus.edu', '$2a$12$e7...', 'Alex Rivera', 'STUDENT', '+1 (555) 234-5678'),
('user-staff-1', 'sarah.canteen@campus.edu', '$2a$12$e7...', 'Sarah Jenkins', 'STAFF', '+1 (555) 345-6789'),
('user-staff-2', 'david.canteen@campus.edu', '$2a$12$e7...', 'David Miller', 'STAFF', '+1 (555) 345-6790'),
('user-staff-3', 'elena.canteen@campus.edu', '$2a$12$e7...', 'Elena Vance', 'STAFF', '+1 (555) 345-6791'),
('user-admin-1', 'admin@queueless.edu', '$2a$12$e7...', 'Dr. Robert Chen', 'ADMIN', '+1 (555) 987-6543');

INSERT INTO student_profiles (user_id, roll_number, department, batch_year, is_differently_abled) VALUES
('user-student-1', '2024CS108', 'Computer Science & Engineering', 2024, FALSE);

INSERT INTO facilities (id, name, category, description, building_location) VALUES
('fac-canteen', 'College Canteen', 'CANTEEN', 'Main campus dining hall serving meals, snacks, and beverage tokens.', 'Student Union Building, Ground Floor'),
('fac-library', 'Library Counter', 'LIBRARY', 'Book issuance, returns, digital thesis access, and reference desk.', 'Central Library, 1st Floor East Wing'),
('fac-admin', 'Administration Office', 'ADMIN', 'Official student documents, bonafide certificates, identity cards, and verification.', 'Administrative Complex, Room 102'),
('fac-fees', 'Fee Payment Counter', 'FEES', 'Semester fees, examination dues, scholarship clearance, and challan endorsements.', 'Finance Wing, Ground Floor'),
('fac-lab', 'Laboratory Equipment Desk', 'LABORATORY', 'Component checkout, microcontrollers, oscilloscope kit issuance, and lab returns.', 'Turing Computing & Hardware Center, Lab 3');

INSERT INTO service_counters (id, facility_id, counter_number, counter_name, assigned_staff_id, status, avg_service_duration_seconds, is_priority_eligible) VALUES
('cnt-canteen-a', 'fac-canteen', 1, 'Counter A (Hot Meals & Thali)', 'user-staff-1', 'BUSY', 240, TRUE),
('cnt-canteen-b', 'fac-canteen', 2, 'Counter B (Express Snacks & Bowls)', 'user-staff-2', 'OPEN', 180, TRUE),
('cnt-canteen-c', 'fac-canteen', 3, 'Counter C (Beverages & Custom Orders)', 'user-staff-3', 'OPEN', 300, FALSE);
