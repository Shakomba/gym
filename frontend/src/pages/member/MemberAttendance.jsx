import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function MemberAttendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/members/me/attendance').then(r => setRecords(r.data)).finally(() => setLoading(false))
  }, [])

  const dur = (i, o) => {
    if (!o) return null
    const m = Math.round((new Date(o) - new Date(i)) / 60000)
    return `${Math.floor(m/60)}h ${m%60}m`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Member</div>
        <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Attendance</h1>
      </div>

      <div style={{ border: '1px solid var(--b1)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--b1)' }}>
          <div className="section-label mb-1">Total Visits</div>
          <div className="text-[4rem] leading-none font-900" style={{ fontFamily:'var(--font-display)', color:'var(--t1)' }}>
            {records.length}
          </div>
        </div>

        {loading
          ? <div className="p-8 text-center text-sm" style={{ color:'var(--t3)' }}>Loading…</div>
          : records.length === 0
            ? <div className="p-8 text-center text-sm" style={{ color:'var(--t3)' }}>No visits yet</div>
            : <table className="table-base">
                <thead><tr><th>#</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Method</th></tr></thead>
                <tbody>
                  {records.map((a, i) => (
                    <tr key={a.AttendanceID}>
                      <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>{i+1}</td>
                      <td className="font-600 text-sm">
                        {new Date(a.CheckInTime).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>
                        {new Date(a.CheckInTime).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
                      </td>
                      <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>
                        {a.CheckOutTime
                          ? new Date(a.CheckOutTime).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
                          : <span style={{ color:'var(--t1)' }}>● Active</span>
                        }
                      </td>
                      <td className="text-xs font-600" style={{ fontFamily:'var(--font-mono)' }}>{dur(a.CheckInTime, a.CheckOutTime) || '—'}</td>
                      <td>
                        <span className="text-[10px] px-2 py-1 uppercase tracking-wider"
                          style={{ fontFamily:'var(--font-mono)', color:'var(--t3)', border:'1px solid var(--b1)' }}>
                          {a.Method}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
        }
      </div>
    </div>
  )
}
