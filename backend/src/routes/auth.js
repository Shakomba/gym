const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getPool, sql } = require('../db/pool')

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

  try {
    const pool = await getPool()

    // Check admins
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT AdminID AS id, AdminName AS name, Email AS email, PasswordHash FROM Admins WHERE Email = @email')
    if (result.recordset.length) {
      const admin = result.recordset[0]
      if (!await bcrypt.compare(password, admin.PasswordHash)) return res.status(401).json({ error: 'Invalid credentials' })
      const user = { id: admin.id, name: admin.name, email: admin.email, role: 'admin' }
      return res.json({ token: signToken(user), user })
    }

    // Check trainers
    result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT TrainerID AS id, TrainerName AS name, Email AS email, PasswordHash FROM Trainers WHERE Email = @email AND IsActive = 1')
    if (result.recordset.length) {
      const trainer = result.recordset[0]
      if (!await bcrypt.compare(password, trainer.PasswordHash)) return res.status(401).json({ error: 'Invalid credentials' })
      const user = { id: trainer.id, name: trainer.name, email: trainer.email, role: 'trainer' }
      return res.json({ token: signToken(user), user })
    }

    // Check members
    result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT MemberID AS id, MemberName AS name, Email AS email, PasswordHash, Status FROM Members WHERE Email = @email')
    if (result.recordset.length) {
      const member = result.recordset[0]
      if (!await bcrypt.compare(password, member.PasswordHash)) return res.status(401).json({ error: 'Invalid credentials' })
      const user = { id: member.id, name: member.name, email: member.email, role: 'member', status: member.Status }
      return res.json({ token: signToken(user), user })
    }

    return res.status(401).json({ error: 'Invalid credentials' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, phone, gender, fitnessGoal, dateOfBirth, weight, height } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' })

  try {
    const pool = await getPool()

    // Check duplicate email
    const exists = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT 1 FROM Members WHERE Email = @email UNION SELECT 1 FROM Trainers WHERE Email = @email UNION SELECT 1 FROM Admins WHERE Email = @email')
    if (exists.recordset.length) return res.status(409).json({ error: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)

    const result = await pool.request()
      .input('name',    sql.NVarChar, name)
      .input('email',   sql.NVarChar, email)
      .input('hash',    sql.NVarChar, hash)
      .input('phone',   sql.NVarChar, phone || null)
      .input('gender',  sql.NVarChar, gender || null)
      .input('goal',    sql.NVarChar, fitnessGoal || null)
      .input('dob',     sql.Date,     dateOfBirth ? new Date(dateOfBirth) : null)
      .input('weight',  sql.Decimal(5,2), weight || null)
      .input('height',  sql.Decimal(5,2), height || null)
      .query(`INSERT INTO Members (MemberName,Email,PasswordHash,Phone,Gender,FitnessGoal,DateOfBirth,Weight,Height)
              OUTPUT INSERTED.MemberID
              VALUES (@name,@email,@hash,@phone,@gender,@goal,@dob,@weight,@height)`)

    const memberId = result.recordset[0].MemberID
    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.', memberId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
