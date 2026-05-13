# Product Requirements Document: Halabja Gym Management System

## 1. Project Overview
The Halabja Gym Management System is a streamlined platform for a traditional gym environment. Unlike modern class-based studios, this system focuses on machine inventory, personalized workout courses authored by professional trainers, and a manual membership approval workflow. It is designed to demonstrate advanced SQL Server capabilities through a practical, real-world application.

## 2. System Features (Functional Requirements)

### 2.1 Member Account & Request System
*   **Digital Signup:** Prospective members create an account and fill in personal details, fitness goals, and medical history.
*   **Membership Request:** Instead of instant access, users submit a "Membership Request."
*   **Manual Approval Workflow:** Admins review pending requests. Membership is only activated once the customer visits the gym in person, pays the fee in cash, and the manager manually updates their status.
*   **Profile Dashboard:** Active members can view their assigned workout courses and machine instructions.

### 2.2 Trainer & Workout Courses
*   **Professional Training:** Trainers are assigned to members to oversee their progress.
*   **Course Creation:** Trainers write custom "Workout Courses" (programs) for members. These courses specify which machines to use, sets, reps, and frequency.
*   **Progress Tracking:** Trainers can update a member's course as they advance.

### 2.3 Machine Inventory Management
*   **Inventory Tracking:** Admins manage a database of gym machines (Treadmills, Lat Pulldowns, Smith Machines, etc.).
*   **Maintenance Logs:** Track the condition and last service date of each machine.
*   **Machine-Course Linking:** Each workout course references specific machines in the inventory.

### 2.4 Administrative Controls
*   **Request Management:** A dedicated dashboard for managers to "Accept" or "Reject" member applications.
*   **Attendance Tracking:** Manual or QR-based check-in to track gym usage.

## 3. Technical Stack
*   **Frontend:** Modern JavaScript Framework (e.g., React or Next.js) styled with **Tailwind CSS**.
*   **Backend:** Node.js (Express).
*   **Database:** **Microsoft SQL Server**.

## 4. Database Architecture (Technical Specifications)
The database structure is designed to fulfill the requirements of the Database System course outline.

### 4.1 Data Structures & Constraints
*   **Primary & Foreign Keys:** Established for all relational links (e.g., linking a Course to a Trainer).
*   **NOT NULL:** Mandatory for `MemberName`, `MachineType`, and `RequestDate`.
*   **UNIQUE:** Enforced on `Email` and `MachineSerialNumber`.
*   **CHECK Constraints:** 
    *   `Status IN ('Pending', 'Active', 'Inactive', 'Rejected')` to manage the manual approval flow.
    *   `PaymentType = 'Cash'` (as per gym policy).
    *   `Reps > 0` and `Sets > 0` in workout courses.
*   **DEFAULT Constraints:** 
    *   `Status = 'Pending'` for all new signups.
    *   `JoinDate = GETDATE()`.

### 4.2 Relational Modeling
*   **One-to-One (1:1):** `Members` table linked to `MemberMedicalInfo` for health disclosures.
*   **One-to-Many (1:M):** A single `Trainer` can manage many `Members` and write many `WorkoutCourses`.
*   **Many-to-Many (M:N):** `WorkoutCourses` and `Machines` are linked via a `CourseExercises` junction table (one course uses many machines; one machine is used in many courses).

### 4.3 Data Manipulation & Reporting
*   **Data Selection:** Use `DISTINCT` to list all unique machine types and `ORDER BY` with `TOP` to find the most popular machines or the newest member requests.
*   **Aggregates:** Calculate `COUNT` of pending requests, `AVG` duration of memberships, and use `GROUP BY` to see which trainer is managing the most members.
*   **Advanced Joins:** `INNER JOIN` to link Members, their assigned Trainers, and their active Workout Courses into a single view.
*   **Set Operations:** `EXCEPT` to find members who have signed up but have *not* yet been assigned a trainer.
*   **Subqueries:** Using `EXISTS` to identify machines that are currently not included in any active workout courses.

### 4.4 Advanced Database Objects
*   **Stored Procedures:**
    *   `sp_ApproveMember`: A transaction-wrapped procedure that updates member status to 'Active', logs the cash payment, and creates an initial attendance record.
    *   `sp_DeleteMachine`: Handles the removal of old equipment and updates related workout courses.
*   **Triggers:**
    *   **Insert Trigger:** When a member is accepted, automatically insert a "Welcome" log into the `SystemLogs`.
    *   **Update Trigger:** If a member's `Weight` or `Age` is updated, the trigger logs the change in an `AuditTrail` table (storing Old and New values).
    *   **Delete Trigger:** When a member record is removed, it is automatically moved to `ArchiveMembers` for historical data.
*   **Transactions:**
    *   Used in the `sp_ApproveMember` procedure to ensure that the status update and the payment logging both succeed, or both are **Rolled Back**.

## 5. Data Archiving & Logging
The system maintains a **Log Table** for all manager approvals and a **Archive Table** for former members. This ensures the system remains performant while keeping a full history of the gym's growth and equipment lifecycle.
