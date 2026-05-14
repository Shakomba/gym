import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatCard from '../../components/ui/StatCard'
import StatusBadge from '../../components/ui/StatusBadge'
import { ArrowRight } from 'lucide-react'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [requests, setRequests] = useState([])
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/requests'), api.get('/admin/logs')])
      .then(([s, r, l]) => { setStats(s.data); setRequests(r.data.slice(0, 5)); setLogs(l.data.slice(0, 6)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-4 gap-px">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
    </div>
  )

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Admin / Overview</div>
        <h1 className="text-4xl md:text-5xl font-900 uppercase"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
          {user.name.split(' ')[0]}
        </h1>
      </div>

      {/* Stats grid — gap-px creates dividers at any column count */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--b1)', border: '1px solid var(--b1)' }}>
        {[
          ['Pending', stats?.pendingCount ?? 0, 'Awaiting review'],
          ['Active', stats?.activeCount ?? 0, 'Enrolled'],
          ['Trainers', stats?.trainerCount ?? 0, 'On staff'],
          ['Today', stats?.todayAttendance ?? 0, 'Check-ins'],
        ].map(([label, val, sub]) => (
          <div key={label} className="p-6 flex flex-col gap-2" style={{ background: 'var(--bg)' }}>
            <div className="rule-heavy" style={{ height: 2 }} />
            <span className="section-label mt-3">{label}</span>
            <div className="text-[3.5rem] leading-none font-900"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              {val}
            </div>
            <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Pending requests */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--b1)' }}>
            <div>
              <div className="section-label mb-0.5">Queue</div>
              <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Pending Requests</h2>
            </div>
            <Link to="/admin/requests"
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest cursor-pointer"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {requests.length === 0
            ? <div className="px-6 py-10 text-sm text-center" style={{ color: 'var(--t3)' }}>Queue empty</div>
            : <div className="overflow-x-auto"><table className="table-base">
                <thead><tr><th>Name</th><th>Goal</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.MemberID}>
                      <td>
                        <div className="font-600 text-sm">{r.MemberName}</div>
                        <div className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{r.Email}</div>
                      </td>
                      <td className="text-xs max-w-xs truncate" style={{ color: 'var(--t2)' }}>{r.FitnessGoal || '—'}</td>
                      <td className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(r.RequestDate).toLocaleDateString('en-GB')}
                      </td>
                      <td><StatusBadge status={r.Status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
          }
        </div>

        {/* Logs */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
            <div className="section-label mb-0.5">Feed</div>
            <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>System Logs</h2>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {logs.length === 0
              ? <p className="p-5 text-sm" style={{ color: 'var(--t3)' }}>No recent activity</p>
              : logs.map(log => (
                  <div key={log.LogID} className="px-5 py-3 flex gap-3 items-start">
                    <span className="text-[10px] mt-0.5 shrink-0"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                      {new Date(log.CreatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>{log.Description}</p>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--b1)', border: '1px solid var(--b1)' }}>
        <div className="p-6" style={{ background: 'var(--bg)' }}>
          <div className="section-label mb-2">Inventory</div>
          <div className="text-[3rem] font-900" style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            {stats?.machineCount ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>Gym machines</div>
        </div>
        <div className="p-6" style={{ background: 'var(--bg)' }}>
          <div className="section-label mb-2">Total Members</div>
          <div className="text-[3rem] font-900" style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            {stats?.totalMembers ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>All time registrations</div>
        </div>
      </div>
    </div>
  )
}
