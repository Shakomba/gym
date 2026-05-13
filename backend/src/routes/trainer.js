const router = require('express').Router()
const { authenticate, requireRole } = require('../middleware/auth')
const { getPool, sql } = require('../db/pool')

router.use(authenticate, requireRole('trainer', 'admin'))

// GET /api/trainer/members — trainer's assigned members
router.get('/members', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('TrainerID', sql.Int, req.user.id)
      .query(`
        SELECT m.MemberID, m.MemberName, m.Email, m.Phone, m.Gender, m.Status,
               m.JoinDate, m.Weight, m.Height, m.FitnessGoal,
               (SELECT COUNT(*) FROM WorkoutCourses wc WHERE wc.MemberID=m.MemberID AND wc.IsActive=1) AS ActiveCourses
        FROM Members m
        WHERE m.TrainerID = @TrainerID AND m.Status = 'Active'
        ORDER BY m.MemberName
      `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/trainer/courses — all courses by this trainer
router.get('/courses', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('TrainerID', sql.Int, req.user.id)
      .query(`
        SELECT wc.*, m.MemberName,
               (SELECT COUNT(*) FROM CourseExercises ce WHERE ce.CourseID=wc.CourseID) AS ExerciseCount
        FROM WorkoutCourses wc
        JOIN Members m ON wc.MemberID = m.MemberID
        WHERE wc.TrainerID = @TrainerID
        ORDER BY wc.CreatedAt DESC
      `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/trainer/courses/:id — course with exercises
router.get('/courses/:id', async (req, res) => {
  try {
    const pool = await getPool()
    const [courseRes, exRes] = await Promise.all([
      pool.request()
        .input('CourseID', sql.Int, req.params.id)
        .query('SELECT wc.*, m.MemberName FROM WorkoutCourses wc JOIN Members m ON wc.MemberID=m.MemberID WHERE wc.CourseID=@CourseID'),
      pool.request()
        .input('CourseID', sql.Int, req.params.id)
        .query(`SELECT ce.*, mc.MachineName, mc.MachineType
                FROM CourseExercises ce
                JOIN Machines mc ON ce.MachineID=mc.MachineID
                WHERE ce.CourseID=@CourseID ORDER BY ce.SortOrder, ce.ExerciseID`)
    ])
    if (!courseRes.recordset.length) return res.status(404).json({ error: 'Course not found' })
    res.json({ ...courseRes.recordset[0], exercises: exRes.recordset })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/trainer/courses — create course
router.post('/courses', async (req, res) => {
  const { memberID, courseName, description, startDate, endDate, exercises } = req.body
  try {
    const pool = await getPool()
    const courseRes = await pool.request()
      .input('CourseName',  sql.NVarChar, courseName)
      .input('TrainerID',   sql.Int, req.user.id)
      .input('MemberID',    sql.Int, memberID)
      .input('Description', sql.NVarChar, description || null)
      .input('StartDate',   sql.Date, startDate ? new Date(startDate) : new Date())
      .input('EndDate',     sql.Date, endDate ? new Date(endDate) : null)
      .query(`INSERT INTO WorkoutCourses (CourseName,TrainerID,MemberID,Description,StartDate,EndDate)
              OUTPUT INSERTED.CourseID
              VALUES (@CourseName,@TrainerID,@MemberID,@Description,@StartDate,@EndDate)`)

    const courseId = courseRes.recordset[0].CourseID

    if (exercises?.length) {
      for (const ex of exercises) {
        await pool.request()
          .input('CourseID',    sql.Int, courseId)
          .input('MachineID',   sql.Int, ex.machineID)
          .input('ExerciseName',sql.NVarChar, ex.exerciseName)
          .input('Sets',        sql.Int, ex.sets)
          .input('Reps',        sql.Int, ex.reps)
          .input('WeightKg',    sql.Decimal(6,2), ex.weightKg || null)
          .input('Frequency',   sql.NVarChar, ex.frequency || null)
          .input('Notes',       sql.NVarChar, ex.notes || null)
          .input('SortOrder',   sql.Int, ex.sortOrder || 0)
          .query(`INSERT INTO CourseExercises (CourseID,MachineID,ExerciseName,Sets,Reps,WeightKg,Frequency,Notes,SortOrder)
                  VALUES (@CourseID,@MachineID,@ExerciseName,@Sets,@Reps,@WeightKg,@Frequency,@Notes,@SortOrder)`)
      }
    }

    res.status(201).json({ message: 'Course created', courseId })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/trainer/courses/:id — update course
router.put('/courses/:id', async (req, res) => {
  const { courseName, description, endDate, isActive } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('CourseID',    sql.Int, req.params.id)
      .input('CourseName',  sql.NVarChar, courseName)
      .input('Description', sql.NVarChar, description || null)
      .input('EndDate',     sql.Date, endDate ? new Date(endDate) : null)
      .input('IsActive',    sql.Bit, isActive ?? 1)
      .query(`UPDATE WorkoutCourses SET CourseName=@CourseName, Description=@Description,
              EndDate=@EndDate, IsActive=@IsActive WHERE CourseID=@CourseID`)
    res.json({ message: 'Course updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/trainer/courses/:id/exercises/:exId
router.delete('/courses/:id/exercises/:exId', async (req, res) => {
  try {
    const pool = await getPool()
    await pool.request()
      .input('ExerciseID', sql.Int, req.params.exId)
      .query('DELETE FROM CourseExercises WHERE ExerciseID=@ExerciseID')
    res.json({ message: 'Exercise removed' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/trainer/stats
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('TrainerID', sql.Int, req.user.id)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM Members WHERE TrainerID=@TrainerID AND Status='Active') AS memberCount,
          (SELECT COUNT(*) FROM WorkoutCourses WHERE TrainerID=@TrainerID AND IsActive=1) AS activeCourses,
          (SELECT COUNT(*) FROM WorkoutCourses WHERE TrainerID=@TrainerID) AS totalCourses
      `)
    res.json(result.recordset[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
