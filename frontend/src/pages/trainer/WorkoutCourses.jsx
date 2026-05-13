import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import { Plus, Trash2, ChevronDown, ChevronUp, Search, Pencil } from 'lucide-react'

export default function WorkoutCourses() {
  const [courses, setCourses]         = useState([])
  const [members, setMembers]         = useState([])
  const [machines, setMachines]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [expanded, setExpanded]       = useState(null)
  const [courseDetail, setCourseDetail] = useState({})
  const [showCreate, setShowCreate]   = useState(false)
  const [creating, setCreating]       = useState(false)
  const [editCourse, setEditCourse]   = useState(null)   // course being edited
  const [saving, setSaving]           = useState(false)
  const [addingEx, setAddingEx]       = useState(false)
  const toast = useToast()

  const EF = { memberID:'', courseName:'', description:'', startDate: new Date().toISOString().slice(0,10), endDate:'', exercises:[] }
  const [form, setForm] = useState(EF)
  const EX = { machineID:'', exerciseName:'', sets:3, reps:10, weightKg:'', frequency:'3x per week', notes:'' }
  const [exForm, setExForm]     = useState(EX)
  const [editExForm, setEditExForm] = useState(EX)   // exercise form inside edit modal

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
    await refreshDetail(id)
  }

  const refreshDetail = async id => {
    try {
      const r = await api.get(`/trainer/courses/${id}`)
      setCourseDetail(p => ({ ...p, [id]: r.data }))
      return r.data
    } catch { return null }
  }

  // ── Create helpers ──────────────────────────────────────────────────────────
  const addEx = () => {
    if (!exForm.machineID || !exForm.exerciseName || !exForm.sets || !exForm.reps) {
      toast('Fill all exercise fields', 'error'); return
    }
    const mac = machines.find(m => m.MachineID === parseInt(exForm.machineID))
    setForm(f => ({
      ...f,
      exercises: [...f.exercises, {
        ...exForm,
        machineID: parseInt(exForm.machineID),
        sets: parseInt(exForm.sets),
        reps: parseInt(exForm.reps),
        weightKg: exForm.weightKg ? parseFloat(exForm.weightKg) : null,
        machineName: mac?.MachineName,
        sortOrder: f.exercises.length
      }]
    }))
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

  // ── Edit helpers ────────────────────────────────────────────────────────────
  const openEdit = async (c) => {
    const detail = courseDetail[c.CourseID] || await refreshDetail(c.CourseID)
    setEditCourse({
      CourseID:    c.CourseID,
      courseName:  c.CourseName,
      description: c.Description || '',
      startDate:   c.StartDate ? c.StartDate.slice(0,10) : '',
      endDate:     c.EndDate   ? c.EndDate.slice(0,10)   : '',
      isActive:    c.IsActive,
      exercises:   detail?.exercises || [],
    })
    setEditExForm(EX)
  }

  const saveEdit = async () => {
    if (!editCourse.courseName) { toast('Course name required', 'error'); return }
    setSaving(true)
    try {
      await api.put(`/trainer/courses/${editCourse.CourseID}`, {
        courseName:  editCourse.courseName,
        description: editCourse.description || null,
        endDate:     editCourse.endDate || null,
        isActive:    editCourse.isActive ? 1 : 0,
      })
      toast('Course saved', 'success')
      await refreshDetail(editCourse.CourseID)
      await load()
      setEditCourse(null)
    } catch (err) { toast(err.response?.data?.error || 'Save failed', 'error') }
    finally { setSaving(false) }
  }

  const deleteExercise = async (exId) => {
    try {
      await api.delete(`/trainer/courses/${editCourse.CourseID}/exercises/${exId}`)
      const updated = await refreshDetail(editCourse.CourseID)
      setEditCourse(ec => ({ ...ec, exercises: updated?.exercises || [] }))
      toast('Exercise removed', 'success')
    } catch { toast('Failed to remove exercise', 'error') }
  }

  const addExToEdit = async () => {
    if (!editExForm.machineID || !editExForm.exerciseName || !editExForm.sets || !editExForm.reps) {
      toast('Fill all exercise fields', 'error'); return
    }
    setAddingEx(true)
    try {
      await api.post(`/trainer/courses/${editCourse.CourseID}/exercises`, {
        machineID:    parseInt(editExForm.machineID),
        exerciseName: editExForm.exerciseName,
        sets:         parseInt(editExForm.sets),
        reps:         parseInt(editExForm.reps),
        weightKg:     editExForm.weightKg ? parseFloat(editExForm.weightKg) : null,
        frequency:    editExForm.frequency || null,
        notes:        editExForm.notes || null,
        sortOrder:    editCourse.exercises.length,
      })
      const updated = await refreshDetail(editCourse.CourseID)
      setEditCourse(ec => ({ ...ec, exercises: updated?.exercises || [] }))
      setEditExForm(EX)
      toast('Exercise added', 'success')
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
    finally { setAddingEx(false) }
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
                    <div className="w-full flex items-center gap-4 px-5 py-4">
                      <button onClick={() => toggle(c.CourseID)} className="flex-1 flex items-center gap-4 text-left cursor-pointer min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-700 text-sm uppercase" style={{ fontFamily: 'var(--font-display)' }}>{c.CourseName}</div>
                          <div className="text-[11px] mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                            {c.MemberName} · {c.ExerciseCount} exercises · {new Date(c.StartDate).toLocaleDateString('en-GB')}
                          </div>
                        </div>
                      </button>
                      <span className="text-[10px] px-2 py-0.5 uppercase tracking-wider shrink-0"
                        style={{ fontFamily: 'var(--font-mono)', color: c.IsActive ? 'var(--t2)' : 'var(--t3)', border: `1px solid ${c.IsActive ? 'var(--b2)' : 'var(--b0)'}` }}>
                        {c.IsActive ? 'Active' : 'Off'}
                      </span>
                      <button onClick={() => openEdit(c)} title="Edit course"
                        className="w-7 h-7 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                        style={{ color: 'var(--t3)', border: '1px solid var(--b1)' }}
                        onMouseEnter={e => { e.currentTarget.style.color='var(--t1)'; e.currentTarget.style.borderColor='var(--b3)' }}
                        onMouseLeave={e => { e.currentTarget.style.color='var(--t3)'; e.currentTarget.style.borderColor='var(--b1)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => toggle(c.CourseID)} className="cursor-pointer shrink-0">
                        {expanded === c.CourseID ? <ChevronUp size={13} style={{color:'var(--t3)'}} /> : <ChevronDown size={13} style={{color:'var(--t3)'}} />}
                      </button>
                    </div>

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

      {/* ── Create Modal ── */}
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

          <ExerciseAdder
            machines={machines} exForm={exForm} setExForm={setExForm}
            onAdd={addEx} exercises={form.exercises}
            onRemove={i => setForm(f=>({...f,exercises:f.exercises.filter((_,j)=>j!==i)}))}
          />

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowCreate(false); setForm(EF) }} className="btn-secondary">Cancel</button>
            <button onClick={create} disabled={creating} className="btn-primary" style={{ opacity:creating?0.6:1 }}>
              {creating ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editCourse} onClose={() => setEditCourse(null)} title="Edit Course" size="lg">
        {editCourse && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="section-label mb-1.5">Course Name *</label>
                <input type="text" value={editCourse.courseName}
                  onChange={e => setEditCourse(ec=>({...ec,courseName:e.target.value}))}
                  className="input-base text-sm" />
              </div>
              <div>
                <label className="section-label mb-1.5">End Date</label>
                <input type="date" value={editCourse.endDate}
                  onChange={e => setEditCourse(ec=>({...ec,endDate:e.target.value}))}
                  className="input-base text-sm" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="section-label mb-1.5">Status</label>
                <select value={editCourse.isActive ? '1' : '0'}
                  onChange={e => setEditCourse(ec=>({...ec,isActive:e.target.value==='1'}))}
                  className="input-base text-sm">
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="section-label mb-1.5">Description</label>
              <textarea rows={2} value={editCourse.description}
                onChange={e => setEditCourse(ec=>({...ec,description:e.target.value}))}
                className="input-base text-sm resize-none" />
            </div>

            {/* Current exercises */}
            {editCourse.exercises.length > 0 && (
              <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 16 }}>
                <div className="section-label mb-2">Exercises</div>
                <div className="space-y-px">
                  {editCourse.exercises.map(ex => (
                    <div key={ex.ExerciseID} className="flex items-center gap-3 px-3 py-2.5 text-xs"
                      style={{ background:'var(--s2)', border:'1px solid var(--b0)' }}>
                      <div className="flex-1 min-w-0">
                        <span className="font-600">{ex.ExerciseName}</span>
                        <span style={{ color:'var(--t3)', fontFamily:'var(--font-mono)', marginLeft:8 }}>
                          {ex.MachineName} · {ex.Sets}×{ex.Reps}{ex.WeightKg ? ` @ ${ex.WeightKg}kg` : ''}
                          {ex.Frequency ? ` · ${ex.Frequency}` : ''}
                        </span>
                      </div>
                      <button onClick={() => deleteExercise(ex.ExerciseID)}
                        className="cursor-pointer shrink-0 transition-colors"
                        style={{ color:'var(--t3)' }}
                        onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'}
                        onMouseLeave={e=>e.currentTarget.style.color='var(--t3)'}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add exercise to existing course */}
            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 16 }}>
              <div className="section-label mb-3">Add Exercise</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="section-label mb-1">Machine</label>
                  <select value={editExForm.machineID} onChange={e=>setEditExForm(f=>({...f,machineID:e.target.value}))} className="input-base text-xs">
                    <option value="">Select machine</option>
                    {machines.filter(m=>m.Condition!=='Retired').map(m=><option key={m.MachineID} value={m.MachineID}>{m.MachineName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label mb-1">Exercise Name</label>
                  <input type="text" value={editExForm.exerciseName} onChange={e=>setEditExForm(f=>({...f,exerciseName:e.target.value}))} placeholder="Lat Pulldown" className="input-base text-xs" />
                </div>
                <div>
                  <label className="section-label mb-1">Sets</label>
                  <input type="number" min="1" value={editExForm.sets} onChange={e=>setEditExForm(f=>({...f,sets:e.target.value}))} className="input-base text-xs" />
                </div>
                <div>
                  <label className="section-label mb-1">Reps</label>
                  <input type="number" min="1" value={editExForm.reps} onChange={e=>setEditExForm(f=>({...f,reps:e.target.value}))} className="input-base text-xs" />
                </div>
                <div>
                  <label className="section-label mb-1">Weight (kg)</label>
                  <input type="number" step="0.5" value={editExForm.weightKg} onChange={e=>setEditExForm(f=>({...f,weightKg:e.target.value}))} placeholder="Optional" className="input-base text-xs" />
                </div>
                <div>
                  <label className="section-label mb-1">Frequency</label>
                  <input type="text" value={editExForm.frequency} onChange={e=>setEditExForm(f=>({...f,frequency:e.target.value}))} className="input-base text-xs" />
                </div>
              </div>
              <button onClick={addExToEdit} disabled={addingEx} className="btn-secondary w-full justify-center text-xs" style={{ opacity:addingEx?0.6:1 }}>
                <Plus size={12} /> {addingEx ? 'Adding…' : 'Add Exercise'}
              </button>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setEditCourse(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary" style={{ opacity:saving?0.6:1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ExerciseAdder({ machines, exForm, setExForm, onAdd, exercises, onRemove }) {
  const EX = { machineID:'', exerciseName:'', sets:3, reps:10, weightKg:'', frequency:'3x per week', notes:'' }
  return (
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
      <button onClick={onAdd} className="btn-secondary w-full justify-center text-xs"><Plus size={12} /> Add Exercise</button>

      {exercises.length > 0 && (
        <div className="mt-3 space-y-px">
          <div className="section-label mb-2">Added ({exercises.length})</div>
          {exercises.map((ex,i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs"
              style={{ background:'var(--s2)', border:'1px solid var(--b0)' }}>
              <div className="flex-1">
                <span className="font-600">{ex.exerciseName}</span>
                <span style={{ color:'var(--t3)', fontFamily:'var(--font-mono)', marginLeft:8 }}>
                  {ex.machineName} · {ex.sets}×{ex.reps}{ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}
                </span>
              </div>
              <button onClick={() => onRemove(i)} className="cursor-pointer" style={{ color:'var(--t3)' }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
