import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import {
  ArrowRight, ArrowLeft, CheckCircle,
  Dumbbell, User, Mail, Lock, Phone, Target, Heart
} from 'lucide-react'

const STEPS = ['01 Account', '02 Personal', '03 Health', '04 Review']

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="block text-xs font-600 uppercase tracking-wider mb-1.5"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--t3)' }} />
        )}
        <input {...props} className={`input-base w-full ${Icon ? 'pl-9' : ''}`} />
      </div>
    </div>
  )
}

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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--s2)', border: '2px solid var(--b2)' }}>
            <CheckCircle size={28} style={{ color: 'var(--t1)' }} />
          </div>
          <h2 className="text-2xl font-800 mb-3 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
            Request Submitted
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--t2)' }}>
            Your membership request has been received.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--t3)' }}>
            Visit the gym in person to pay the membership fee. Once the manager confirms your payment, your account will be activated.
          </p>
          <div className="p-4 mb-8 text-left" style={{ background: 'var(--s1)', border: '1px solid var(--b1)' }}>
            <p className="text-xs font-700 uppercase tracking-widest mb-3"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--t2)' }}>
              What happens next
            </p>
            <ol className="space-y-1.5 text-sm" style={{ color: 'var(--t3)' }}>
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-lg animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 flex items-center justify-center"
            style={{ background: 'var(--t1)', color: 'var(--bg)' }}>
            <Dumbbell size={16} />
          </div>
          <div>
            <div className="font-800 tracking-wider uppercase text-sm"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
              Halabja Gym
            </div>
            <div className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
              Membership Request
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex flex-col gap-1">
              <div className="w-full h-0.5 transition-all duration-300"
                style={{ background: i <= step ? 'var(--t1)' : 'var(--b1)' }} />
              <span className="text-[10px] font-600 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-mono)', color: i === step ? 'var(--t1)' : 'var(--t3)' }}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8">
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-base font-700 uppercase tracking-wider mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                Create your account
              </h3>
              <Field label="Full Name *" icon={User} type="text" placeholder="Ali Hassan" value={form.name} onChange={set('name')} />
              <Field label="Email *" icon={Mail} type="email" placeholder="ali@example.com" value={form.email} onChange={set('email')} />
              <Field label="Password *" icon={Lock} type="password" placeholder="min. 6 characters" value={form.password} onChange={set('password')} />
              <Field label="Confirm Password *" icon={Lock} type="password" placeholder="repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-base font-700 uppercase tracking-wider mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                Personal details
              </h3>
              <Field label="Phone Number" icon={Phone} type="tel" placeholder="077..." value={form.phone} onChange={set('phone')} />
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  Gender *
                </label>
                <select value={form.gender} onChange={set('gender')} className="input-base w-full" style={{ cursor: 'pointer' }}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight (kg)" type="number" placeholder="75" value={form.weight} onChange={set('weight')} />
                <Field label="Height (cm)" type="number" placeholder="175" value={form.height} onChange={set('height')} />
              </div>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  <Target size={12} className="inline mr-1" />Fitness Goal
                </label>
                <textarea rows={2} placeholder="e.g. Build muscle, lose weight, general fitness…"
                  value={form.fitnessGoal} onChange={set('fitnessGoal')}
                  className="input-base w-full resize-none" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <h3 className="text-base font-700 uppercase tracking-wider flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                  <Heart size={16} /> Health Disclosure
                </h3>
                <p className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  Confidential — only visible to your trainer and admin.
                </p>
              </div>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  Medical Conditions
                </label>
                <textarea rows={3} placeholder="Any medical conditions we should know about…"
                  value={form.medicalConditions} onChange={set('medicalConditions')}
                  className="input-base w-full resize-none" />
              </div>
              <div>
                <label className="block text-xs font-600 uppercase tracking-wider mb-1.5"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--t3)' }}>
                  Allergies
                </label>
                <input type="text" placeholder="None, or list allergies…"
                  value={form.allergies} onChange={set('allergies')} className="input-base w-full" />
              </div>
              <Field label="Emergency Contact Name" type="text" placeholder="Contact name" value={form.emergencyContact} onChange={set('emergencyContact')} />
              <Field label="Emergency Contact Phone" icon={Phone} type="tel" placeholder="077..." value={form.emergencyPhone} onChange={set('emergencyPhone')} />
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h3 className="text-base font-700 uppercase tracking-wider mb-4"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--t1)' }}>
                Review & Submit
              </h3>
              <div className="space-y-0 mb-6" style={{ border: '1px solid var(--b1)' }}>
                {[
                  ['Name',         form.name],
                  ['Email',        form.email],
                  ['Gender',       form.gender || '—'],
                  ['Phone',        form.phone || '—'],
                  ['Weight',       form.weight ? form.weight + ' kg' : '—'],
                  ['Height',       form.height ? form.height + ' cm' : '—'],
                  ['Fitness Goal', form.fitnessGoal || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--b1)' }}>
                    <span style={{ color: 'var(--t3)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{label}</span>
                    <span className="font-600 max-w-xs text-right truncate" style={{ color: 'var(--t1)' }}>{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs p-3" style={{ background: 'var(--s2)', color: 'var(--t3)', fontFamily: 'var(--font-mono)', border: '1px solid var(--b1)' }}>
                By submitting, you agree to visit the gym in person and pay the membership fee in cash before your account is activated.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {step > 0
            ? <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={15} /> Back
              </button>
            : <Link to="/login" className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={15} /> Login
              </Link>
          }
          {step < 3
            ? <button onClick={next} className="btn-primary flex items-center gap-2">
                Next <ArrowRight size={15} />
              </button>
            : <button onClick={submit} disabled={loading} className="btn-primary flex items-center gap-2"
                style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Submitting…' : <><span>Submit Request</span><ArrowRight size={15} /></>}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
