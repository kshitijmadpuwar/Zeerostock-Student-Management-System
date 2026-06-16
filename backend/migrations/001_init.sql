-- ============================================================
-- Zeerostock Student Management System - Database Schema
-- ============================================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(20),
    date_of_birth DATE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects lookup table (normalised — subjects stored once)
CREATE TABLE IF NOT EXISTS subjects (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(150) NOT NULL UNIQUE,
    code  VARCHAR(20)  NOT NULL UNIQUE
);

-- Marks table — one row per student per subject per exam
CREATE TABLE IF NOT EXISTS marks (
    id          SERIAL PRIMARY KEY,
    student_id  INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id  INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    marks       NUMERIC(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
    max_marks   NUMERIC(5,2) NOT NULL DEFAULT 100 CHECK (max_marks > 0),
    exam_type   VARCHAR(50) NOT NULL DEFAULT 'Midterm',  -- e.g. Midterm, Final, Quiz
    exam_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate marks for the same student/subject/exam combination
CREATE UNIQUE INDEX IF NOT EXISTS uq_student_subject_exam
    ON marks (student_id, subject_id, exam_type);

-- Trigger to auto-update updated_at on students
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_marks_updated_at
    BEFORE UPDATE ON marks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Seed default subjects ─────────────────────────────────
INSERT INTO subjects (name, code) VALUES
    ('Mathematics',       'MATH101'),
    ('Physics',           'PHY101'),
    ('Chemistry',         'CHEM101'),
    ('English',           'ENG101'),
    ('Computer Science',  'CS101'),
    ('Biology',           'BIO101')
ON CONFLICT (code) DO NOTHING;
