const router = require('express').Router()
const { authenticate } = require('../middleware/auth')
const { getPool, sql } = require('../db/pool')

router.use(authenticate)

// GET /api/members/me — current member profile
router.get('/me', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MemberID', sql.Int, req.user.id)
      .query(`
        SELECT m.*, t.TrainerName, t.Specialty, t.Email AS TrainerEmail
        FROM Members m
        LEFT JOIN Trainers t ON m.TrainerID = t.TrainerID
        WHERE m.MemberID = @MemberID
      `)
    if (!result.recordset.length) return res.status(404).json({ error: 'Member not found' })
    const { PasswordHash, ...member } = result.recordset[0]
    res.json(member)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/members/me/courses — member's workout courses
router.get('/me/courses', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MemberID', sql.Int, req.user.id)
      .query(`
        SELECT wc.*, t.TrainerName,
               (SELECT COUNT(*) FROM CourseExercises ce WHERE ce.CourseID=wc.CourseID) AS ExerciseCount
        FROM WorkoutCourses wc
        JOIN Trainers t ON wc.TrainerID = t.TrainerID
        WHERE wc.MemberID = @MemberID
        ORDER BY wc.IsActive DESC, wc.CreatedAt DESC
      `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/members/me/courses/:id
router.get('/me/courses/:id', async (req, res) => {
  try {
    const pool = await getPool()
    const [courseRes, exRes] = await Promise.all([
      pool.request()
        .input('CourseID', sql.Int, req.params.id)
        .input('MemberID', sql.Int, req.user.id)
        .query('SELECT wc.*, t.TrainerName FROM WorkoutCourses wc JOIN Trainers t ON wc.TrainerID=t.TrainerID WHERE wc.CourseID=@CourseID AND wc.MemberID=@MemberID'),
      pool.request()
        .input('CourseID', sql.Int, req.params.id)
        .query('SELECT ce.*, mc.MachineName, mc.MachineType, mc.Location FROM CourseExercises ce JOIN Machines mc ON ce.MachineID=mc.MachineID WHERE ce.CourseID=@CourseID ORDER BY ce.SortOrder')
    ])
    if (!courseRes.recordset.length) return res.status(404).json({ error: 'Course not found' })
    res.json({ ...courseRes.recordset[0], exercises: exRes.recordset })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/members/me/attendance
router.get('/me/attendance', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('MemberID', sql.Int, req.user.id)
      .query(`SELECT TOP 30 * FROM Attendance WHERE MemberID=@MemberID ORDER BY CheckInTime DESC`)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/members/me — update profile
router.patch('/me', async (req, res) => {
  const { phone, weight, height, fitnessGoal } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MemberID',    sql.Int, req.user.id)
      .input('Phone',       sql.NVarChar, phone || null)
      .input('Weight',      sql.Decimal(5,2), weight || null)
      .input('Height',      sql.Decimal(5,2), height || null)
      .input('FitnessGoal', sql.NVarChar, fitnessGoal || null)
      .query(`UPDATE Members SET Phone=@Phone, Weight=@Weight, Height=@Height,
              FitnessGoal=@FitnessGoal WHERE MemberID=@MemberID`)
    res.json({ message: 'Profile updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
