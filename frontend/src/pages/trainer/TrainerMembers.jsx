import { useState, useEffect } from 'react'
import api from '../../api/client'
import { Search } from 'lucide-react'

export default function TrainerMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    api.get('/trainer/members').then(r => setMembers(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = members.filter(m =>
    m.MemberName.toLowerCase().includes(search.toLowerCase()) ||
    m.Email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div style={{ borderBottom: '2px solid var(--t1)', paddingBottom: 16 }}>
        <div className="section-label mb-1">Trainer</div>
        <h1 className="text-5xl font-900 uppercase" style={{ fontFamily: 'var(--font-display)' }}>My Members</h1>
      </div>

      <div className="relative max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--t3)' }} />
        <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9 text-sm" />
      </div>

      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: '1px solid var(--b1)' }}>
            {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-40 m-px" />)}
          </div>
        : filtered.length === 0
          ? <div className="text-sm text-center py-16" style={{ color: 'var(--t3)' }}>No members found</div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: '1px solid var(--b1)' }}>
              {filtered.map((m, i) => (
                <div key={m.MemberID} className="p-5 space-y-4"
                  style={{ background: 'var(--s1)', borderRight: '1px solid var(--b1)', borderBottom: '1px solid var(--b1)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center text-sm font-900 shrink-0"
                      style={{ background: 'var(--t1)', color: 'var(--bg)', fontFamily: 'var(--font-display)' }}>
                      {m.MemberName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-700 truncate uppercase text-sm" style={{ fontFamily: 'var(--font-display)' }}>{m.MemberName}</div>
                      <div className="text-[11px] truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>{m.Email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px" style={{ border: '1px solid var(--b0)' }}>
                    {[['Weight', m.Weight ? m.Weight+'kg' : '—'], ['Height', m.Height ? m.Height+'cm' : '—'], ['Gender', m.Gender||'—'], ['Courses', m.ActiveCourses]].map(([lbl,val],j) => (
                      <div key={lbl} className="p-2.5" style={{ borderRight: j%2===0?'1px solid var(--b0)':'none', borderBottom: j<2?'1px solid var(--b0)':'none' }}>
                        <div className="section-label mb-0.5">{lbl}</div>
                        <div className="text-xs font-600" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t1)' }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {m.FitnessGoal && (
                    <div className="text-xs p-2.5" style={{ background: 'var(--s2)', color: 'var(--t2)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b0)' }}>
                      {m.FitnessGoal}
                    </div>
                  )}
                </div>
              ))}
            </div>
      }
    </div>
  )
}
