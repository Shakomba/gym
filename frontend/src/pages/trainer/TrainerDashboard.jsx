import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Plus, ArrowRight } from 'lucide-react'

export default function TrainerDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [members, setMembers] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/trainer/stats'), api.get('/trainer/members'), api.get('/trainer/courses')])
      .then(([s, m, c]) => { setStats(s.data); setMembers(m.data.slice(0, 5)); setCourses(c.data.slice(0, 4)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-3 gap-px">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28" />)}</div>
    </div>
  )

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-end justify-between" style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div>
          <div className="section-label mb-1">Trainer Portal</div>
          <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            {user.name.split(' ')[0]}
          </h1>
        </div>
        <Link to="/trainer/courses" className="btn-primary">
          <Plus size={14} /> New Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3" style={{ border: '1px solid var(--b1)' }}>
        {[
          ['Members', stats?.memberCount ?? 0, 'Active assigned'],
          ['Active Courses', stats?.activeCourses ?? 0, 'Running programs'],
          ['Total', stats?.totalCourses ?? 0, 'All courses'],
        ].map(([label, val, sub], i) => (
          <div key={label} className="p-6"
            style={{ borderRight: i < 2 ? '1px solid var(--b1)' : 'none' }}>
            <div className="rule-heavy" style={{ height: 2 }} />
            <span className="section-label mt-3 block">{label}</span>
            <div className="text-[3.5rem] leading-none font-900 mt-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>{val}</div>
            <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
            <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>My Members</h2>
            <Link to="/trainer/members"
              className="text-[10px] uppercase tracking-widest flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              All <ArrowRight size={10} />
            </Link>
          </div>
          {members.length === 0
            ? <div className="p-8 text-sm text-center" style={{ color: 'var(--t3)' }}>No members assigned</div>
            : <div className="divide-y" style={{ borderColor: 'var(--b0)' }}>
                {members.map(m => (
                  <div key={m.MemberID} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 flex items-center justify-center text-[11px] font-800 shrink-0"
                      style={{ background: 'var(--s3)', color: 'var(--t1)', fontFamily: 'var(--font-display)' }}>
                      {m.MemberName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-600 text-sm truncate">{m.MemberName}</div>
                      <div className="text-[11px] truncate" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                        {m.FitnessGoal || m.Email}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 font-700 uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)', border: '1px solid var(--b1)' }}>
                      {m.ActiveCourses}c
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Courses */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
            <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Recent Courses</h2>
            <Link to="/trainer/courses"
              className="text-[10px] uppercase tracking-widest flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              Manage <ArrowRight size={10} />
            </Link>
          </div>
          {courses.length === 0
            ? <div className="p-8 text-sm text-center" style={{ color: 'var(--t3)' }}>No courses yet</div>
            : <div className="divide-y" style={{ borderColor: 'var(--b0)' }}>
                {courses.map(c => (
                  <div key={c.CourseID} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-600 text-sm truncate uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                          {c.CourseName}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                          {c.MemberName} · {c.ExerciseCount} ex
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-1 uppercase tracking-wider shrink-0"
                        style={{
                          fontFamily: 'var(--font-mono)',
                          color: c.IsActive ? 'var(--t2)' : 'var(--t3)',
                          border: `1px solid ${c.IsActive ? 'var(--b2)' : 'var(--b0)'}`,
                        }}>
                        {c.IsActive ? 'Active' : 'Off'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
