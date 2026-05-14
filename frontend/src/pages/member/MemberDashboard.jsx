import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/ui/StatusBadge'
import { ArrowRight } from 'lucide-react'

export default function MemberDashboard() {
  const { user } = useAuth()
  const [profile, setProfile]     = useState(null)
  const [courses, setCourses]     = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([api.get('/members/me'), api.get('/members/me/courses'), api.get('/members/me/attendance')])
      .then(([p, c, a]) => { setProfile(p.data); setCourses(c.data.slice(0, 3)); setAttendance(a.data.slice(0, 5)) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64" />
      <div className="grid grid-cols-3 gap-px">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24" />)}</div>
    </div>
  )

  const isPending = profile?.Status === 'Pending'

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between" style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div>
          <div className="section-label mb-1">Member Portal</div>
          <h1 className="text-4xl md:text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
            {user.name.split(' ')[0]}
          </h1>
        </div>
        <StatusBadge status={profile?.Status || 'Pending'} />
      </div>

      {/* Pending notice */}
      {isPending && (
        <div className="p-5" style={{ border: '1px solid var(--b2)', background: 'var(--s2)' }}>
          <div className="section-label mb-2">Action Required</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>
            Visit Halabja Gym in person and pay the membership fee in cash. Your account will be activated by the manager.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: 'var(--b1)', border: '1px solid var(--b1)' }}>
        <div className="p-5" style={{ background: 'var(--bg)' }}>
          <div className="section-label mb-2">Trainer</div>
          <div className="text-base font-700 uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            {profile?.TrainerName || 'None'}
          </div>
          {profile?.Specialty && (
            <div className="text-[11px] mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              {profile.Specialty}
            </div>
          )}
        </div>
        <div className="p-5" style={{ background: 'var(--bg)' }}>
          <div className="section-label mb-2">Active Courses</div>
          <div className="text-[3rem] leading-none font-900" style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            {courses.filter(c => c.IsActive).length}
          </div>
        </div>
        <div className="p-5" style={{ background: 'var(--bg)' }}>
          <div className="section-label mb-2">Last Visit</div>
          <div className="text-sm font-700 uppercase" style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            {attendance[0]
              ? new Date(attendance[0].CheckInTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
              : 'Never'}
          </div>
        </div>
      </div>

      {/* Body metrics */}
      {profile && (
        <div>
          <div className="section-label mb-4">Body Metrics</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: 'var(--b1)', border: '1px solid var(--b1)' }}>
            {[
              ['Weight', profile.Weight ? profile.Weight + ' kg' : '—'],
              ['Height', profile.Height ? profile.Height + ' cm' : '—'],
              ['Gender', profile.Gender || '—'],
              ['Goal', profile.FitnessGoal || '—'],
            ].map(([label, val]) => (
              <div key={label} className="p-4" style={{ background: 'var(--bg)' }}>
                <div className="section-label mb-1">{label}</div>
                <div className="text-sm font-600 truncate" style={{ color: 'var(--t1)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
            <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>My Courses</h2>
            <Link to="/member/courses" className="text-[10px] uppercase tracking-widest flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              All <ArrowRight size={10} />
            </Link>
          </div>
          {courses.length === 0
            ? <div className="p-8 text-sm text-center" style={{ color: 'var(--t3)' }}>No courses assigned yet</div>
            : <div className="divide-y" style={{ borderColor: 'var(--b0)' }}>
                {courses.map(c => (
                  <div key={c.CourseID} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <div className="font-600 text-sm truncate uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                        {c.CourseName}
                      </div>
                      <div className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                        {c.TrainerName} · {c.ExerciseCount} exercises
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-1 shrink-0 uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-mono)', color: c.IsActive ? 'var(--t2)' : 'var(--t3)', border: `1px solid ${c.IsActive ? 'var(--b2)' : 'var(--b0)'}` }}>
                      {c.IsActive ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Attendance */}
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--b1)' }}>
            <h2 className="text-lg font-800 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Attendance</h2>
            <Link to="/member/attendance" className="text-[10px] uppercase tracking-widest flex items-center gap-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              History <ArrowRight size={10} />
            </Link>
          </div>
          {attendance.length === 0
            ? <div className="p-8 text-sm text-center" style={{ color: 'var(--t3)' }}>No visits yet</div>
            : <div className="divide-y" style={{ borderColor: 'var(--b0)' }}>
                {attendance.map(a => (
                  <div key={a.AttendanceID} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <div className="text-sm font-600"
                        style={{ fontFamily: 'var(--font-mono)' }}>
                        {new Date(a.CheckInTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(a.CheckInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    {!a.CheckOutTime && (
                      <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>
                        ● Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
