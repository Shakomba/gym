# Halabja Gym Management System — Developer Handoff

**Date:** 2026-05-14  
**Status:** Running in Docker  
**Live URL:** http://localhost:3000

---

## 1. Project Summary

A full-stack gym management platform for **Halabja Gym**. Built for a Database Systems course to demonstrate advanced SQL Server features. Three user roles: **Admin**, **Trainer**, **Member**. Members submit a request and are manually approved by the admin after paying in cash at the gym.

---

## 2. Repository Layout

```
d:\New folder (2)\
├── docker-compose.yml          ← Runs everything: DB + API + frontend
├── database/
│   ├── schema.sql              ← Full SQL Server schema, SPs, triggers, views, seed data
│   └── init.sh                 ← Waits for SQL Server, then runs schema.sql (runs in db-init container)
├── backend/                    ← Node.js / Express API
│   ├── server.js               ← Entry point, mounts all routes
│   ├── .env                    ← DB credentials + JWT secret (not committed in real projects)
│   ├── src/
│   │   ├── db/pool.js          ← mssql connection pool with retry logic (10 attempts × 4s)
│   │   ├── middleware/auth.js  ← JWT verify + role guard (authenticate, requireRole)
│   │   └── routes/
│   │       ├── auth.js         ← POST /login, POST /register
│   │       ├── admin.js        ← Stats, member requests, approve/reject, attendance, trainers
│   │       ├── trainer.js      ← Trainer members, workout courses CRUD
│   │       ├── members.js      ← Member profile, courses, attendance (own data)
│   │       └── machines.js     ← Machine inventory + maintenance logs
└── frontend/                   ← React 19 / Vite 8 / Tailwind CSS v4
    ├── nginx.conf              ← Proxies /api/* to backend:5000
    ├── src/
    │   ├── index.css           ← Design tokens (CSS vars), @layer base/components/utilities
    │   ├── App.jsx             ← React Router tree + role-based guards
    │   ├── api/client.js       ← Axios instance — auto-attaches JWT, handles 401 redirect
    │   ├── context/AuthContext.jsx  ← login/register/logout, user in localStorage
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AppLayout.jsx   ← Protected wrapper (redirects if no user)
    │   │   │   └── Sidebar.jsx     ← Role-aware nav, sign-out
    │   │   └── ui/
    │   │       ├── StatCard.jsx    ← Big-number stat tile
    │   │       ├── StatusBadge.jsx ← Pending / Active / Inactive / Rejected badge
    │   │       ├── Modal.jsx       ← Accessible overlay modal
    │   │       └── Toast.jsx       ← Context-based toast notifications
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx        ← 4-step multi-page form
    │       ├── Machines.jsx        ← Shared by all roles
    │       ├── admin/
    │       │   ├── AdminDashboard.jsx
    │       │   ├── MemberRequests.jsx  ← Approve / Reject workflow
    │       │   └── AttendanceAdmin.jsx ← Manual check-in
    │       ├── trainer/
    │       │   ├── TrainerDashboard.jsx
    │       │   ├── TrainerMembers.jsx
    │       │   └── WorkoutCourses.jsx  ← Course builder with exercise editor
    │       └── member/
    │           ├── MemberDashboard.jsx
    │           ├── MemberCourses.jsx
    │           └── MemberAttendance.jsx
```

---

## 3. Running the Project

### Docker (recommended — one command)

```bash
docker compose up -d
```

Startup sequence is fully automated:
1. `db` — SQL Server 2022 starts, health-checked every 10s
2. `db-init` — waits for healthy DB, runs `schema.sql` (creates DB + seeds data), exits 0
3. `backend` — starts after `db-init` completes; retries DB connection up to 10×
4. `frontend` — nginx serves built React app on port 3000, proxies `/api` to backend

```bash
# Stop (keeps DB data)
docker compose down

# Full reset (wipes DB volume)
docker compose down -v && docker compose up -d

# Rebuild after code changes
docker compose build frontend   # or backend
docker compose up -d --no-deps frontend
```

### Without Docker

**Requirements:** Node 20+, SQL Server instance

```bash
# 1. Run database/schema.sql in SSMS

# 2. Backend
cd backend
# Edit .env — set DB_SERVER, DB_PASSWORD
npm start          # or: npm run dev (uses node --watch)

# 3. Frontend
cd frontend
npm run dev        # http://localhost:5173  (proxies /api → localhost:5000)
```

---

## 4. Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Express port |
| `JWT_SECRET` | `halabja_gym_super_secret_2024` | **Change in production** |
| `DB_SERVER` | `localhost` | SQL Server host (use `db` in Docker) |
| `DB_DATABASE` | `HalabjGymDB` | Database name |
| `DB_USER` | `sa` | SQL login |
| `DB_PASSWORD` | `HalabjGym_2024!` | SQL password |
| `DB_PORT` | `1433` | SQL Server port |
| `DB_ENCRYPT` | `false` | Set `true` for Azure SQL |
| `DB_TRUST_SERVER_CERT` | `true` | Set `false` in production with valid cert |

---

## 5. Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@halabja.gym | `admin123` |
| Trainer | ahmad@halabja.gym | `trainer123` |
| Trainer | sara@halabja.gym | `trainer123` |
| Trainer | dara@halabja.gym | `trainer123` |
| Member | ali@example.com | `admin123` |
| Member | nour@example.com | `admin123` |

---

## 6. API Routes

All protected routes require `Authorization: Bearer <token>` header.

### Auth — public
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Returns JWT + user object |
| POST | `/api/auth/register` | Creates pending member |

### Admin — role: `admin`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard counts |
| GET | `/api/admin/requests` | Pending member requests |
| GET | `/api/admin/members` | All members with trainer |
| POST | `/api/admin/approve/:id` | Calls `sp_ApproveMember` (transaction) |
| POST | `/api/admin/reject/:id` | Calls `sp_RejectMember` |
| PATCH | `/api/admin/members/:id/trainer` | Assign trainer |
| GET | `/api/admin/trainers` | Trainer list + member counts |
| GET | `/api/admin/attendance` | All attendance records |
| POST | `/api/admin/attendance/checkin` | Manual check-in |
| GET | `/api/admin/logs` | Last 50 system log entries |

### Trainer — role: `trainer` or `admin`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/trainer/stats` | Member/course counts |
| GET | `/api/trainer/members` | Assigned active members |
| GET | `/api/trainer/courses` | All courses by this trainer |
| GET | `/api/trainer/courses/:id` | Course + exercises |
| POST | `/api/trainer/courses` | Create course with exercises |
| PUT | `/api/trainer/courses/:id` | Update course metadata |
| DELETE | `/api/trainer/courses/:id/exercises/:exId` | Remove one exercise |

### Members — role: `member`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/members/me` | Own profile + trainer info |
| PATCH | `/api/members/me` | Update phone/weight/height/goal |
| GET | `/api/members/me/courses` | Own workout courses |
| GET | `/api/members/me/courses/:id` | Course with full exercise detail |
| GET | `/api/members/me/attendance` | Last 30 attendance records |

### Machines — all authenticated roles
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/machines` | All machines + log/course counts |
| GET | `/api/machines/:id` | Machine + maintenance logs |
| POST | `/api/machines` | Add machine (admin only) |
| PUT | `/api/machines/:id` | Update machine (admin only) |
| DELETE | `/api/machines/:id` | Calls `sp_DeleteMachine` (admin only) |
| POST | `/api/machines/:id/logs` | Add maintenance log (admin only) |

---

## 7. Database Schema Summary

### Tables (11)

| Table | Purpose |
|-------|---------|
| `Admins` | Admin accounts |
| `Trainers` | Trainer accounts + specialty |
| `Members` | Member accounts; `Status` ∈ {Pending, Active, Inactive, Rejected} |
| `MemberMedicalInfo` | 1:1 with Members — health disclosures |
| `Machines` | Gym equipment inventory |
| `MaintenanceLogs` | Service history per machine |
| `WorkoutCourses` | Programs created by trainers for members |
| `CourseExercises` | Junction: courses ↔ machines + sets/reps/frequency |
| `Payments` | Cash-only payment log (enforced by `CHECK (PaymentType = 'Cash')`) |
| `Attendance` | Check-in/out records |
| `SystemLogs` | General event log |
| `AuditTrail` | Weight/height change audit trail |
| `ArchiveMembers` | Soft-deleted members moved here by trigger |

### Key Constraints
- `Members.Status` — `CHECK (Status IN ('Pending','Active','Inactive','Rejected'))`
- `Payments.PaymentType` — `CHECK (PaymentType = 'Cash')`
- `CourseExercises.Sets/Reps` — `CHECK (Sets > 0)`, `CHECK (Reps > 0)`
- `Members.Email`, `Machines.SerialNumber` — `UNIQUE`
- `Members.Status` — `DEFAULT 'Pending'`
- `Members.JoinDate` — `DEFAULT GETDATE()`

### Stored Procedures
| Procedure | Description |
|-----------|-------------|
| `sp_ApproveMember` | **Transaction-wrapped**: sets Status = Active, logs Cash payment, creates initial attendance record. Rolls back all three if any step fails. |
| `sp_RejectMember` | Sets Status = Rejected, writes SystemLog entry |
| `sp_DeleteMachine` | Transaction: removes from CourseExercises, then Machines, writes SystemLog |

### Triggers
| Trigger | Table | Event | Action |
|---------|-------|-------|--------|
| `trg_MemberApproved` | Members | AFTER UPDATE | Inserts "Welcome" entry into SystemLogs when Status changes to Active |
| `trg_MemberBodyAudit` | Members | AFTER UPDATE | Logs old/new Weight and Height values to AuditTrail |
| `trg_ArchiveMember` | Members | INSTEAD OF DELETE | Copies row to ArchiveMembers before deleting |

### Views
| View | Description |
|------|-------------|
| `vw_ActiveMemberOverview` | INNER JOIN: members + trainers + active courses |
| `vw_TrainerWorkload` | GROUP BY: trainer → active member count |
| `vw_UnusedMachines` | EXISTS subquery: machines not in any active course |
| `vw_MembersWithoutTrainer` | EXCEPT: active members minus those with a trainer assigned |

---

## 8. Frontend Design System

**Fonts (Google Fonts):**
- `Barlow Condensed 800/900` — display headings, uppercase
- `Barlow 300–600` — body text
- `JetBrains Mono 400–700` — data, labels, timestamps

**CSS Variables (in `frontend/src/index.css`):**
```css
--bg          #080808   page background
--s1          #101010   card surface
--s2          #181818   elevated surface / input bg hover
--s3          #222222   input background
--b1          #2c2c2c   subtle border
--b2          #404040   normal border
--b3          #5c5c5c   strong / hover border
--t1          #eeeeee   primary text
--t2          #888888   secondary text
--t3          #4a4a4a   muted / label text
--inv         #eeeeee   primary button background
--inv-text    #080808   text on primary button
```

**Reusable CSS classes:**  
`.card` `.input-base` `.btn-primary` `.btn-secondary` `.btn-danger` `.btn-success`  
`.table-base` `.section-label` `.skeleton` `.animate-fade-in`

**Custom Tailwind utilities added:**  
`.font-500` `.font-600` `.font-700` `.font-800` `.font-900` (Tailwind v4 drops bare numeric weights)

---

## 9. Auth Flow

```
POST /api/auth/login
  → checks Admins → Trainers → Members (in that order)
  → returns { token, user: { id, name, email, role } }

Token stored in localStorage
Axios interceptor attaches it to every request
401 response → clears storage → redirects to /login

Role routing:
  admin   → /admin
  trainer → /trainer
  member  → /member
```

---

## 10. Known Gotchas

| Issue | Detail |
|-------|--------|
| **SQL Server cold start** | Takes ~20–30s on first `docker compose up`. The `db-init` container waits up to 90s (30 × 3s). Backend also retries 10× with 4s gaps. |
| **Tailwind v4 layer rule** | Custom CSS classes *must* be inside `@layer components {}`. Classes defined outside layers are dropped by the compiler. |
| **Font weights** | Tailwind v4 has no `.font-700` utility. Custom `.font-500`–`.font-900` utilities are defined in `@layer utilities` in `index.css`. |
| **Unlayered `*` reset** | `* { padding: 0 }` outside a layer overrides all Tailwind spacing utilities. The reset is inside `@layer base` to keep specificity correct. |
| **Cash-only payments** | `CHECK (PaymentType = 'Cash')` is enforced at DB level. The API hardcodes `'Cash'` — no other payment type is accepted by design. |
| **Password hashes** | Seed data uses real bcrypt hashes: `admin123` → `$2b$10$wXvmn...`, `trainer123` → `$2b$10$PFcW...`. Generated with `bcryptjs` at cost factor 10. |
| **Docker SA password** | `HalabjGym_2024!` is used for the SQL Server `sa` account in Docker. It meets SQL Server's complexity requirements (upper + lower + digit + special). |

---

## 11. What's Not Implemented

- Email verification
- Password reset flow
- QR-based check-in (schema column exists: `Attendance.Method = 'QR'`)
- Member medical info CRUD in the UI (table exists in DB, no frontend page)
- Audit trail viewer (data is written by trigger, no admin UI to read it)
- Member photo upload
- Pagination on member/machine lists (all records loaded at once)
