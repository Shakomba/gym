import { useState, useEffect } from 'react'
import api from '../../api/client'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function MemberCourses() {
  const [courses, setCourses] = useState([])
  const [details, setDetails] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/members/me/courses').then(r => setCourses(r.data)).finally(() => setLoading(false))
  }, [])

  const toggle = async id => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!details[id]) {
      try { const r = await api.get(`/members/me/courses/${id}`); setDetails(p => ({...p, [id]: r.data})) } catch {}
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Member</div>
        <h1 className="text-4xl md:text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>My Courses</h1>
      </div>

      {loading
        ? <div className="space-y-px">{[...Array(3)].map((_,i) => <div key={i} className="skeleton h-16" />)}</div>
        : courses.length === 0
          ? <div className="py-16 text-center text-sm" style={{ color: 'var(--t3)' }}>No courses assigned. Your trainer will create one for you.</div>
          : <div className="space-y-px">
              {courses.map(c => {
                const d = details[c.CourseID]
                return (
                  <div key={c.CourseID} style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                    <button onClick={() => toggle(c.CourseID)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
                      style={{ background:'transparent' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div className="flex-1 min-w-0">
                        <div className="font-700 text-sm uppercase" style={{ fontFamily:'var(--font-display)' }}>{c.CourseName}</div>
                        <div className="text-[11px] mt-0.5" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>
                          {c.TrainerName} · {c.ExerciseCount} exercises · {new Date(c.StartDate).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0"
                        style={{ fontFamily:'var(--font-mono)', color: c.IsActive?'var(--t2)':'var(--t3)', border:`1px solid ${c.IsActive?'var(--b2)':'var(--b0)'}` }}>
                        {c.IsActive ? 'Active' : 'Off'}
                      </span>
                      {expanded === c.CourseID ? <ChevronUp size={13} style={{color:'var(--t3)'}} /> : <ChevronDown size={13} style={{color:'var(--t3)'}} />}
                    </button>

                    {expanded === c.CourseID && (
                      <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: '1px solid var(--b0)' }}>
                        {c.Description && <p className="text-sm py-3" style={{ color:'var(--t2)' }}>{c.Description}</p>}
                        {!d ? <div className="py-3 text-xs" style={{ color:'var(--t3)' }}>Loading…</div>
                          : d.exercises?.length === 0
                            ? <p className="py-3 text-xs" style={{ color:'var(--t3)' }}>No exercises</p>
                            : <div className="mt-3">
                                <div className="section-label mb-3">Exercise Breakdown</div>
                                <div className="space-y-px">
                                  {d.exercises.map(ex => (
                                    <div key={ex.ExerciseID} className="p-4"
                                      style={{ background:'var(--s2)', border:'1px solid var(--b0)' }}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <div className="font-700 text-sm uppercase" style={{ fontFamily:'var(--font-display)' }}>{ex.ExerciseName}</div>
                                          <div className="text-[11px] mt-0.5" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>
                                            {ex.MachineName} · {ex.MachineType} · {ex.Location}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-2xl font-900 leading-none"
                                            style={{ fontFamily:'var(--font-display)', color:'var(--t1)' }}>
                                            {ex.Sets}<span style={{ color:'var(--t3)', fontSize:14 }}>×</span>{ex.Reps}
                                          </div>
                                          <div className="text-[10px] mt-0.5" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>
                                            sets × reps
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {ex.WeightKg && (
                                          <span className="text-[10px] px-2 py-1 uppercase tracking-wider"
                                            style={{ fontFamily:'var(--font-mono)', color:'var(--t2)', border:'1px solid var(--b1)' }}>
                                            {ex.WeightKg} kg
                                          </span>
                                        )}
                                        {ex.Frequency && (
                                          <span className="text-[10px] px-2 py-1 uppercase tracking-wider"
                                            style={{ fontFamily:'var(--font-mono)', color:'var(--t2)', border:'1px solid var(--b1)' }}>
                                            {ex.Frequency}
                                          </span>
                                        )}
                                      </div>
                                      {ex.Notes && (
                                        <p className="text-xs mt-2 pt-2" style={{ color:'var(--t3)', borderTop:'1px solid var(--b0)', fontFamily:'var(--font-mono)' }}>
                                          // {ex.Notes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
      }
    </div>
  )
}
