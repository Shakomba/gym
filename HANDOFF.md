# Halabja Gym Management System — Developer Handoff

**Last updated:** 2026-05-14  
**Status:** Running in Docker on DigitalOcean  
**Live URL:** https://redeen.shakomba.org  
**Server:** `ssh -i ~/.ssh/attendify_prod root@159.223.22.87` → `/opt/halabja-gym/`

---

## 1. Project Summary

Full-stack gym management platform for **Halabja Gym**. Built for a Database Systems course showcasing advanced SQL Server features. Three roles: **Admin**, **Trainer**, **Member**. Members register and await manual approval after paying in cash at the gym.

---

## 2. Repository Layout

```
├── docker-compose.yml
├── database/
│   ├── schema.sql          ← Full schema: tables, SPs, triggers, views, seed data
│   └── init.sh             ← Waits for SQL Server, runs schema.sql (db-init container)
├── backend/
│   ├── server.js           ← Entry point, mounts all routes under /api
│   ├── src/
│   │   ├── db/pool.js      ← mssql connection pool, retries 10× with 4s gaps
│   │   ├── middleware/auth.js  ← JWT verify + requireRole guard
│   │   └── routes/
│   │       ├── auth.js         ← POST /login, POST /register (+ MemberMedicalInfo insert)
│   │       ├── admin.js        ← Stats, members, approve/reject, attendance check-in/out
│   │       ├── trainer.js      ← Trainer members, courses CRUD, per-course exercise CRUD
│   │       ├── members.js      ← Member profile, courses, own attendance
│   │       └── machines.js     ← Machine inventory + maintenance logs
└── frontend/
    ├── nginx.conf          ← 80→443 redirect, SSL termination, proxies /api/* to backend:5000
    ├── src/
    │   ├── index.css       ← Design tokens (CSS custom properties), component classes
    │   ├── App.jsx         ← React Router tree, role guards (RequireRole)
    │   ├── api/client.js   ← Axios: auto-attaches JWT, 401 → redirect to /login
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── layout/AppLayout.jsx  ← Auth wrapper
    │   │   ├── layout/Sidebar.jsx    ← Role-aware nav
    │   │   └── ui/                   ← Modal, Toast, StatCard, StatusBadge
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Register.jsx        ← 4-step form (account → personal → health → review)
    │       ├── Machines.jsx        ← Shared by all roles
    │       ├── admin/
    │       │   ├── AdminDashboard.jsx
    │       │   ├── MemberRequests.jsx  ← Members list + approve/reject workflow
    │       │   └── AttendanceAdmin.jsx ← Manual check-in + check-out per session
    │       ├── trainer/
    │       │   ├── TrainerDashboard.jsx
    │       │   ├── TrainerMembers.jsx
    │       │   └── WorkoutCourses.jsx  ← Create + edit courses, live exercise add/remove
    │       └── member/
    │           ├── MemberDashboard.jsx
    │           ├── MemberCourses.jsx
    │           └── MemberAttendance.jsx
```

---

## 3. Running the Project

### Docker (recommended)

```bash
docker compose up -d
```

Startup order is enforced by health checks and `depends_on`:
1. `db` — SQL Server 2022, health-checked every 10s (up to 15 retries)
2. `db-init` — runs `schema.sql` once, then exits 0
3. `backend` — starts after db-init; retries DB connection 10× before giving up
4. `frontend` — nginx serves built React app on 443 (HTTPS), proxies `/api` to backend

```bash
docker compose down               # stop, keep DB volume
docker compose down -v            # full reset, wipe DB
docker compose up -d --build      # rebuild and restart all
docker compose build backend && docker compose up -d --no-deps backend
```

### Without Docker

Requirements: Node 20+, SQL Server instance

```bash
# 1. Run database/schema.sql in SSMS

# 2. Backend
cd backend
# Edit .env — set DB_SERVER, DB_PASSWORD
npm start          # or: npm run dev

# 3. Frontend
cd frontend
npm run dev        # http://localhost:5173 — Vite proxies /api → localhost:5000
```

---

## 4. Environment Variables (`backend/.env`)

| Variable | Docker value | Description |
|---|---|---|
| `PORT` | `5000` | Express port |
| `JWT_SECRET` | `halabja_gym_super_secret_2024` | Change in any real deployment |
| `DB_SERVER` | `db` | `localhost` when running without Docker |
| `DB_DATABASE` | `HalabjGymDB` | |
| `DB_USER` | `sa` | |
| `DB_PASSWORD` | `HalabjGym_2024!` | |
| `DB_PORT` | `1433` | |
| `DB_ENCRYPT` | `false` | `true` for Azure SQL |
| `DB_TRUST_SERVER_CERT` | `true` | `false` if using a CA-signed cert |

---

## 5. Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@halabja.gym | admin123 |
| Trainer | ahmad@halabja.gym | trainer123 |
| Trainer | sara@halabja.gym | trainer123 |
| Trainer | dara@halabja.gym | trainer123 |
| Member | ali@example.com | admin123 |
| Member | nour@example.com | admin123 |

---

## 6. API Routes

All protected routes require `Authorization: Bearer <token>`.

### Auth — public
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns JWT + user object |
| POST | `/api/auth/register` | Creates pending member + medical info row |

### Admin — role: `admin`
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard counts |
| GET | `/api/admin/members` | All members with trainer |
| POST | `/api/admin/approve/:id` | Calls `sp_ApproveMember` (transaction) |
| POST | `/api/admin/reject/:id` | Calls `sp_RejectMember` |
| PATCH | `/api/admin/members/:id/trainer` | Assign trainer to member |
| GET | `/api/admin/trainers` | Trainer list + member counts |
| GET | `/api/admin/attendance` | All attendance records |
| POST | `/api/admin/attendance/checkin` | Manual check-in |
| POST | `/api/admin/attendance/checkout/:id` | Record check-out for a session |
| GET | `/api/admin/logs` | Last 50 system log entries |

### Trainer — role: `trainer` or `admin`
| Method | Path | Description |
|---|---|---|
| GET | `/api/trainer/stats` | Member/course counts |
| GET | `/api/trainer/members` | Assigned active members |
| GET | `/api/trainer/courses` | All courses by this trainer |
| GET | `/api/trainer/courses/:id` | Course + exercises |
| POST | `/api/trainer/courses` | Create course with exercises |
| PUT | `/api/trainer/courses/:id` | Update course metadata |
| POST | `/api/trainer/courses/:id/exercises` | Add exercise to existing course |
| DELETE | `/api/trainer/courses/:id/exercises/:exId` | Remove one exercise |

### Members — role: `member`
| Method | Path | Description |
|---|---|---|
| GET | `/api/members/me` | Own profile + trainer info |
| PATCH | `/api/members/me` | Update phone/weight/height/goal |
| GET | `/api/members/me/courses` | Own workout courses |
| GET | `/api/members/me/courses/:id` | Course with full exercise detail |
| GET | `/api/members/me/attendance` | Own attendance history |

### Machines — all authenticated roles
| Method | Path | Description |
|---|---|---|
| GET | `/api/machines` | All machines |
| GET | `/api/machines/:id` | Machine + maintenance logs |
| POST | `/api/machines` | Add machine (admin only) |
| PUT | `/api/machines/:id` | Update machine (admin only) |
| DELETE | `/api/machines/:id` | Calls `sp_DeleteMachine` (admin only) |
| POST | `/api/machines/:id/logs` | Add maintenance log (admin only) |

---

## 7. Database

### Tables (13)

| Table | Purpose |
|---|---|
| `Admins` | Admin accounts |
| `Trainers` | Trainer accounts + specialty |
| `Members` | Member accounts; `Status` ∈ {Pending, Active, Inactive, Rejected} |
| `MemberMedicalInfo` | 1:1 with Members — health disclosures, emergency contact |
| `Machines` | Gym equipment inventory |
| `MaintenanceLogs` | Service history per machine |
| `WorkoutCourses` | Training programs (trainer → member) |
| `CourseExercises` | Course ↔ machine junction: sets, reps, weight, frequency |
| `Payments` | Cash-only payment log |
| `Attendance` | Check-in/out records with method (Manual / QR) |
| `SystemLogs` | General event log |
| `AuditTrail` | Weight/height change history (written by trigger) |
| `ArchiveMembers` | Soft-deleted members (moved here by INSTEAD OF DELETE trigger) |

### Stored Procedures
| Procedure | Description |
|---|---|
| `sp_ApproveMember` | Transaction: sets Status=Active, logs Cash payment, creates attendance record. Full rollback on any failure. |
| `sp_RejectMember` | Sets Status=Rejected, writes SystemLog |
| `sp_DeleteMachine` | Transaction: removes CourseExercises references, deletes machine, writes SystemLog |

### Triggers
| Trigger | Table | Event | Action |
|---|---|---|---|
| `trg_MemberApproved` | Members | AFTER UPDATE | Inserts "Welcome" into SystemLogs when Status → Active |
| `trg_MemberBodyAudit` | Members | AFTER UPDATE | Logs old/new Weight and Height to AuditTrail |
| `trg_ArchiveMember` | Members | INSTEAD OF DELETE | Copies row to ArchiveMembers before deleting |

### Views
| View | Description |
|---|---|
| `vw_ActiveMemberOverview` | Members + trainers + active course count |
| `vw_TrainerWorkload` | Trainer → active member count |
| `vw_UnusedMachines` | Machines not in any active course |
| `vw_MembersWithoutTrainer` | Active members with no trainer assigned |

---

## 8. Frontend Design System

**Theme:** Dark monochrome brutalist. Zero border radius. Flat borders.

**Fonts:** Barlow Condensed (headings) · Barlow (body) · JetBrains Mono (data/labels)

**CSS tokens (`index.css`):**
```
--bg   #111111    --s1  #1a1a1a    --s2  #222222    --s3  #2c2c2c
--b0   #252525    --b1  #383838    --b2  #505050    --b3  #6a6a6a
--t1   #f0f0f0    --t2  #999999    --t3  #5a5a5a
--inv  #f0f0f0    --inv-text  #111111
```

**Reusable classes:**  
`.card` `.input-base` `.btn-primary` `.btn-secondary` `.btn-danger` `.btn-success`  
`.table-base` `.section-label` `.skeleton` `.animate-fade-in`

**Font weight utilities** (`.font-500` → `.font-900`) are defined in `@layer utilities` because Tailwind v4 dropped bare numeric weight classes.

---

## 9. Auth Flow

```
POST /api/auth/login
  → checks Admins → Trainers → Members (in that order)
  → returns { token, user: { id, name, email, role } }

Token stored in localStorage
Axios interceptor attaches it to every request as Bearer token
401 response → clears storage, redirects to /login

Role redirect on login:
  admin   → /admin
  trainer → /trainer
  member  → /member
```

---

## 10. Production Deployment

- **Provider:** DigitalOcean, region fra1 (Frankfurt)
- **Droplet:** s-2vcpu-4gb, IP 159.223.22.87
- **Domain:** redeen.shakomba.org — Cloudflare DNS (A record, proxied, SSL mode: Full)
- **SSL:** Self-signed cert at `/opt/halabja-gym/certs/` — Cloudflare terminates public TLS
- **Redeploy:** `ssh -i ~/.ssh/attendify_prod root@159.223.22.87` then `cd /opt/halabja-gym && docker compose up -d --build`

---

## 11. Known Gotchas

| Issue | Detail |
|---|---|
| SQL Server cold start | Takes 20–30s on first `docker compose up`. Health check runs up to 15× every 10s. Backend retries 10× with 4s gaps. |
| Tailwind v4 layers | Custom CSS classes must be inside `@layer components {}` or they get dropped. |
| Font weight utilities | Tailwind v4 has no `.font-700` etc. — defined manually in `@layer utilities`. |
| Cash-only payments | `CHECK (PaymentType = 'Cash')` at DB level. The API hardcodes `'Cash'`; no other type is accepted by design. |
| Seed password hashes | `admin123` and `trainer123` are real bcrypt hashes at cost factor 10. |

---

## 12. Not Implemented

- Email verification / password reset
- QR-based check-in (schema column exists: `Attendance.Method`)
- Medical info CRUD UI (data is saved during registration, no edit page)
- Audit trail viewer (data written by trigger, no UI to display it)
- Pagination (all records loaded at once)
- Member photo upload
