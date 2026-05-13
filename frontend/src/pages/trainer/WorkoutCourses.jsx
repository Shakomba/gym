import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import { Plus, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react'

export default function WorkoutCourses() {
  const [courses, setCourses]     = useState([])
  const [members, setMembers]     = useState([])
  const [machines, setMachines]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [expanded, setExpanded]   = useState(null)
  const [courseDetail, setCourseDetail] = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating]   = useState(false)
  const toast = useToast()

  const EF = { memberID:'', courseName:'', description:'', startDate: new Date().toISOString().slice(0,10), endDate:'', exercises:[] }
  const [form, setForm] = useState(EF)
  const EX = { machineID:'', exerciseName:'', sets:3, reps:10, weightKg:'', frequency:'3x per week', notes:'' }
  const [exForm, setExForm] = useState(EX)

  const load = async () => {
    setLoading(true)
    try {
      const [c, m, mac] = await Promise.all([api.get('/trainer/courses'), api.get('/trainer/members'), api.get('/machines')])
      setCourses(c.data); setMembers(m.data); setMachines(mac.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggle = async id => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!courseDetail[id]) {
      try { const r = await api.get(`/trainer/courses/${id}`); setCourseDetail(p => ({...p, [id]: r.data})) } catch {}
    }
  }

  const addEx = () => {
    if (!exForm.machineID || !exForm.exerciseName || !exForm.sets || !exForm.reps) { toast('Fill all exercise fields', 'error'); return }
    const mac = machines.find(m => m.MachineID === parseInt(exForm.machineID))
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...exForm, machineID: parseInt(exForm.machineID), sets: parseInt(exForm.sets), reps: parseInt(exForm.reps), weightKg: exForm.weightKg ? parseFloat(exForm.weightKg) : null, machineName: mac?.MachineName, sortOrder: f.exercises.length }] }))
    setExForm(EX)
  }

  const create = async () => {
    if (!form.memberID || !form.courseName) { toast('Member and course name required', 'error'); return }
    setCreating(true)
    try {
      await api.post('/trainer/courses', { ...form, memberID: parseInt(form.memberID) })
      toast('Course created', 'success'); setShowCreate(false); setForm(EF); load()
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
    finally { setCreating(false) }
  }

  const filtered = courses.filter(c =>
    c.CourseName.toLowerCase().includes(search.toLowerCase()) ||
    c.MemberName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between" style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div>
          <div className="section-label mb-1">Trainer</div>
          <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Courses</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={14} /> New</button>
      </div>

      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
        <input type="text" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9 text-sm" />
      </div>

      {loading
        ? <div className="space-y-px">{[...Array(4)].map((_,i) => <div key={i} className="skeleton h-16" />)}</div>
        : filtered.length === 0
          ? <div className="py-16 text-center text-sm" style={{ color: 'var(--t3)' }}>No courses yet</div>
          : <div className="space-y-px">
              {filtered.map(c => {
                const d = courseDetail[c.CourseID]
                return (
                  <div key={c.CourseID} style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                    <button onClick={() => toggle(c.CourseID)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
                      style={{ background:'transparent' }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <div className="flex-1 min-w-0">
                        <div className="font-700 text-sm uppercase" style={{ fontFamily: 'var(--font-display)' }}>{c.CourseName}</div>
                        <div className="text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                          {c.MemberName} · {c.ExerciseCount} exercises · {new Date(c.StartDate).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0"
                        style={{ fontFamily: 'var(--font-mono)', color: c.IsActive ? 'var(--t2)' : 'var(--t3)', border: `1px solid ${c.IsActive ? 'var(--b2)' : 'var(--b0)'}` }}>
                        {c.IsActive ? 'Active' : 'Off'}
                      </span>
                      {expanded === c.CourseID ? <ChevronUp size={13} style={{color:'var(--t3)'}} /> : <ChevronDown size={13} style={{color:'var(--t3)'}} />}
                    </button>

                    {expanded === c.CourseID && (
                      <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: '1px solid var(--b0)' }}>
                        {c.Description && <p className="text-sm py-3" style={{ color: 'var(--t2)' }}>{c.Description}</p>}
                        {!d
                          ? <div className="py-3 text-xs" style={{ color: 'var(--t3)' }}>Loading…</div>
                          : d.exercises?.length === 0
                            ? <p className="py-3 text-xs" style={{ color: 'var(--t3)' }}>No exercises</p>
                            : <div className="mt-3 space-y-px">
                                <div className="section-label mb-2">Exercise Plan</div>
                                <table className="table-base">
                                  <thead><tr><th>Exercise</th><th>Machine</th><th>Sets × Reps</th><th>Weight</th><th>Frequency</th></tr></thead>
                                  <tbody>
                                    {d.exercises.map(ex => (
                                      <tr key={ex.ExerciseID}>
                                        <td className="font-600 text-sm">{ex.ExerciseName}</td>
                                        <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t3)' }}>{ex.MachineName}</td>
                                        <td className="font-700 text-sm" style={{ fontFamily:'var(--font-mono)' }}>{ex.Sets}×{ex.Reps}</td>
                                        <td className="text-xs" style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>{ex.WeightKg ? ex.WeightKg+'kg' : '—'}</td>
                                        <td className="text-xs" style={{ color:'var(--t2)' }}>{ex.Frequency||'—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
      }

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(EF) }} title="New Workout Course" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="section-label mb-1.5">Member *</label>
              <select value={form.memberID} onChange={e => setForm(f=>({...f,memberID:e.target.value}))} className="input-base text-sm">
                <option value="">Select member</option>
                {members.map(m => <option key={m.MemberID} value={m.MemberID}>{m.MemberName}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label mb-1.5">Course Name *</label>
              <input type="text" value={form.courseName} onChange={e => setForm(f=>({...f,courseName:e.target.value}))} placeholder="Strength Phase 1" className="input-base text-sm" />
            </div>
            <div>
              <label className="section-label mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f=>({...f,startDate:e.target.value}))} className="input-base text-sm" />
            </div>
            <div>
              <label className="section-label mb-1.5">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f=>({...f,endDate:e.target.value}))} className="input-base text-sm" />
            </div>
          </div>
          <div>
            <label className="section-label mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} className="input-base text-sm resize-none" />
          </div>

          <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 20 }}>
            <div className="section-label mb-3">Add Exercise</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="section-label mb-1">Machine</label>
                <select value={exForm.machineID} onChange={e=>setExForm(f=>({...f,machineID:e.target.value}))} className="input-base text-xs">
                  <option value="">Select machine</option>
                  {machines.filter(m=>m.Condition!=='Retired').map(m=><option key={m.MachineID} value={m.MachineID}>{m.MachineName}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label mb-1">Exercise Name</label>
                <input type="text" value={exForm.exerciseName} onChange={e=>setExForm(f=>({...f,exerciseName:e.target.value}))} placeholder="Lat Pulldown" className="input-base text-xs" />
              </div>
              <div>
                <label className="section-label mb-1">Sets</label>
                <input type="number" min="1" value={exForm.sets} onChange={e=>setExForm(f=>({...f,sets:e.target.value}))} className="input-base text-xs" />
              </div>
              <div>
                <label className="section-label mb-1">Reps</label>
                <input type="number" min="1" value={exForm.reps} onChange={e=>setExForm(f=>({...f,reps:e.target.value}))} className="input-base text-xs" />
              </div>
              <div>
                <label className="section-label mb-1">Weight (kg)</label>
                <input type="number" step="0.5" value={exForm.weightKg} onChange={e=>setExForm(f=>({...f,weightKg:e.target.value}))} placeholder="Optional" className="input-base text-xs" />
              </div>
              <div>
                <label className="section-label mb-1">Frequency</label>
                <input type="text" value={exForm.frequency} onChange={e=>setExForm(f=>({...f,frequency:e.target.value}))} className="input-base text-xs" />
              </div>
            </div>
            <button onClick={addEx} className="btn-secondary w-full justify-center text-xs"><Plus size={12} /> Add Exercise</button>

            {form.exercises.length > 0 && (
              <div className="mt-3 space-y-px">
                <div className="section-label mb-2">Added ({form.exercises.length})</div>
                {form.exercises.map((ex,i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs"
                    style={{ background:'var(--s2)', border:'1px solid var(--b0)' }}>
                    <div className="flex-1">
                      <span className="font-600">{ex.exerciseName}</span>
                      <span style={{ color:'var(--t3)', fontFamily:'var(--font-mono)', marginLeft:8 }}>
                        {ex.machineName} · {ex.sets}×{ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                      </span>
                    </div>
                    <button onClick={() => setForm(f=>({...f,exercises:f.exercises.filter((_,j)=>j!==i)}))}
                      className="cursor-pointer" style={{ color:'var(--t3)' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowCreate(false); setForm(EF) }} className="btn-secondary">Cancel</button>
            <button onClick={create} disabled={creating} className="btn-primary" style={{ opacity:creating?0.6:1 }}>
              {creating ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
