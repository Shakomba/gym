import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import Modal from '../components/ui/Modal'
import { Plus, ChevronDown, ChevronUp, Search, Edit3, Trash2, ScrollText, AlertTriangle } from 'lucide-react'

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Under Maintenance', 'Retired']

const COND_STYLE = {
  'Excellent':         { color: 'var(--t2)', border: 'var(--b2)' },
  'Good':              { color: 'var(--t2)', border: 'var(--b2)' },
  'Fair':              { color: 'var(--t2)', border: 'var(--b1)' },
  'Under Maintenance': { color: 'var(--t1)', border: 'var(--b3)' },
  'Retired':           { color: 'var(--t3)', border: 'var(--b0)' },
}

function CondBadge({ condition }) {
  const s = COND_STYLE[condition] || COND_STYLE.Good
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider"
      style={{ fontFamily: 'var(--font-mono)', color: s.color, border: `1px solid ${s.border}` }}>
      {condition === 'Under Maintenance' && <AlertTriangle size={9} />}
      {condition}
    </span>
  )
}

export default function Machines() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'admin'
  const [machines, setMachines]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterCond, setFilterCond] = useState('')
  const [expanded, setExpanded]     = useState(null)
  const [detail, setDetail]         = useState({})
  const [showAdd, setShowAdd]       = useState(false)
  const [showLog, setShowLog]       = useState(null)
  const [editM, setEditM]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const toast = useToast()

  const EMPTY = { machineName:'', machineType:'', serialNumber:'', manufacturer:'', purchaseDate:'', condition:'Good', location:'', notes:'' }
  const [form, setForm] = useState(EMPTY)
  const ELOG = { technicianName:'', description:'', cost:'', nextServiceDate:'' }
  const [logForm, setLogForm] = useState(ELOG)
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/machines'); setMachines(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggle = async id => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    if (!detail[id]) {
      try { const r = await api.get(`/machines/${id}`); setDetail(p => ({...p, [id]: r.data})) } catch {}
    }
  }

  const save = async () => {
    if (!form.machineName || !form.machineType || !form.serialNumber) { toast('Name, type and serial required', 'error'); return }
    setSaving(true)
    try {
      if (editM) { await api.put(`/machines/${editM.MachineID}`, form); toast('Updated', 'success'); setDetail(p => { const n={...p}; delete n[editM.MachineID]; return n }) }
      else { await api.post('/machines', form); toast('Machine added', 'success') }
      setShowAdd(false); setEditM(null); setForm(EMPTY); load()
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
    finally { setSaving(false) }
  }

  const del = async m => {
    if (!confirm(`Delete "${m.MachineName}"?`)) return
    try { await api.delete(`/machines/${m.MachineID}`); toast('Deleted', 'info'); load() }
    catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
  }

  const addLog = async () => {
    if (!logForm.description) { toast('Description required', 'error'); return }
    setSaving(true)
    try {
      await api.post(`/machines/${showLog.MachineID}/logs`, logForm)
      toast('Log added', 'success'); setShowLog(null); setLogForm(ELOG)
      setDetail(p => { const n={...p}; delete n[showLog.MachineID]; return n })
    } catch { toast('Failed', 'error') }
    finally { setSaving(false) }
  }

  const filtered = machines.filter(m => {
    const s = m.MachineName.toLowerCase().includes(search.toLowerCase()) || m.MachineType.toLowerCase().includes(search.toLowerCase())
    const c = !filterCond || m.Condition === filterCond
    return s && c
  })

  const grouped = filtered.reduce((acc, m) => { if (!acc[m.MachineType]) acc[m.MachineType]=[]; acc[m.MachineType].push(m); return acc }, {})

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between" style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div>
          <div className="section-label mb-1">Inventory</div>
          <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>Machines</h1>
        </div>
        {isAdmin && (
          <button onClick={() => { setForm(EMPTY); setEditM(null); setShowAdd(true) }} className="btn-primary">
            <Plus size={14} /> Add Machine
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9 text-sm" />
        </div>
        <select value={filterCond} onChange={e => setFilterCond(e.target.value)} className="input-base text-sm"
          style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All conditions</option>
          {CONDITIONS.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Condition summary */}
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.map(c => {
          const count = machines.filter(m => m.Condition === c).length
          if (!count) return null
          const s = COND_STYLE[c]
          return (
            <button key={c} onClick={() => setFilterCond(filterCond === c ? '' : c)}
              className="text-[10px] px-3 py-1 uppercase tracking-wider cursor-pointer transition-all"
              style={{ fontFamily: 'var(--font-mono)', color: s.color, border: `1px solid ${s.border}`,
                background: filterCond === c ? 'var(--s2)' : 'transparent' }}>
              {c} ({count})
            </button>
          )
        })}
      </div>

      {/* Machine groups */}
      {loading
        ? <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="skeleton h-14" />)}</div>
        : Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="flex items-center gap-3 mb-2" style={{ borderBottom: '1px solid var(--b1)', paddingBottom: 8 }}>
                <span className="section-label">{type}</span>
                <span className="text-[10px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  ({items.length})
                </span>
              </div>
              <div className="space-y-px">
                {items.map(m => {
                  const d = detail[m.MachineID]
                  return (
                    <div key={m.MachineID} style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
                      <div className="flex items-center gap-4 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-700 text-sm uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                              {m.MachineName}
                            </span>
                            <CondBadge condition={m.Condition} />
                          </div>
                          <div className="text-[11px] mt-1 flex flex-wrap gap-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                            <span>SN: {m.SerialNumber}</span>
                            {m.Location && <span>{m.Location}</span>}
                            {m.LastServiceDate && <span>Svc: {new Date(m.LastServiceDate).toLocaleDateString('en-GB')}</span>}
                            <span>{m.LogCount} logs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdmin && (
                            <>
                              <button onClick={() => { setForm({ machineName:m.MachineName, machineType:m.MachineType, serialNumber:m.SerialNumber, manufacturer:m.Manufacturer||'', purchaseDate:m.PurchaseDate?.slice(0,10)||'', condition:m.Condition, location:m.Location||'', notes:m.Notes||'' }); setEditM(m); setShowAdd(true) }}
                                className="p-1.5 cursor-pointer" style={{ color: 'var(--t3)' }}
                                onMouseEnter={e => e.currentTarget.style.color='var(--t1)'}
                                onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => { setShowLog(m); setLogForm(ELOG) }}
                                className="p-1.5 cursor-pointer" style={{ color: 'var(--t3)' }}
                                onMouseEnter={e => e.currentTarget.style.color='var(--t1)'}
                                onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
                                <ScrollText size={13} />
                              </button>
                              <button onClick={() => del(m)}
                                className="p-1.5 cursor-pointer" style={{ color: 'var(--t3)' }}
                                onMouseEnter={e => e.currentTarget.style.color='var(--t1)'}
                                onMouseLeave={e => e.currentTarget.style.color='var(--t3)'}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                          <button onClick={() => toggle(m.MachineID)} className="p-1.5 cursor-pointer" style={{ color: 'var(--t3)' }}>
                            {expanded === m.MachineID ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>

                      {expanded === m.MachineID && (
                        <div className="px-5 pb-5 animate-fade-in" style={{ borderTop: '1px solid var(--b0)' }}>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-4 mb-5" style={{ border: '1px solid var(--b0)' }}>
                            {[['Manufacturer', m.Manufacturer||'—'], ['Purchase', m.PurchaseDate ? new Date(m.PurchaseDate).toLocaleDateString('en-GB') : '—'], ['Zone', m.Location||'—'], ['Serial', m.SerialNumber]].map(([lbl,val],i) => (
                              <div key={lbl} className="p-3" style={{ borderRight: i<3 ? '1px solid var(--b0)' : 'none' }}>
                                <div className="section-label mb-1">{lbl}</div>
                                <div className="text-xs font-600" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t1)' }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          <div className="section-label mb-3">Maintenance Logs</div>
                          {!d ? <div className="text-xs" style={{ color: 'var(--t3)' }}>Loading…</div>
                            : d.logs?.length === 0
                              ? <p className="text-xs" style={{ color: 'var(--t3)' }}>No logs</p>
                              : <div className="space-y-px">
                                  {d.logs.map(log => (
                                    <div key={log.LogID} className="flex gap-4 p-3 text-xs"
                                      style={{ background: 'var(--s2)', border: '1px solid var(--b0)' }}>
                                      <span className="shrink-0" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                                        {new Date(log.ServiceDate).toLocaleDateString('en-GB')}
                                      </span>
                                      <span className="flex-1" style={{ color: 'var(--t2)' }}>{log.Description}</span>
                                      {log.Cost != null && <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>${log.Cost}</span>}
                                    </div>
                                  ))}
                                </div>
                          }
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
      }

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditM(null); setForm(EMPTY) }}
        title={editM ? 'Edit Machine' : 'Add Machine'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['Machine Name *', 'machineName', 'Treadmill Pro'], ['Type *', 'machineType', 'Treadmill'], ['Serial # *', 'serialNumber', 'TM-001'], ['Manufacturer', 'manufacturer', 'LifeFitness']].map(([lbl,k,ph]) => (
              <div key={k}>
                <label className="section-label mb-1.5">{lbl}</label>
                <input value={form[k]} onChange={set(k)} placeholder={ph} className="input-base text-sm" />
              </div>
            ))}
            <div>
              <label className="section-label mb-1.5">Purchase Date</label>
              <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} className="input-base text-sm" />
            </div>
            <div>
              <label className="section-label mb-1.5">Condition</label>
              <select value={form.condition} onChange={set('condition')} className="input-base text-sm">
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="section-label mb-1.5">Location</label>
            <input value={form.location} onChange={set('location')} placeholder="Cardio Zone, Upper Body…" className="input-base text-sm" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowAdd(false); setEditM(null); setForm(EMPTY) }} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : editM ? 'Save Changes' : 'Add Machine'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Log Modal */}
      <Modal open={!!showLog} onClose={() => setShowLog(null)} title={`Log: ${showLog?.MachineName}`} size="sm">
        <div className="space-y-4">
          {[['Technician', 'technicianName', 'Tech name'], ['Description *', 'description', 'What was serviced…']].map(([lbl,k,ph]) => (
            <div key={k}>
              <label className="section-label mb-1.5">{lbl}</label>
              {k === 'description'
                ? <textarea rows={3} value={logForm[k]} onChange={e => setLogForm(f => ({...f, [k]: e.target.value}))} placeholder={ph} className="input-base text-sm resize-none" />
                : <input value={logForm[k]} onChange={e => setLogForm(f => ({...f, [k]: e.target.value}))} placeholder={ph} className="input-base text-sm" />
              }
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1.5">Cost ($)</label>
              <input type="number" step="0.01" value={logForm.cost} onChange={e => setLogForm(f => ({...f, cost: e.target.value}))} placeholder="0.00" className="input-base text-sm" />
            </div>
            <div>
              <label className="section-label mb-1.5">Next Service</label>
              <input type="date" value={logForm.nextServiceDate} onChange={e => setLogForm(f => ({...f, nextServiceDate: e.target.value}))} className="input-base text-sm" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowLog(null)} className="btn-secondary">Cancel</button>
            <button onClick={addLog} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Add Log'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
