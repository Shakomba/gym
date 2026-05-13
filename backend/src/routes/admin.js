const router = require('express').Router()
const { authenticate, requireRole } = require('../middleware/auth')
const { getPool, sql } = require('../db/pool')

router.use(authenticate, requireRole('admin'))

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Members WHERE Status='Pending')  AS pendingCount,
        (SELECT COUNT(*) FROM Members WHERE Status='Active')   AS activeCount,
        (SELECT COUNT(*) FROM Members WHERE Status='Rejected') AS rejectedCount,
        (SELECT COUNT(*) FROM Members)                          AS totalMembers,
        (SELECT COUNT(*) FROM Trainers WHERE IsActive=1)        AS trainerCount,
        (SELECT COUNT(*) FROM Machines)                         AS machineCount,
        (SELECT COUNT(*) FROM Attendance WHERE CAST(CheckInTime AS DATE)=CAST(GETDATE() AS DATE)) AS todayAttendance
    `)
    res.json(result.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/admin/requests — pending member requests
router.get('/requests', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT MemberID,MemberName,Email,Phone,Gender,FitnessGoal,Status,RequestDate,Weight,Height
      FROM Members WHERE Status='Pending'
      ORDER BY RequestDate DESC
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/admin/members
router.get('/members', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT m.MemberID,m.MemberName,m.Email,m.Phone,m.Gender,m.Status,m.RequestDate,m.JoinDate,
             t.TrainerName,m.Weight,m.Height,m.FitnessGoal
      FROM Members m
      LEFT JOIN Trainers t ON m.TrainerID = t.TrainerID
      ORDER BY m.RequestDate DESC
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/admin/approve/:id
router.post('/approve/:id', async (req, res) => {
  const { amount } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MemberID', sql.Int, parseInt(req.params.id))
      .input('AdminID',  sql.Int, req.user.id)
      .input('Amount',   sql.Decimal(10,2), amount || 50)
      .execute('sp_ApproveMember')
    res.json({ message: 'Member approved successfully' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/admin/reject/:id
router.post('/reject/:id', async (req, res) => {
  try {
    const pool = await getPool()
    await pool.request()
      .input('MemberID', sql.Int, parseInt(req.params.id))
      .input('AdminID',  sql.Int, req.user.id)
      .execute('sp_RejectMember')
    res.json({ message: 'Member rejected' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/admin/members/:id/trainer
router.patch('/members/:id/trainer', async (req, res) => {
  const { trainerId } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MemberID',  sql.Int, parseInt(req.params.id))
      .input('TrainerID', sql.Int, trainerId || null)
      .query('UPDATE Members SET TrainerID=@TrainerID WHERE MemberID=@MemberID')
    res.json({ message: 'Trainer assigned' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT TOP 50 * FROM SystemLogs ORDER BY CreatedAt DESC
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/admin/attendance
router.get('/attendance', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT a.AttendanceID, a.CheckInTime, a.CheckOutTime, a.Method, m.MemberName, m.Email
      FROM Attendance a
      JOIN Members m ON a.MemberID = m.MemberID
      ORDER BY a.CheckInTime DESC
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/admin/attendance/checkin
router.post('/attendance/checkin', async (req, res) => {
  const { memberId, method } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MemberID', sql.Int, memberId)
      .input('Method',   sql.NVarChar, method || 'Manual')
      .query('INSERT INTO Attendance (MemberID, Method) VALUES (@MemberID, @Method)')
    res.json({ message: 'Check-in recorded' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/admin/trainers
router.get('/trainers', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT t.TrainerID, t.TrainerName, t.Email, t.Phone, t.Specialty,
             COUNT(m.MemberID) AS MemberCount
      FROM Trainers t
      LEFT JOIN Members m ON m.TrainerID = t.TrainerID AND m.Status='Active'
      WHERE t.IsActive=1
      GROUP BY t.TrainerID, t.TrainerName, t.Email, t.Phone, t.Specialty
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
