const sql = require('mssql')
require('dotenv').config()

const config = {
  server:   process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'HalabjGymDB',
  user:     process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt:              process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
}

let pool = null

async function getPool() {
  if (pool) return pool
  const retries = 10
  for (let i = 1; i <= retries; i++) {
    try {
      pool = await sql.connect(config)
      console.log('[db] Connected to SQL Server')
      return pool
    } catch (err) {
      console.warn(`[db] Connection attempt ${i}/${retries} failed: ${err.message}`)
      if (i === retries) throw err
      await new Promise(r => setTimeout(r, 4000))
    }
  }
}

module.exports = { getPool, sql }
