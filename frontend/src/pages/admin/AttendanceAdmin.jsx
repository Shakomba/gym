import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import { UserCheck, Search, RefreshCw } from 'lucide-react'

export default function AttendanceAdmin() {
  const [records, setRecords]   = useState([])
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selectedMember, setSelectedMember] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [a, m] = await Promise.all([api.get('/admin/attendance'), api.get('/admin/members')])
      setRecords(a.data); setMembers(m.data.filter(m => m.Status === 'Active'))
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const checkIn = async () => {
    if (!selectedMember) { toast('Select a member', 'error'); return }
    setCheckingIn(true)
    try {
      await api.post('/admin/attendance/checkin', { memberId: parseInt(selectedMember), method: 'Manual' })
      toast('Check-in recorded', 'success'); setSelectedMember(''); load()
    } catch { toast('Failed', 'error') }
    finally { setCheckingIn(false) }
  }

  const filtered = records.filter(r => r.MemberName?.toLowerCase().includes(search.toLowerCase()))

  const dur = (i, o) => {
    if (!o) return <span style={{ color:'var(--t1)' }}>● Active</span>
    const m = Math.round((new Date(o) - new Date(i)) / 60000)
    return `${Math.floor(m/60)}h ${m%60}m`
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Attendance</h1>
      </div>

      {/* Manual check-in */}
      <div className="p-5" style={{ border: '1px solid var(--b1)', background: 'var(--s1)' }}>
        <div className="section-label mb-3">Manual Check-In</div>
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-sm">
            <label className="section-label mb-1.5">Select Member</label>
            <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="input-base text-sm">
              <option value="">— Active members —</option>
              {members.map(m => <option key={m.MemberID} value={m.MemberID}>{m.MemberName}</option>)}
            </select>
          </div>
          <button onClick={checkIn} disabled={checkingIn || !selectedMember} className="btn-primary">
            <UserCheck size={14} /> {checkingIn ? 'Recording…' : 'Check In'}
          </button>
        </div>
      </div>

      {/* Records */}
      <div style={{ border: '1px solid var(--b1)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
          <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Records</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--t3)' }} />
              <input type="text" placeholder="Filter…" value={search} onChange={e => setSearch(e.target.value)}
                className="input-base pl-8 text-xs" style={{ width: 180 }} />
            </div>
            <button onClick={load} className="btn-secondary px-3 py-2"><RefreshCw size={12} /></button>
          </div>
        </div>
        {loading
          ? <div className="p-8 text-center text-sm" style={{ color:'var(--t3)' }}>Loading…</div>
          : <table className="table-base">
              <thead><tr><th>Member</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Method</th></tr></thead>
              <tbody>
                {filtered.slice(0,50).map(r => (
                  <tr key={r.AttendanceID}>
                    <td>
                      <div className="font-600 text-sm">{r.MemberName}</div>
                      <div className="text-[11px]" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>{r.Email}</div>
                    </td>
                    <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>
                      {new Date(r.CheckInTime).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>
                      {r.CheckOutTime ? new Date(r.CheckOutTime).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : '—'}
                    </td>
                    <td className="text-xs">{dur(r.CheckInTime, r.CheckOutTime)}</td>
                    <td>
                      <span className="text-[10px] px-2 py-1 uppercase tracking-wider"
                        style={{ fontFamily:'var(--font-mono)', color:'var(--t3)', border:'1px solid var(--b1)' }}>
                        {r.Method}
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
