const router = require('express').Router()
const { authenticate, requireRole } = require('../middleware/auth')
const { getPool, sql } = require('../db/pool')

router.use(authenticate)

// GET /api/machines
router.get('/', async (req, res) => {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT m.*,
             (SELECT COUNT(*) FROM MaintenanceLogs ml WHERE ml.MachineID=m.MachineID) AS LogCount,
             (SELECT COUNT(*) FROM CourseExercises ce JOIN WorkoutCourses wc ON ce.CourseID=wc.CourseID
              WHERE ce.MachineID=m.MachineID AND wc.IsActive=1) AS ActiveCourseCount
      FROM Machines m
      ORDER BY m.MachineType, m.MachineName
    `)
    res.json(result.recordset)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/machines/:id — with maintenance logs
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool()
    const [machineRes, logsRes] = await Promise.all([
      pool.request().input('MachineID', sql.Int, req.params.id)
        .query('SELECT * FROM Machines WHERE MachineID=@MachineID'),
      pool.request().input('MachineID', sql.Int, req.params.id)
        .query('SELECT * FROM MaintenanceLogs WHERE MachineID=@MachineID ORDER BY ServiceDate DESC')
    ])
    if (!machineRes.recordset.length) return res.status(404).json({ error: 'Machine not found' })
    res.json({ ...machineRes.recordset[0], logs: logsRes.recordset })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/machines — admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { machineName, machineType, serialNumber, manufacturer, purchaseDate, condition, location, notes } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MachineName',  sql.NVarChar, machineName)
      .input('MachineType',  sql.NVarChar, machineType)
      .input('SerialNumber', sql.NVarChar, serialNumber)
      .input('Manufacturer', sql.NVarChar, manufacturer || null)
      .input('PurchaseDate', sql.Date, purchaseDate ? new Date(purchaseDate) : null)
      .input('Condition',    sql.NVarChar, condition || 'Good')
      .input('Location',     sql.NVarChar, location || null)
      .input('Notes',        sql.NVarChar, notes || null)
      .query(`INSERT INTO Machines (MachineName,MachineType,SerialNumber,Manufacturer,PurchaseDate,Condition,Location,Notes)
              VALUES (@MachineName,@MachineType,@SerialNumber,@Manufacturer,@PurchaseDate,@Condition,@Location,@Notes)`)
    res.status(201).json({ message: 'Machine added' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/machines/:id
router.put('/:id', requireRole('admin'), async (req, res) => {
  const { machineName, machineType, condition, location, lastServiceDate, notes } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MachineID',      sql.Int, req.params.id)
      .input('MachineName',    sql.NVarChar, machineName)
      .input('MachineType',    sql.NVarChar, machineType)
      .input('Condition',      sql.NVarChar, condition)
      .input('Location',       sql.NVarChar, location || null)
      .input('LastServiceDate',sql.Date, lastServiceDate ? new Date(lastServiceDate) : null)
      .input('Notes',          sql.NVarChar, notes || null)
      .query(`UPDATE Machines SET MachineName=@MachineName, MachineType=@MachineType,
              Condition=@Condition, Location=@Location, LastServiceDate=@LastServiceDate,
              Notes=@Notes WHERE MachineID=@MachineID`)
    res.json({ message: 'Machine updated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /api/machines/:id — uses stored procedure
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const pool = await getPool()
    await pool.request()
      .input('MachineID', sql.Int, req.params.id)
      .execute('sp_DeleteMachine')
    res.json({ message: 'Machine deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/machines/:id/logs — add maintenance log
router.post('/:id/logs', requireRole('admin'), async (req, res) => {
  const { technicianName, description, cost, nextServiceDate } = req.body
  try {
    const pool = await getPool()
    await pool.request()
      .input('MachineID',      sql.Int, req.params.id)
      .input('TechnicianName', sql.NVarChar, technicianName || null)
      .input('Description',    sql.NVarChar, description)
      .input('Cost',           sql.Decimal(10,2), cost || null)
      .input('NextServiceDate',sql.Date, nextServiceDate ? new Date(nextServiceDate) : null)
      .query(`INSERT INTO MaintenanceLogs (MachineID,TechnicianName,Description,Cost,NextServiceDate)
              VALUES (@MachineID,@TechnicianName,@Description,@Cost,@NextServiceDate)`)

    // Update machine LastServiceDate
    await pool.request()
      .input('MachineID', sql.Int, req.params.id)
      .query('UPDATE Machines SET LastServiceDate=CAST(GETDATE() AS DATE) WHERE MachineID=@MachineID')

    res.status(201).json({ message: 'Maintenance log added' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
