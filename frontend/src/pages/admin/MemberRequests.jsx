import { useState, useEffect } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ui/Toast'
import StatusBadge from '../../components/ui/StatusBadge'
import Modal from '../../components/ui/Modal'
import { CheckCircle, XCircle, Eye, Search, RefreshCw } from 'lucide-react'

export default function MemberRequests() {
  const [requests, setRequests]   = useState([])
  const [allMembers, setAllMembers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('pending')
  const [search, setSearch]       = useState('')
  const [viewMember, setViewMember] = useState(null)
  const [approveModal, setApproveModal] = useState(null)
  const [amount, setAmount]       = useState('50')
  const [trainers, setTrainers]   = useState([])
  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [processing, setProcessing] = useState(false)
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [r, m, t] = await Promise.all([api.get('/admin/requests'), api.get('/admin/members'), api.get('/admin/trainers')])
      setRequests(r.data); setAllMembers(m.data); setTrainers(t.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const approve = async () => {
    setProcessing(true)
    try {
      await api.post(`/admin/approve/${approveModal.MemberID}`, { amount: parseFloat(amount) })
      if (selectedTrainer) await api.patch(`/admin/members/${approveModal.MemberID}/trainer`, { trainerId: parseInt(selectedTrainer) })
      toast(`${approveModal.MemberName} approved`, 'success')
      setApproveModal(null); setSelectedTrainer(''); load()
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
    finally { setProcessing(false) }
  }

  const reject = async m => {
    if (!confirm(`Reject ${m.MemberName}?`)) return
    try {
      await api.post(`/admin/reject/${m.MemberID}`)
      toast('Request rejected', 'info'); load()
    } catch (err) { toast(err.response?.data?.error || 'Failed', 'error') }
  }

  const source   = tab === 'pending' ? requests : allMembers
  const filtered = source.filter(m =>
    m.MemberName.toLowerCase().includes(search.toLowerCase()) ||
    m.Email.toLowerCase().includes(search.toLowerCase())
  )

  const TABS = [
    { key: 'pending', label: 'Pending', count: requests.length },
    { key: 'all',     label: 'All Members', count: allMembers.length },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>
          Member Requests
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid var(--b1)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest cursor-pointer transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              color: tab === t.key ? 'var(--bg)' : 'var(--t3)',
              background: tab === t.key ? 'var(--t1)' : 'transparent',
              borderBottom: tab === t.key ? '2px solid var(--t1)' : '2px solid transparent',
              marginBottom: -1,
            }}>
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 font-700"
              style={{ background: tab === t.key ? 'rgba(0,0,0,0.2)' : 'var(--s2)' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            className="input-base pl-9 text-sm" />
        </div>
        <button onClick={load} className="btn-secondary px-3 py-2"><RefreshCw size={13} /></button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading
          ? <div className="p-10 text-center text-sm" style={{ color: 'var(--t3)' }}>Loading…</div>
          : filtered.length === 0
            ? <div className="p-10 text-center text-sm" style={{ color: 'var(--t3)' }}>No records found</div>
            : <div className="overflow-x-auto">
                <table className="table-base">
                  <thead><tr>
                    <th>Member</th><th>Phone</th><th>Gender</th><th>Goal</th>
                    <th>Date</th><th>Status</th>
                    {tab === 'pending' && <th>Actions</th>}
                    <th></th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(m => (
                      <tr key={m.MemberID}>
                        <td>
                          <div className="font-600 text-sm">{m.MemberName}</div>
                          <div className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{m.Email}</div>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--t2)' }}>{m.Phone || '—'}</td>
                        <td className="text-xs" style={{ color: 'var(--t2)' }}>{m.Gender || '—'}</td>
                        <td className="text-xs max-w-xs truncate" style={{ color: 'var(--t2)' }}>{m.FitnessGoal || '—'}</td>
                        <td className="text-[11px]" style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(m.RequestDate).toLocaleDateString('en-GB')}
                        </td>
                        <td><StatusBadge status={m.Status} /></td>
                        {tab === 'pending' && (
                          <td>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setApproveModal(m); setAmount('50') }} className="btn-success">
                                <CheckCircle size={11} /> Approve
                              </button>
                              <button onClick={() => reject(m)} className="btn-danger">
                                <XCircle size={11} /> Reject
                              </button>
                            </div>
                          </td>
                        )}
                        <td>
                          <button onClick={() => setViewMember(m)}
                            className="p-1.5 cursor-pointer transition-colors" style={{ color: 'var(--t3)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--t1)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--t3)'}>
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* Approve Modal */}
      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Membership">
        {approveModal && (
          <div className="space-y-5">
            <div className="p-4" style={{ background: 'var(--s2)', border: '1px solid var(--b1)' }}>
              <div className="font-700 text-sm uppercase" style={{ fontFamily: 'var(--font-display)' }}>{approveModal.MemberName}</div>
              <div className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{approveModal.Email}</div>
            </div>
            <div>
              <label className="section-label mb-2">Payment Amount (Cash)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="input-base" placeholder="50" min="0" />
            </div>
            <div>
              <label className="section-label mb-2">Assign Trainer</label>
              <select value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)} className="input-base">
                <option value="">— No trainer —</option>
                {trainers.map(t => (
                  <option key={t.TrainerID} value={t.TrainerID}>
                    {t.TrainerName} ({t.Specialty})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setApproveModal(null)} className="btn-secondary">Cancel</button>
              <button onClick={approve} disabled={processing} className="btn-success"
                style={{ padding: '10px 20px', opacity: processing ? 0.6 : 1 }}>
                <CheckCircle size={13} /> {processing ? 'Processing…' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewMember} onClose={() => setViewMember(null)} title="Member Details" size="sm">
        {viewMember && (
          <div className="space-y-0 divide-y" style={{ '--tw-divide-color': 'var(--b1)' }}>
            {[
              ['Name', viewMember.MemberName],
              ['Email', viewMember.Email],
              ['Phone', viewMember.Phone || '—'],
              ['Gender', viewMember.Gender || '—'],
              ['Weight', viewMember.Weight ? viewMember.Weight + ' kg' : '—'],
              ['Height', viewMember.Height ? viewMember.Height + ' cm' : '—'],
              ['Goal', viewMember.FitnessGoal || '—'],
              ['Trainer', viewMember.TrainerName || 'Not assigned'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between py-3">
                <span className="text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{label}</span>
                <span className="text-xs font-600 text-right max-w-xs" style={{ color: 'var(--t1)' }}>{val}</span>
              </div>
            ))}
            <div className="pt-3"><StatusBadge status={viewMember.Status} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
