import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'

const STEPS = ['01 Account', '02 Personal', '03 Health', '04 Review']

export default function Register() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', gender: '', dateOfBirth: '', weight: '', height: '',
    fitnessGoal: '', medicalConditions: '', allergies: '', emergencyContact: '', emergencyPhone: ''
  })
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.email || !form.password) return 'Name, email and password are required'
      if (form.password !== form.confirmPassword) return 'Passwords do not match'
      if (form.password.length < 6) return 'Password must be at least 6 characters'
    }
    if (step === 1 && !form.gender) return 'Please select your gender'
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) { toast(err, 'error'); return }
    setStep(s => Math.min(s + 1, 3))
  }

  const submit = async () => {
    setLoading(true)
    try {
      await register(form)
      setDone(true)
    } catch (err) {
      toast(err.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center max-w-md px-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-800 mb-3">Request Submitted!</h2>
          <p className="mb-2" style={{ color: 'var(--color-muted)' }}>
            Your membership request has been received.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
            Visit the gym in person to pay the membership fee. Once the manager confirms your payment, your account will be activated.
          </p>
          <div className="p-4 rounded-xl mb-8 text-left" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <p className="text-xs font-700 uppercase tracking-wider mb-2" style={{ color: 'var(--color-accent)' }}>What happens next?</p>
            <ol className="space-y-1 text-sm" style={{ color: 'var(--color-muted)' }}>
              <li>1. Visit Halabja Gym in person</li>
              <li>2. Pay the membership fee in cash</li>
              <li>3. Manager approves your account</li>
              <li>4. Login and start your fitness journey</li>
            </ol>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  const Field = ({ label, icon: Icon, ...props }) => (
    <div>
      <label className="block text-xs font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)', zIndex: 1 }} />}
        <input {...props} className={`input-base ${Icon ? 'pl-10' : ''}`} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-accent)' }}>
            <Dumbbell size={18} color="#000" />
          </div>
          <div>
            <div className="font-800 tracking-tight">HALABJA GYM</div>
            <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Membership Request</div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-amber-500' : ''}`}
                style={{ background: i <= step ? 'var(--color-accent)' : 'var(--color-border)' }} />
              <span className="text-xs font-600" style={{ color: i === step ? 'var(--color-accent)' : 'var(--color-muted)' }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-700 mb-4">Create your account</h3>
              <Field label="Full Name *" icon={User} type="text" placeholder="Ali Hassan" value={form.name} onChange={set('name')} required />
              <Field label="Email *" icon={Mail} type="email" placeholder="ali@example.com" value={form.email} onChange={set('email')} required />
              <Field label="Password *" icon={Lock} type="password" placeholder="min. 6 characters" value={form.password} onChange={set('password')} required />
              <Field label="Confirm Password *" icon={Lock} type="password" placeholder="repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-700 mb-4">Personal details</h3>
              <Field label="Phone Number" icon={Phone} type="tel" placeholder="077..." value={form.phone} onChange={set('phone')} />
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Gender *</label>
                <select value={form.gender} onChange={set('gender')} className="input-base" required style={{ cursor: 'pointer' }}>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)" type="number" placeholder="75" value={form.weight} onChange={set('weight')} />
                <Field label="Height (cm)" type="number" placeholder="175" value={form.height} onChange={set('height')} />
              </div>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>
                  <Target size={13} className="inline mr-1" />Fitness Goal
                </label>
                <textarea rows={2} placeholder="e.g. Build muscle, lose weight, general fitness…" value={form.fitnessGoal} onChange={set('fitnessGoal')}
                  className="input-base resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-700 mb-1 flex items-center gap-2">
                <Heart size={18} style={{ color: 'var(--color-accent)' }} /> Health Disclosure
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>This information is confidential and only visible to your trainer and admin.</p>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Medical Conditions</label>
                <textarea rows={3} placeholder="Any medical conditions we should know about…" value={form.medicalConditions} onChange={set('medicalConditions')} className="input-base resize-none" />
              </div>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted)' }}>Allergies</label>
                <input type="text" placeholder="None, or list allergies…" value={form.allergies} onChange={set('allergies')} className="input-base" />
              </div>
              <Field label="Emergency Contact Name" type="text" placeholder="Contact name" value={form.emergencyContact} onChange={set('emergencyContact')} />
              <Field label="Emergency Contact Phone" icon={Phone} type="tel" placeholder="077..." value={form.emergencyPhone} onChange={set('emergencyPhone')} />
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-700 mb-4">Review & Submit</h3>
              <div className="space-y-3 mb-6">
                {[
                  ['Name', form.name], ['Email', form.email],
                  ['Gender', form.gender], ['Phone', form.phone || '—'],
                  ['Weight', form.weight ? form.weight + ' kg' : '—'],
                  ['Height', form.height ? form.height + ' cm' : '—'],
                  ['Fitness Goal', form.fitnessGoal || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <span style={{ color: 'var(--color-muted)' }}>{label}</span>
                    <span className="font-600 max-w-xs text-right truncate">{val}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--color-muted)' }}>
                By submitting, you agree to visit the gym in person and pay the membership fee in cash before your account is activated.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0
            ? <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
            : <Link to="/login" className="btn-secondary">
                <ArrowLeft size={16} /> Login
              </Link>
          }
          {step < 3
            ? <button onClick={next} className="btn-primary">Next <ArrowRight size={16} /></button>
            : <button onClick={submit} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting…' : <> Submit Request <ArrowRight size={16} /></>}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
