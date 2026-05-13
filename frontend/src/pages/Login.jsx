import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

const DEMO = [
  { label: 'Admin',   email: 'admin@halabja.gym',  password: 'admin123' },
  { label: 'Trainer', email: 'ahmad@halabja.gym',  password: 'trainer123' },
  { label: 'Member',  email: 'ali@example.com',    password: 'admin123' },
]

export default function Login() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const toast      = useToast()

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast('Access granted', 'success')
      navigate(user.role === 'admin' ? '/admin' : user.role === 'trainer' ? '/trainer' : '/member')
    } catch {
      toast('Invalid credentials', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0a0a0a', borderRight: '1px solid var(--b1)' }}>

        {/* Top: brand */}
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase mb-12"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
            EST. 2024 / HALABJA
          </div>

          <div className="space-y-0">
            <div className="text-[5.5rem] leading-[0.9] font-900 uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              Train
            </div>
            <div className="text-[5.5rem] leading-[0.9] font-900 uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              Hard.
            </div>
            <div className="text-[5.5rem] leading-[0.9] font-900 uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t3)' }}>
              Train
            </div>
            <div className="text-[5.5rem] leading-[0.9] font-900 uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t3)' }}>
              Smart.
            </div>
          </div>

          <div className="mt-8" style={{ borderTop: '2px solid var(--b2)' }}>
            <p className="text-sm mt-4 leading-relaxed max-w-xs"
              style={{ color: 'var(--t3)', fontFamily: 'var(--font-body)' }}>
              Professional gym management for members, trainers, and administrators.
            </p>
          </div>
        </div>

        {/* Bottom: stats */}
        <div className="grid grid-cols-3 gap-px" style={{ borderTop: '1px solid var(--b1)' }}>
          {[['10+', 'Machines'], ['3', 'Trainers'], ['Active', 'Members']].map(([val, label]) => (
            <div key={label} className="pt-5 pr-4">
              <div className="text-2xl font-800 leading-none"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                {val}
              </div>
              <div className="text-[10px] mt-1 uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-16">
        <div className="max-w-sm w-full mx-auto animate-fade-in">

          {/* Mobile brand */}
          <div className="mb-10 lg:hidden">
            <div className="text-3xl font-900 uppercase"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              Halabja Gym
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <div className="section-label mb-3">Access portal</div>
            <h1 className="text-4xl font-900 uppercase"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              Sign In
            </h1>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="section-label mb-2">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" className="input-base" autoComplete="email" />
            </div>

            <div>
              <label className="section-label mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="input-base pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: 'var(--t3)' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-sm">
              {loading ? 'Authenticating…' : <>Sign In <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="mt-8" style={{ borderTop: '1px solid var(--b1)', paddingTop: 24 }}>
            <p className="text-xs mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              No account?{' '}
              <Link to="/register" className="underline" style={{ color: 'var(--t2)' }}>
                Request membership
              </Link>
            </p>

            {/* Demo accounts */}
            <div>
              <div className="section-label mb-3">Demo accounts</div>
              <div className="flex gap-2">
                {DEMO.map(d => (
                  <button key={d.label} onClick={() => { setEmail(d.email); setPassword(d.password) }}
                    className="text-[10px] px-3 py-1.5 uppercase tracking-widest cursor-pointer transition-all"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--t3)',
                      border: '1px solid var(--b1)',
                      background: 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--t1)'; e.currentTarget.style.color = 'var(--bg)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t3)' }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
