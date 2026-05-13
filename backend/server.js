require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth',    require('./src/routes/auth'))
app.use('/api/admin',   require('./src/routes/admin'))
app.use('/api/trainer', require('./src/routes/trainer'))
app.use('/api/members', require('./src/routes/members'))
app.use('/api/machines',require('./src/routes/machines'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Halabja Gym API running on port ${PORT}`))
