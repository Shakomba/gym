-- ============================================================
-- Halabja Gym Management System - SQL Server Schema
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'HalabjGymDB')
    DROP DATABASE HalabjGymDB;
GO

CREATE DATABASE HalabjGymDB;
GO

USE HalabjGymDB;
GO

-- ============================================================
-- TABLES
-- ============================================================

-- Trainers
CREATE TABLE Trainers (
    TrainerID   INT IDENTITY(1,1) PRIMARY KEY,
    TrainerName NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Phone       NVARCHAR(20),
    Specialty   NVARCHAR(100),
    HireDate    DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    IsActive    BIT NOT NULL DEFAULT 1
);
GO

-- Members
CREATE TABLE Members (
    MemberID    INT IDENTITY(1,1) PRIMARY KEY,
    MemberName  NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Phone       NVARCHAR(20),
    DateOfBirth DATE,
    Gender      NVARCHAR(10) CHECK (Gender IN ('Male', 'Female', 'Other')),
    FitnessGoal NVARCHAR(255),
    Status      NVARCHAR(20) NOT NULL DEFAULT 'Pending'
                    CHECK (Status IN ('Pending', 'Active', 'Inactive', 'Rejected')),
    RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
    JoinDate    DATETIME DEFAULT GETDATE(),
    TrainerID   INT REFERENCES Trainers(TrainerID),
    Weight      DECIMAL(5,2),
    Height      DECIMAL(5,2)
);
GO

-- MemberMedicalInfo (1:1 with Members)
CREATE TABLE MemberMedicalInfo (
    MedicalID       INT IDENTITY(1,1) PRIMARY KEY,
    MemberID        INT NOT NULL UNIQUE REFERENCES Members(MemberID) ON DELETE CASCADE,
    BloodType       NVARCHAR(5),
    Allergies       NVARCHAR(500),
    MedicalConditions NVARCHAR(1000),
    EmergencyContact NVARCHAR(100),
    EmergencyPhone  NVARCHAR(20),
    LastUpdated     DATETIME DEFAULT GETDATE()
);
GO

-- Admins
CREATE TABLE Admins (
    AdminID     INT IDENTITY(1,1) PRIMARY KEY,
    AdminName   NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Machines
CREATE TABLE Machines (
    MachineID       INT IDENTITY(1,1) PRIMARY KEY,
    MachineName     NVARCHAR(100) NOT NULL,
    MachineType     NVARCHAR(50) NOT NULL,
    SerialNumber    NVARCHAR(50) NOT NULL UNIQUE,
    Manufacturer    NVARCHAR(100),
    PurchaseDate    DATE,
    Condition       NVARCHAR(20) NOT NULL DEFAULT 'Good'
                        CHECK (Condition IN ('Excellent', 'Good', 'Fair', 'Under Maintenance', 'Retired')),
    LastServiceDate DATE,
    Location        NVARCHAR(100),
    Notes           NVARCHAR(500)
);
GO

-- MaintenanceLogs
CREATE TABLE MaintenanceLogs (
    LogID           INT IDENTITY(1,1) PRIMARY KEY,
    MachineID       INT NOT NULL REFERENCES Machines(MachineID) ON DELETE CASCADE,
    ServiceDate     DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    TechnicianName  NVARCHAR(100),
    Description     NVARCHAR(1000) NOT NULL,
    Cost            DECIMAL(10,2),
    NextServiceDate DATE
);
GO

-- WorkoutCourses
CREATE TABLE WorkoutCourses (
    CourseID    INT IDENTITY(1,1) PRIMARY KEY,
    CourseName  NVARCHAR(100) NOT NULL,
    TrainerID   INT NOT NULL REFERENCES Trainers(TrainerID),
    MemberID    INT NOT NULL REFERENCES Members(MemberID) ON DELETE CASCADE,
    Description NVARCHAR(1000),
    StartDate   DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    EndDate     DATE,
    IsActive    BIT NOT NULL DEFAULT 1,
    CreatedAt   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- CourseExercises (M:N junction: WorkoutCourses <-> Machines)
CREATE TABLE CourseExercises (
    ExerciseID  INT IDENTITY(1,1) PRIMARY KEY,
    CourseID    INT NOT NULL REFERENCES WorkoutCourses(CourseID) ON DELETE CASCADE,
    MachineID   INT NOT NULL REFERENCES Machines(MachineID),
    ExerciseName NVARCHAR(100) NOT NULL,
    Sets        INT NOT NULL CHECK (Sets > 0),
    Reps        INT NOT NULL CHECK (Reps > 0),
    WeightKg    DECIMAL(6,2),
    Frequency   NVARCHAR(50),
    Notes       NVARCHAR(500),
    SortOrder   INT DEFAULT 0
);
GO

-- Payments
CREATE TABLE Payments (
    PaymentID   INT IDENTITY(1,1) PRIMARY KEY,
    MemberID    INT NOT NULL REFERENCES Members(MemberID),
    Amount      DECIMAL(10,2) NOT NULL,
    PaymentType NVARCHAR(10) NOT NULL DEFAULT 'Cash' CHECK (PaymentType = 'Cash'),
    PaymentDate DATETIME NOT NULL DEFAULT GETDATE(),
    AdminID     INT REFERENCES Admins(AdminID),
    Notes       NVARCHAR(500)
);
GO

-- Attendance
CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    MemberID    INT NOT NULL REFERENCES Members(MemberID),
    CheckInTime DATETIME NOT NULL DEFAULT GETDATE(),
    CheckOutTime DATETIME,
    Method      NVARCHAR(20) DEFAULT 'Manual' CHECK (Method IN ('Manual', 'QR'))
);
GO

-- SystemLogs
CREATE TABLE SystemLogs (
    LogID       INT IDENTITY(1,1) PRIMARY KEY,
    EventType   NVARCHAR(50) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    UserID      INT,
    UserRole    NVARCHAR(20),
    CreatedAt   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- AuditTrail
CREATE TABLE AuditTrail (
    AuditID     INT IDENTITY(1,1) PRIMARY KEY,
    TableName   NVARCHAR(50) NOT NULL,
    RecordID    INT NOT NULL,
    FieldName   NVARCHAR(50) NOT NULL,
    OldValue    NVARCHAR(500),
    NewValue    NVARCHAR(500),
    ChangedAt   DATETIME NOT NULL DEFAULT GETDATE(),
    ChangedBy   INT
);
GO

-- ArchiveMembers
CREATE TABLE ArchiveMembers (
    ArchiveID   INT IDENTITY(1,1) PRIMARY KEY,
    OrigMemberID INT NOT NULL,
    MemberName  NVARCHAR(100) NOT NULL,
    Email       NVARCHAR(150) NOT NULL,
    Phone       NVARCHAR(20),
    FitnessGoal NVARCHAR(255),
    Status      NVARCHAR(20),
    RequestDate DATETIME,
    JoinDate    DATETIME,
    ArchivedAt  DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

-- sp_ApproveMember: Approve a member request (with transaction)
CREATE OR ALTER PROCEDURE sp_ApproveMember
    @MemberID INT,
    @AdminID  INT,
    @Amount   DECIMAL(10,2) = 50.00
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Validate member exists and is Pending
        IF NOT EXISTS (SELECT 1 FROM Members WHERE MemberID = @MemberID AND Status = 'Pending')
        BEGIN
            RAISERROR('Member not found or not in Pending status.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Update member status to Active
        UPDATE Members SET Status = 'Active', JoinDate = GETDATE() WHERE MemberID = @MemberID;

        -- Log cash payment
        INSERT INTO Payments (MemberID, Amount, PaymentType, PaymentDate, AdminID)
        VALUES (@MemberID, @Amount, 'Cash', GETDATE(), @AdminID);

        -- Create initial attendance record
        INSERT INTO Attendance (MemberID, CheckInTime, Method)
        VALUES (@MemberID, GETDATE(), 'Manual');

        COMMIT TRANSACTION;
        SELECT 'Member approved successfully.' AS Message;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- sp_RejectMember
CREATE OR ALTER PROCEDURE sp_RejectMember
    @MemberID INT,
    @AdminID  INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Members SET Status = 'Rejected' WHERE MemberID = @MemberID;
    INSERT INTO SystemLogs (EventType, Description, UserID, UserRole)
    VALUES ('MemberRejected', CONCAT('Member ID ', @MemberID, ' was rejected.'), @AdminID, 'Admin');
END;
GO

-- sp_DeleteMachine: Remove machine and update related courses
CREATE OR ALTER PROCEDURE sp_DeleteMachine
    @MachineID INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @MachineName NVARCHAR(100);
        SELECT @MachineName = MachineName FROM Machines WHERE MachineID = @MachineID;

        -- Remove from course exercises
        DELETE FROM CourseExercises WHERE MachineID = @MachineID;

        -- Delete machine
        DELETE FROM Machines WHERE MachineID = @MachineID;

        INSERT INTO SystemLogs (EventType, Description)
        VALUES ('MachineDeleted', CONCAT('Machine "', @MachineName, '" (ID: ', @MachineID, ') was deleted.'));

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ============================================================
-- TRIGGERS
-- ============================================================

-- INSERT TRIGGER: When member is activated, log welcome message
CREATE OR ALTER TRIGGER trg_MemberApproved
ON Members AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE(Status)
    BEGIN
        INSERT INTO SystemLogs (EventType, Description, UserID, UserRole)
        SELECT
            'MemberWelcome',
            CONCAT('Welcome! Member "', i.MemberName, '" (ID: ', i.MemberID, ') has been activated.'),
            i.MemberID,
            'Member'
        FROM inserted i
        INNER JOIN deleted d ON i.MemberID = d.MemberID
        WHERE i.Status = 'Active' AND d.Status != 'Active';
    END
END;
GO

-- UPDATE TRIGGER: Log Weight/Age changes to AuditTrail
CREATE OR ALTER TRIGGER trg_MemberBodyAudit
ON Members AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Log weight changes
    IF UPDATE(Weight)
    BEGIN
        INSERT INTO AuditTrail (TableName, RecordID, FieldName, OldValue, NewValue)
        SELECT 'Members', i.MemberID, 'Weight',
               CAST(d.Weight AS NVARCHAR), CAST(i.Weight AS NVARCHAR)
        FROM inserted i
        INNER JOIN deleted d ON i.MemberID = d.MemberID
        WHERE ISNULL(i.Weight, -1) <> ISNULL(d.Weight, -1);
    END

    -- Log height changes
    IF UPDATE(Height)
    BEGIN
        INSERT INTO AuditTrail (TableName, RecordID, FieldName, OldValue, NewValue)
        SELECT 'Members', i.MemberID, 'Height',
               CAST(d.Height AS NVARCHAR), CAST(i.Height AS NVARCHAR)
        FROM inserted i
        INNER JOIN deleted d ON i.MemberID = d.MemberID
        WHERE ISNULL(i.Height, -1) <> ISNULL(d.Height, -1);
    END
END;
GO

-- DELETE TRIGGER: Archive member before deletion
CREATE OR ALTER TRIGGER trg_ArchiveMember
ON Members INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ArchiveMembers (OrigMemberID, MemberName, Email, Phone, FitnessGoal, Status, RequestDate, JoinDate)
    SELECT MemberID, MemberName, Email, Phone, FitnessGoal, Status, RequestDate, JoinDate
    FROM deleted;

    DELETE m FROM Members m
    INNER JOIN deleted d ON m.MemberID = d.MemberID;
END;
GO

-- ============================================================
-- VIEWS (for reporting queries)
-- ============================================================

-- Active members with their trainer and course
CREATE OR ALTER VIEW vw_ActiveMemberOverview AS
SELECT
    m.MemberID,
    m.MemberName,
    m.Email,
    m.Status,
    m.JoinDate,
    t.TrainerName,
    t.Specialty,
    wc.CourseName,
    wc.IsActive AS CourseActive
FROM Members m
LEFT JOIN Trainers t ON m.TrainerID = t.TrainerID
LEFT JOIN WorkoutCourses wc ON wc.MemberID = m.MemberID AND wc.IsActive = 1
WHERE m.Status = 'Active';
GO

-- Trainer workload
CREATE OR ALTER VIEW vw_TrainerWorkload AS
SELECT
    t.TrainerID,
    t.TrainerName,
    t.Specialty,
    COUNT(m.MemberID) AS MemberCount
FROM Trainers t
LEFT JOIN Members m ON m.TrainerID = t.TrainerID AND m.Status = 'Active'
GROUP BY t.TrainerID, t.TrainerName, t.Specialty;
GO

-- Machines not in any active course (EXISTS subquery)
CREATE OR ALTER VIEW vw_UnusedMachines AS
SELECT m.*
FROM Machines m
WHERE NOT EXISTS (
    SELECT 1 FROM CourseExercises ce
    INNER JOIN WorkoutCourses wc ON ce.CourseID = wc.CourseID
    WHERE ce.MachineID = m.MachineID AND wc.IsActive = 1
);
GO

-- Members without a trainer (EXCEPT set operation)
CREATE OR ALTER VIEW vw_MembersWithoutTrainer AS
SELECT MemberID, MemberName, Email, Status FROM Members WHERE Status = 'Active'
EXCEPT
SELECT m.MemberID, m.MemberName, m.Email, m.Status
FROM Members m
WHERE m.TrainerID IS NOT NULL AND m.Status = 'Active';
GO

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed Admins (password: admin123)
INSERT INTO Admins (AdminName, Email, PasswordHash)
VALUES ('Manager Omar', 'admin@halabja.gym',
        '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2');

-- Seed Trainers (password: trainer123)
INSERT INTO Trainers (TrainerName, Email, PasswordHash, Phone, Specialty)
VALUES
    ('Ahmad Kareem',  'ahmad@halabja.gym',  '$2b$10$PFcWKiA8weI2jMxWwcOe7ek8gI650vEPQiq9ctPlc3BpP5nloWBK6', '07701234567', 'Strength & Conditioning'),
    ('Sara Hassan',   'sara@halabja.gym',   '$2b$10$PFcWKiA8weI2jMxWwcOe7ek8gI650vEPQiq9ctPlc3BpP5nloWBK6', '07701234568', 'Cardio & Endurance'),
    ('Dara Mahmoud',  'dara@halabja.gym',   '$2b$10$PFcWKiA8weI2jMxWwcOe7ek8gI650vEPQiq9ctPlc3BpP5nloWBK6', '07701234569', 'Weight Loss');

-- Seed Machines
INSERT INTO Machines (MachineName, MachineType, SerialNumber, Manufacturer, PurchaseDate, Condition, Location)
VALUES
    ('Treadmill Pro 3000',   'Treadmill',       'TM-001-2022', 'LifeFitness',  '2022-01-15', 'Good',      'Cardio Zone'),
    ('Lat Pulldown Station', 'Lat Pulldown',    'LP-002-2022', 'Hammer Strength', '2022-03-10', 'Excellent', 'Upper Body'),
    ('Smith Machine A',      'Smith Machine',   'SM-003-2021', 'Body-Solid',   '2021-06-20', 'Good',      'Free Weights'),
    ('Leg Press 45°',        'Leg Press',       'LG-004-2022', 'Matrix',       '2022-02-08', 'Excellent', 'Lower Body'),
    ('Cable Crossover',      'Cable Machine',   'CC-005-2021', 'LifeFitness',  '2021-09-12', 'Fair',      'Upper Body'),
    ('Rowing Machine',       'Rowing',          'RM-006-2023', 'Concept2',     '2023-01-05', 'Excellent', 'Cardio Zone'),
    ('Chest Press Machine',  'Chest Press',     'CP-007-2022', 'Nautilus',     '2022-07-18', 'Good',      'Upper Body'),
    ('Elliptical Trainer',   'Elliptical',      'ET-008-2022', 'Precor',       '2022-04-22', 'Good',      'Cardio Zone'),
    ('Seated Row Machine',   'Row Machine',     'SR-009-2021', 'Cybex',        '2021-11-30', 'Under Maintenance', 'Upper Body'),
    ('Leg Curl Machine',     'Leg Curl',        'LC-010-2023', 'Matrix',       '2023-03-14', 'Excellent', 'Lower Body');

-- Seed Members
INSERT INTO Members (MemberName, Email, PasswordHash, Phone, Gender, FitnessGoal, Status, RequestDate, TrainerID, Weight, Height)
VALUES
    ('Ali Hassan',      'ali@example.com',    '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07701111111', 'Male',   'Build muscle',        'Active',   DATEADD(day,-30,GETDATE()), 1, 82.5, 175.0),
    ('Nour Saleh',      'nour@example.com',   '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07702222222', 'Female', 'Lose weight',         'Active',   DATEADD(day,-25,GETDATE()), 2, 65.0, 162.0),
    ('Karzan Farid',    'karzan@example.com', '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07703333333', 'Male',   'General fitness',     'Pending',  DATEADD(day,-2, GETDATE()),  NULL, 78.0, 180.0),
    ('Lana Omar',       'lana@example.com',   '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07704444444', 'Female', 'Increase endurance',  'Pending',  DATEADD(day,-1, GETDATE()),  NULL, 58.0, 158.0),
    ('Soran Bakr',      'soran@example.com',  '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07705555555', 'Male',   'Powerlifting',        'Active',   DATEADD(day,-45,GETDATE()), 1, 95.0, 183.0),
    ('Dilnoza Ahmed',   'dilnoza@example.com','$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07706666666', 'Female', 'Tone body',           'Rejected', DATEADD(day,-10,GETDATE()), NULL, 60.0, 165.0),
    ('Rawaz Ibrahim',   'rawaz@example.com',  '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07707777777', 'Male',   'Marathon training',   'Active',   DATEADD(day,-60,GETDATE()), 2, 72.0, 177.0),
    ('Shirin Majid',    'shirin@example.com', '$2b$10$wXvmnrqsy83hkuFhgWeJKe8l9tYsD/2tji1FcuoUTyszXy43lOkI2', '07708888888', 'Female', 'Core strength',       'Pending',  GETDATE(),                  NULL, 55.0, 160.0);

-- Seed Medical Info
INSERT INTO MemberMedicalInfo (MemberID, BloodType, Allergies, MedicalConditions, EmergencyContact, EmergencyPhone)
VALUES
    (1, 'O+',  'None',    'None',         'Hassan Ali',   '07709999990'),
    (2, 'A+',  'Pollen',  'Mild asthma',  'Saleh Nour',   '07709999991'),
    (5, 'B+',  'None',    'None',         'Bakr Family',  '07709999992'),
    (7, 'AB-', 'Dairy',   'None',         'Ibrahim Rawaz','07709999993');

-- Seed Workout Courses
INSERT INTO WorkoutCourses (CourseName, TrainerID, MemberID, Description, StartDate, IsActive)
VALUES
    ('Ali Strength Program',      1, 1, 'Full body strength training program for muscle building', DATEADD(day,-25,GETDATE()), 1),
    ('Nour Fat Loss Program',     2, 2, 'Cardio and light weights program for weight loss',        DATEADD(day,-20,GETDATE()), 1),
    ('Soran Powerlifting Phase 1',1, 5, 'Powerlifting preparation: squat, bench, deadlift focus', DATEADD(day,-40,GETDATE()), 1),
    ('Rawaz Marathon Prep',       2, 7, 'Endurance and running conditioning program',              DATEADD(day,-55,GETDATE()), 1);

-- Seed Course Exercises
INSERT INTO CourseExercises (CourseID, MachineID, ExerciseName, Sets, Reps, WeightKg, Frequency, Notes)
VALUES
    (1, 2, 'Lat Pulldown',      4, 10, 60.0,  '3x per week', 'Wide grip, full range of motion'),
    (1, 3, 'Smith Machine Squat', 4, 8, 80.0, '3x per week', 'Parallel depth minimum'),
    (1, 7, 'Chest Press',       3, 12, 50.0,  '3x per week', 'Control the negative'),
    (2, 1, 'Treadmill Run',     1, 30, NULL,  '5x per week', '30 minutes at 8km/h'),
    (2, 8, 'Elliptical',        1, 20, NULL,  '3x per week', '20 minutes low impact'),
    (3, 3, 'Smith Machine Squat', 5, 5, 120.0,'3x per week', 'Heavy compound'),
    (3, 4, 'Leg Press',         4, 8,  150.0, '2x per week', 'Full range'),
    (4, 1, 'Treadmill Intervals',1,45, NULL,  '4x per week', 'Interval training: 2min fast / 1min walk'),
    (4, 6, 'Rowing Machine',    3, 15, NULL,  '3x per week', 'Full stroke, 500m splits');

-- Seed Payments
INSERT INTO Payments (MemberID, Amount, PaymentType, AdminID)
VALUES (1, 50.00, 'Cash', 1), (2, 50.00, 'Cash', 1),
       (5, 50.00, 'Cash', 1), (7, 50.00, 'Cash', 1);

-- Seed Attendance
INSERT INTO Attendance (MemberID, CheckInTime, CheckOutTime)
VALUES
    (1, DATEADD(hour,-3,GETDATE()), DATEADD(hour,-1,GETDATE())),
    (2, DATEADD(day,-1,GETDATE()),  DATEADD(day,-1,DATEADD(hour,1,GETDATE()))),
    (5, DATEADD(hour,-5,GETDATE()), DATEADD(hour,-3,GETDATE())),
    (7, DATEADD(day,-2,GETDATE()),  DATEADD(day,-2,DATEADD(hour,2,GETDATE())));

-- Seed Maintenance Logs
INSERT INTO MaintenanceLogs (MachineID, ServiceDate, TechnicianName, Description, Cost, NextServiceDate)
VALUES
    (5, DATEADD(month,-2,GETDATE()), 'Tech Services LLC', 'Cable replacement and tension adjustment', 120.00, DATEADD(month,4,GETDATE())),
    (9, DATEADD(day,-5,GETDATE()),   'Tech Services LLC', 'Seat mechanism repair, awaiting parts',     80.00,  DATEADD(month,1,GETDATE())),
    (1, DATEADD(month,-1,GETDATE()), 'In-house',          'Belt lubrication and speed sensor calibration', 0.00, DATEADD(month,5,GETDATE()));

PRINT 'Halabja Gym database created and seeded successfully.';
GO
