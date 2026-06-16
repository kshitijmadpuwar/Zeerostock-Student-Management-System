# Zeerostock — Student Management System

A full-stack Student Management System built with Node.js, PostgreSQL, and React.js.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Backend  | Node.js 18+, Express.js             |
| Database | PostgreSQL 14+                      |
| Frontend | React 18, React Router v6           |
| UI       | Custom CSS design system            |
| Extras   | express-validator, react-hot-toast, lucide-react |

---

## Project Structure

```
zeerostock/
├── backend/
│   ├── migrations/
│   │   └── 001_init.sql          # Schema + seed data
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── studentController.js
│   │   │   └── marksController.js
│   │   ├── db/pool.js            # PostgreSQL connection pool
│   │   ├── routes/
│   │   │   ├── students.js
│   │   │   └── marks.js
│   │   └── index.js              # Express app entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/index.js          # Axios service layer
│   │   ├── pages/
│   │   │   ├── StudentList.jsx   # Paginated list + search
│   │   │   ├── StudentForm.jsx   # Create / Edit form
│   │   │   └── StudentDetail.jsx # Profile + marks management
│   │   ├── App.js                # Router + layout
│   │   └── index.css             # Design system CSS
│   └── .env.example
└── postman_collection.json
```

---

## Setup Instructions

### 1. Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE zeerostock;"

# Run migration (creates tables + seeds subjects)
psql -U postgres -d zeerostock -f backend/migrations/001_init.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # Edit DB credentials
npm install
npm run dev                   # Starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env          # Optional: override API URL
npm install
npm start                     # Starts on http://localhost:3000
```

---

## API Reference

### Students

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /api/students         | List students (paginated)      |
| GET    | /api/students/:id     | Get student with marks         |
| POST   | /api/students         | Create student                 |
| PUT    | /api/students/:id     | Update student                 |
| DELETE | /api/students/:id     | Delete student + marks         |

#### Pagination query params

```
GET /api/students?page=1&limit=10&search=alice
```

Response includes:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Marks

| Method | Endpoint                         | Description           |
|--------|----------------------------------|-----------------------|
| GET    | /api/students/:id/marks          | Get student's marks   |
| POST   | /api/students/:id/marks          | Add a mark            |
| PUT    | /api/marks/:id                   | Update a mark         |
| DELETE | /api/marks/:id                   | Delete a mark         |

### Subjects (lookup)

| Method | Endpoint        | Description        |
|--------|-----------------|--------------------|
| GET    | /api/subjects   | List all subjects  |

---

## Database Schema Design

### Design Decisions

**Normalisation (3NF):**
- `students` — core identity data only
- `subjects` — subject names stored once (no repetition in marks rows)
- `marks` — junction table with a composite unique index on `(student_id, subject_id, exam_type)` preventing duplicate entries

**Referential integrity:**
- `marks.student_id → students.id ON DELETE CASCADE` — deleting a student removes all their marks automatically
- `marks.subject_id → subjects.id ON DELETE CASCADE`

**Constraints:**
- `marks.marks CHECK (0 ≤ marks ≤ 100)` — database-level data quality
- `students.email UNIQUE` — prevents duplicate registrations
- `updated_at` auto-maintained via PostgreSQL trigger

### ER Overview

```
students 1──* marks *──1 subjects
```

---

## Assumptions

1. A subject list is pre-seeded (6 common subjects). New subjects can be added directly via SQL or a future admin endpoint.
2. A student can have at most one mark per `(subject, exam_type)` combination. Multiple exam types (Midterm, Final, Quiz, etc.) are supported per subject.
3. Marks are on a 0–100 scale by default; `max_marks` can be overridden per row.
4. Search is case-insensitive and matches on first name, last name, or email.

---

## Postman Collection

Import `postman_collection.json`. Set the `baseUrl` variable to `http://localhost:5000/api`. All endpoints include example request bodies.
